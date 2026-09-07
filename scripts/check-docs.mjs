#!/usr/bin/env node
/**
 * Fails when the documentation references a file that does not exist.
 *
 * Docs rot silently: a component gets deleted and the sentence describing it
 * stays behind, still looking authoritative. This walks every markdown file,
 * pulls out anything that looks like a path into this repo, and checks that it
 * resolves.
 *
 * It checks only *paths*, never prose. Whether a description is still accurate
 * needs a human; whether `components/detail-sheet.tsx` still exists does not —
 * and that is the failure mode that actually happened here.
 *
 * Run: pnpm docs:check
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// TestAPI is the bundled backend: its own repo, its own docs, and a `vendor/`
// full of third-party READMEs whose links are none of our business.
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  'coverage',
  'vendor',
  'TestAPI',
])

/**
 * First path segments that mean "a real place in this repo".
 *
 * The allowlist is what keeps illustrative paths out of the results: the
 * walkthrough in adding-a-feature.md talks about `data/schema.ts` for a
 * hypothetical Widget feature, and `data` is not a top-level directory, so it
 * is ignored. `components/…` is, so a stale component path is caught.
 */
const REAL_ROOTS = new Set([
  'src',
  'docs',
  'scripts',
  'public',
  'assets',
  'components',
  'config',
  'context',
  'features',
  'hooks',
  'lib',
  'routes',
  'stores',
  'styles',
  'test-utils',
])

function markdownFiles(dir = ROOT, found = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue

    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      markdownFiles(full, found)
    } else if (entry.endsWith('.md')) {
      found.push(full)
    }
  }
  return found
}

/** Docs write paths both as `src/lib/api.ts` and as the shorter `lib/api.ts`. */
function resolvesAnywhere(candidate) {
  return existsSync(resolve(ROOT, candidate)) || existsSync(resolve(ROOT, 'src', candidate))
}

function looksLikeRepoPath(text) {
  if (!/^[\w./@-]+$/.test(text)) return false
  if (!text.includes('/')) return false
  if (!/\.(tsx?|mjs|json|css|ya?ml|md|html)$/.test(text)) return false

  return REAL_ROOTS.has(text.replace(/^\.\//, '').split('/')[0])
}

/**
 * Every repo path a markdown file mentions.
 *
 * Three sources, because docs reference code in three shapes: markdown links,
 * inline code spans, and bare paths inside fenced diagrams — which is exactly
 * where the stale `detail-sheet.tsx` line hid.
 */
function referencedPaths(file) {
  const text = readFileSync(file, 'utf8')
  const from = dirname(file)
  const refs = []

  for (const [, target] of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue

    const clean = target.split('#')[0]
    if (!existsSync(resolve(from, clean))) {
      refs.push({ raw: target, ok: false })
    }
  }

  const spansAndDiagrams = [
    ...[...text.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]),
    ...[...text.matchAll(/^\s*(?:[│├└─\s]*)?([\w./@-]+\.\w+)/gm)].map((m) => m[1]),
  ]

  for (const candidate of spansAndDiagrams) {
    if (!looksLikeRepoPath(candidate)) continue
    if (resolvesAnywhere(candidate)) continue

    refs.push({ raw: candidate, ok: false })
  }

  return refs
}

let failures = 0

for (const file of markdownFiles()) {
  const missing = referencedPaths(file)
  if (missing.length === 0) continue

  console.error(`\n${relative(ROOT, file)}`)
  for (const ref of new Set(missing.map((m) => m.raw))) {
    console.error(`  missing: ${ref}`)
    failures += 1
  }
}

if (failures > 0) {
  console.error(
    `\n${failures} broken reference${failures === 1 ? '' : 's'} in the docs.` +
      '\nEither the path changed, or the doc describes code that no longer exists.\n'
  )
  process.exit(1)
}

console.log('docs:check — all referenced paths exist')
