/**
 * Model names as the audit trail records them.
 *
 * The API reports a log entry's subject as its lowercase model name — `product`,
 * `productcategory` — with no app label and no separators. They are what
 * `<RecordHistorySheet>` filters on, so one entry is needed per model whose
 * history you want to show.
 *
 * Collected here because a mistyped name **fails silently**: the history sheet
 * returns no rows rather than erroring, so a typo looks exactly like a record
 * that has never been changed.
 *
 * To verify an entry, read `subject_type` straight off a real log row:
 *
 *     GET /api/v1/activity-logs/?page_size=1
 */
export const subjectTypes = {
  // Administration — present in every project.
  user: 'user',
  role: 'group',

  // Workspace — the example domain. Replace with your own models.
  product: 'product',
  'product-categories': 'productcategory',
  brands: 'brand',
  'product-statuses': 'productstatus',
  'unit-of-measures': 'unitofmeasure',
  tags: 'tag',
} as const
