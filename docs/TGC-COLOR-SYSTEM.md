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

## Light-mode brand palette

- `--brand-navy` (`#0F2743`) anchors the app shell and full-page panels.
- `--brand-blue-mid` (`#112A48`) and `--brand-blue-highlight` (`#204B76`)
  complete the blue palette.
- `--brand-orange` (`#C77530`) is used for borders and decorative highlights.
  Primary actions use the deeper `#B05D25` (`--primary`) for contrast with
  white labels.
- Page headings use a navy-to-blue gradient with a subtle geometric line mesh.
  The clean gradient is available without the mesh for other surfaces.
- The light-mode sidebar uses a left-to-right navy gradient. Its hover surface
  is translucent white; its active item uses orange with white text.
- The main header and the sidebar's top and footer sections are white, with
  orange divider borders.
- Page, card, field, and table surfaces remain neutral so content stays clear
  against the branded panels.

Dark mode keeps its existing appearance. Light-mode sidebar and selected-tab
overrides are scoped so they do not alter dark-mode styles. Semantic status
colors use success, warning, danger, and info tokens. A CSS variable alone does
not create a Tailwind utility; add a mapping in `@theme inline` when a component
needs one.

## Change a token

1. Find the token in `theme.css`; keep light-theme brand values in `:root` and
   dark-theme values in `.dark`.
2. Keep paired foreground and text colors readable against their surfaces.
3. Check shared consumers, such as buttons, panels, and navigation, in both
   themes.

Use the project tokens for shared interface colors. This guide avoids copying
the palette table so the CSS remains the single source of current values.
