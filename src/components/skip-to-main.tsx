/**
 * A skip link that jumps past the navigation to `#content`.
 *
 * Visually hidden until focused, then slides into view. Without it a keyboard
 * or screen-reader user tabs through every sidebar link on every page before
 * reaching the content — WCAG 2.4.1 exists for this.
 *
 * Render it as the **first focusable element** in the layout, and keep an
 * element with `id="content"` on the page; `components/layout/main.tsx`
 * provides it.
 */
export function SkipToMain() {
  return (
    <a
      className={`fixed inset-s-44 z-999 -translate-y-52 bg-primary px-4 py-2 text-sm font-medium whitespace-nowrap text-primary-foreground opacity-95 shadow-sm transition hover:bg-primary/90 focus:translate-y-3 focus:transform focus-visible:ring-1 focus-visible:ring-ring`}
      href='#content'
    >
      Skip to Main
    </a>
  )
}
