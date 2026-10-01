import { appConfig } from '@/config/app-config'
import { cn } from '@/lib/utils'
import logoUrl from './tgc-logo.webp'

type LogoProps = Omit<React.ComponentProps<'img'>, 'src'>

/**
 * The TGC crest.
 *
 * A raster rather than an inline SVG, because the mark is a photographic
 * illustration — Kilimanjaro, the eagle, the diamond — not a flat shape that
 * could inherit `currentColor`. It carries its own light ground inside the gold
 * ring, so it reads on both themes without a dark variant.
 *
 * Imported rather than referenced from `public/`, so Vite fingerprints it and
 * it can be cached forever. WebP at 256px: a quarter the size of the equivalent
 * PNG, and every browser the build targets supports it.
 *
 * The ring text is illegible below roughly 64px, which is expected for a crest
 * — at small sizes it reads as a mark, and the wordmark beside it carries the
 * words.
 *
 * `alt` defaults to the app name. Pass `alt=''` where a visible caption already
 * names the app, so a screen reader does not announce it twice.
 */
export function Logo({ className, alt = appConfig.name, ...props }: LogoProps) {
  return (
    <img
      id='app-logo'
      src={logoUrl}
      alt={alt}
      width={256}
      height={256}
      className={cn('size-6 object-contain', className)}
      {...props}
    />
  )
}
