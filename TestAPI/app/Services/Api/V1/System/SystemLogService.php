<?php

namespace App\Services\Api\V1\System;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

/**
 * Read-only access to Laravel's own log files.
 *
 * Deliberately has no model or repository: there is no table behind this, so
 * the usual 8-layer stack does not apply. It still returns a
 * LengthAwarePaginator so the HTTP response is shaped like every other list
 * endpoint and the frontend needs no special case.
 */
class SystemLogService
{
    /**
     * Never read more than this from a single file.
     *
     * Log files grow without bound; loading one whole into memory is how a
     * debugging endpoint takes the server down. Only the newest slice is read.
     */
    private const MAX_BYTES = 2097152; // 2 MB

    /** Hard ceiling on parsed entries per request. */
    private const MAX_ENTRIES = 5000;

    /**
     * Patterns whose captured values are masked before anything leaves the
     * server.
     *
     * Logs capture request payloads and stack traces, so they hold material
     * that never appears in a database row. Redacting here means holding
     * `system-logs.viewAny` does not become a way to harvest credentials.
     *
     * @var array<int, string>
     */
    private const REDACT_PATTERNS = [
        '/(password"?\s*[:=]\s*"?)([^",;\s]+)/i',
        '/(password_confirmation"?\s*[:=]\s*"?)([^",;\s]+)/i',
        '/(token"?\s*[:=]\s*"?)([^",;\s]+)/i',
        '/(secret"?\s*[:=]\s*"?)([^",;\s]+)/i',
        '/(api[_-]?key"?\s*[:=]\s*"?)([^",;\s]+)/i',
        '/(authorization:\s*bearer\s+)(\S+)/i',
    ];

    /** The standard Laravel prefix: [2026-09-04 07:19:33] local.ERROR: ... */
    private const ENTRY_PATTERN = '/^\[(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2})[^\]]*\]\s*(\S+?)\.(\w+):\s*(.*)$/';

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    public function getAll(array $params = []): LengthAwarePaginator
    {
        $entries = $this->applyFilters($this->readEntries(), $params);

        $perPage = max(1, min((int) ($params['per_page'] ?? 25), 100));
        $page = max(1, (int) ($params['page'] ?? 1));

        /** @var LengthAwarePaginator<int, array<string, mixed>> $paginator */
        $paginator = new LengthAwarePaginator(
            $entries->forPage($page, $perPage)->values()->all(),
            $entries->count(),
            $perPage,
            $page,
            ['path' => request()->url(), 'query' => request()->query()]
        );

        return $paginator;
    }

    /**
     * Distinct levels present, so the UI offers a filter list grounded in what
     * the files actually contain rather than a guessed enum.
     *
     * @return array<int, string>
     */
    public function levels(): array
    {
        return $this->readEntries()
            ->pluck('level')
            ->unique()
            ->sort()
            ->values()
            ->all();
    }

    /**
     * Parse every log file, newest entry first.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function readEntries(): Collection
    {
        /** @var Collection<int, array<string, mixed>> $entries */
        $entries = collect();

        foreach ($this->logFiles() as $path) {
            foreach ($this->parseFile($path) as $entry) {
                $entries->push($entry);
            }

            if ($entries->count() >= self::MAX_ENTRIES) {
                break;
            }
        }

        return $entries
            ->sortByDesc('logged_at')
            ->values()
            ->map(function (array $entry, int $index): array {
                // Synthetic id: there is no table, but the frontend table needs
                // a stable key per row.
                $entry['id'] = $index + 1;

                return $entry;
            });
    }

    /**
     * Log files, newest first.
     *
     * @return array<int, string>
     */
    private function logFiles(): array
    {
        $directory = storage_path('logs');

        if (! File::isDirectory($directory)) {
            return [];
        }

        return collect(File::files($directory))
            ->filter(fn ($file): bool => $file->getExtension() === 'log')
            ->sortByDesc(fn ($file): int => $file->getMTime())
            ->map(fn ($file): string => $file->getPathname())
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function parseFile(string $path): array
    {
        $size = filesize($path);

        if ($size === false || $size === 0) {
            return [];
        }

        $handle = fopen($path, 'rb');

        if ($handle === false) {
            return [];
        }

        if ($size > self::MAX_BYTES) {
            fseek($handle, $size - self::MAX_BYTES);
            // The seek lands mid-line; discard that partial line.
            fgets($handle);
        }

        $entries = [];
        $current = null;
        $file = basename($path);

        while (($line = fgets($handle)) !== false) {
            if (preg_match(self::ENTRY_PATTERN, $line, $matches) === 1) {
                if ($current !== null) {
                    $entries[] = $current;
                }

                $current = [
                    'logged_at' => $matches[1],
                    'environment' => $matches[2],
                    'level' => strtolower($matches[3]),
                    'message' => $this->redact(rtrim($matches[4])),
                    'context' => '',
                    'file' => $file,
                ];

                continue;
            }

            // A continuation line belongs to the previous entry's stack trace.
            if ($current !== null) {
                $current['context'] .= $this->redact($line);
            }
        }

        if ($current !== null) {
            $entries[] = $current;
        }

        fclose($handle);

        return $entries;
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $entries
     * @param  array<string, mixed>  $params
     * @return Collection<int, array<string, mixed>>
     */
    private function applyFilters(Collection $entries, array $params): Collection
    {
        /** @var array<string, mixed> $filters */
        $filters = (array) ($params['filter'] ?? []);

        $level = $filters['level'] ?? null;

        if (is_string($level) && $level !== '') {
            $levels = array_map('strtolower', explode(',', $level));
            $entries = $entries->filter(
                fn (array $entry): bool => in_array($entry['level'], $levels, true)
            );
        }

        $range = $filters['logged_at'] ?? null;

        if (is_array($range)) {
            $from = trim((string) ($range['from'] ?? ''));
            $to = trim((string) ($range['to'] ?? ''));

            if ($from !== '') {
                $entries = $entries->filter(
                    fn (array $e): bool => substr((string) $e['logged_at'], 0, 10) >= $from
                );
            }

            if ($to !== '') {
                $entries = $entries->filter(
                    fn (array $e): bool => substr((string) $e['logged_at'], 0, 10) <= $to
                );
            }
        }

        $search = trim((string) ($params['search'] ?? ''));

        if ($search !== '') {
            $entries = $entries->filter(
                fn (array $entry): bool => Str::contains(
                    $entry['message'].' '.$entry['context'],
                    $search,
                    true
                )
            );
        }

        return $entries->values();
    }

    private function redact(string $text): string
    {
        foreach (self::REDACT_PATTERNS as $pattern) {
            $text = preg_replace($pattern, '$1[REDACTED]', $text) ?? $text;
        }

        return $text;
    }
}
