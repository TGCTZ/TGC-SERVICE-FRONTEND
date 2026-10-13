# Theme tokens

The theme source is [`src/styles/theme.css`](../src/styles/theme.css); base styles
are in [`src/styles/index.css`](../src/styles/index.css). Use those files as the
source of truth for token names and values.

## Where values live

- `:root` defines the light theme and shared values.
- `.dark` overrides values that change in dark mode.
- `@theme inline` maps CSS variables to Tailwind utilities. For example,
  `--color-background` makes `bg-background` available.
- `--radius` sets the base used by the radius utilities.

## Current light palette

- Navy `#0F2743` anchors the app shell and full-page panels.
- Mid and highlight blues `#112A48` and `#204B76` create the page-heading
  gradient.
- Orange `#C77530` is the highlight color. Primary buttons use the deeper
  `#B05D25` so white labels meet contrast requirements.
- Page, card, form-field, and table surfaces stay neutral for readable content.
- Page headings layer a low-contrast geometric line mesh over the gradient.

Dark mode has its own existing token values and is not changed by the light-mode
rebrand. Semantic status colors use success, warning, danger, and info tokens.
A CSS variable alone does not create a Tailwind utility; add a mapping in
`@theme inline` when a component needs one.

## Change a token

1. Find the token in `theme.css`; keep light-theme brand values in `:root` and
   dark-theme values in `.dark`.
2. Keep paired foreground and text colors readable against their surfaces.
3. Check shared consumers, such as buttons, panels, and navigation, in both
   themes.

Use the project tokens for shared interface colors. This guide avoids copying
the palette table so the CSS remains the single source of current values.
