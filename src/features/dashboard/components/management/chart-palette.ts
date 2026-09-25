/**
 * The two series colours the statistics draw with, per theme.
 *
 * TGC blue and TGC gold, run through the dataviz palette checker (lightness
 * band, chroma floor, colour-blind separation, contrast) against each theme's
 * card surface. Dark mode needs a deeper gold than the theme's own --chart-3:
 * #f0b832 sits above the lightness band on #0f172a. Gold is under 3:1 against
 * white, which is one reason every chart also has a table view.
 *
 * Two, deliberately: no chart here compares more than two series, and a third
 * would be a sign it should be two charts.
 */
export const PRIMARY = { theme: { light: '#0152a9', dark: '#3d8dd4' } }
export const SECONDARY = { theme: { light: '#e4a41e', dark: '#bf8a10' } }
