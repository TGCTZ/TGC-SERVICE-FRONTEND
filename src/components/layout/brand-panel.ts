/** Shared light-theme treatment for full-page content panels. */
export const brandPanelClassName = [
  'rounded-xl border border-white/15 bg-institutional text-institutional-foreground shadow-sm dark:border-border dark:bg-card dark:text-card-foreground',
  '[&_[data-slot=card-description]]:text-institutional-foreground/80 dark:[&_[data-slot=card-description]]:text-muted-foreground',
  '[&_[data-slot=label]]:text-institutional-foreground dark:[&_[data-slot=label]]:text-foreground',
  '[&_[data-slot=form-label]]:text-institutional-foreground dark:[&_[data-slot=form-label]]:text-foreground',
  '[&_[data-slot=form-description]]:text-institutional-foreground/80 dark:[&_[data-slot=form-description]]:text-muted-foreground',
  '[&_[data-slot=input]]:bg-background [&_[data-slot=input]]:text-foreground dark:[&_[data-slot=input]]:bg-input/30',
  '[&_[data-slot=textarea]]:bg-background [&_[data-slot=textarea]]:text-foreground dark:[&_[data-slot=textarea]]:bg-input/30',
  '[&_[data-slot=select-trigger]]:bg-background [&_[data-slot=select-trigger]]:text-foreground dark:[&_[data-slot=select-trigger]]:bg-input/30',
  '[&_[data-slot=button].bg-background]:text-foreground',
  '[&_[data-slot=table-container]]:bg-card [&_[data-slot=table-container]]:text-card-foreground dark:[&_[data-slot=table-container]]:bg-transparent dark:[&_[data-slot=table-container]]:text-foreground',
].join(' ')
