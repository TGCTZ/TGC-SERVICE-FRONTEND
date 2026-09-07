/**
 * SWAP POINT — rewrite for your project.
 *
 * Fully-qualified backend class names, as the API stores them in
 * `activity_logs.subject_type`. They are what `<RecordHistorySheet>` filters
 * on, so one entry is needed per model whose history you want to show.
 *
 * Collected here because this is the only place the frontend needs to know a
 * backend namespace — and because a mistyped name **fails silently**: the
 * history sheet returns no rows rather than erroring, so a typo looks exactly
 * like a record that has never been changed.
 *
 * To verify an entry, read `subject_type` straight off a real log row:
 *
 *     GET /v1/activity-logs?filter[event]=created&per_page=1
 *
 * The `user` and `role` entries are part of the Administration tier and apply
 * to every project; the rest are the example catalogue domain and should be
 * replaced. `String.raw` keeps the single backslashes literal without the
 * escaping noise of `'App\\Models\\Product\\Product'`.
 */
export const subjectTypes = {
  // Administration — present in every project.
  user: String.raw`App\Models\User\User`,
  role: String.raw`App\Models\User\Role`,

  // Workspace — the example domain. Replace with your own models.
  product: String.raw`App\Models\Product\Product`,
  'product-categories': String.raw`App\Models\Product\ProductCategory`,
  brands: String.raw`App\Models\Product\Brand`,
  'product-statuses': String.raw`App\Models\Product\ProductStatus`,
  'unit-of-measures': String.raw`App\Models\Product\UnitOfMeasure`,
  tags: String.raw`App\Models\Product\Tag`,
} as const
