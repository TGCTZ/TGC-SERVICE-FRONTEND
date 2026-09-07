<?php

namespace App\Services\Api\V1\Shared;

use Illuminate\Contracts\Filesystem\Cloud;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Centralised file storage for uploaded images and documents.
 *
 * Files go to the `public` disk so they are reachable over HTTP once
 * `php artisan storage:link` has been run. Callers get back the metadata
 * columns this codebase stores alongside every file (path, original name,
 * size, mime type).
 */
class FileUploadService
{
    /**
     * Store an uploaded file and return its metadata.
     *
     * @return array{path: string, original_name: string, size: int, mime_type: string}
     */
    public function store(UploadedFile $file, string $directory): array
    {
        $path = $file->store($directory, 'public');

        return [
            'path' => (string) $path,
            'original_name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'mime_type' => (string) $file->getMimeType(),
        ];
    }

    /**
     * Delete a previously stored file, ignoring one that is already gone.
     */
    public function delete(?string $path): void
    {
        if ($path === null || $path === '') {
            return;
        }

        Storage::disk('public')->delete($path);
    }

    /**
     * Absolute URL for a stored path, or null when there is no file.
     *
     * `Storage::disk()` is typed to the base Filesystem contract, which has no
     * url(); only disks implementing Cloud expose one. The check keeps this
     * honest rather than assuming the disk driver.
     */
    public function url(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        $disk = Storage::disk('public');

        return $disk instanceof Cloud ? $disk->url($path) : null;
    }
}
