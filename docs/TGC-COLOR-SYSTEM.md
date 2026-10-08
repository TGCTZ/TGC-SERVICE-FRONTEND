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

Brand colors use `--primary`, `--institutional`, and `--gold`. Semantic status
colors use success, warning, danger, and info tokens. Neutral surfaces and text
use background, card, muted, border, and foreground tokens. A CSS variable alone
does not create a Tailwind utility; add a mapping in `@theme inline` when a
component needs one.

## Change a token

1. Find the token in `theme.css` and inspect both light and dark values.
2. Update the source values. Keep paired foreground and text colors readable
   against the surfaces where they appear.
3. Check shared consumers, such as status badges and navigation, in both themes.

Use the project tokens for shared interface colors. This guide avoids copying
the palette table so the CSS remains the single source of current values.
