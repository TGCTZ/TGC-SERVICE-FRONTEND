# Conventions

The patterns that make every screen behave the same. **Read this before writing
a screen** — most of what looks like boilerplate has already been extracted, and
re-implementing it is how screens start to drift.

For the walkthrough, see [adding-a-feature.md](./adding-a-feature.md). This doc
is the reference you keep open while writing.

---

## 0. First: does this need a feature at all?

If your resource matches the lookup contract — `name`, `description`,
`is_active`, soft deletes, restore — **do not create a feature folder.** Add one
entry to `lookupConfigs` in
[`src/features/lookups/data/lookup-config.ts`](../src/features/lookups/data/lookup-config.ts)
and you get a table, CRUD, soft-delete/restore, permission gating and audit
history without writing a component.

Five screens already run this way. The wrong instinct — copying
`features/products/` for a table of tags — costs a folder of code that then has
to be maintained separately.

---

## 1. Tables: `<DataTable>` owns the mechanics

[`src/components/data-table/data-table.tsx`](../src/components/data-table/data-table.tsx)

**Do not call `useReactTable` in a feature.** The shared shell owns:

- the `manualPagination` / `manualSorting` / `manualFiltering` flags
- the **serial-number column**, injected from server pagination so it keeps
  counting across pages (page 2 starts at 11, not 1)
- the **row-click guard** — clicks landing on a `button`, `a`, `input` or menu
  item are ignored, so opening the actions menu does not also open the record
  behind it
- deleted-row styling
- the skeleton and empty states

Your feature supplies four things: `columns`, `state`, `onStateChange`, and a
`toolbar` node for the filters.

```tsx
<DataTable
  columns={columns}
  data={data?.items ?? []}
  meta={data?.meta}
  isFetching={isPending || isFetching}
  state={state}
  onStateChange={handleStateChange}
  onRowClick={(row) => select('view', row)}
  isRowDeleted={(row) => Boolean(row.deleted_at)}
  toolbar={toolbar}
  emptyMessage='No widgets found.'
/>
```

> **`toolbar` is a prop, not a component.** There is no `DataTableToolbar` —
> you pass whatever inputs and selects the screen needs.

### Column budget

**Six columns**: the serial number, four data columns, and the actions menu.
Everything else belongs in the record's view.

This is a convention, not something the code enforces — `DataTable` injects the
serial column but does not cap the count. Pick the four a user *scans* for;
`DataTableViewOptions` still lets them re-enable a hidden column.

### Table state lives in the URL

Paging, sorting and filters go through `validateSearch` on the route so a
filtered view is shareable and survives a refresh.
[`src/lib/api-query.ts`](../src/lib/api-query.ts) translates that state into the
API's query contract — including `filter[field][from]/[to]` ranges and the
`trashed` flag.

---

## 2. Row actions are data, not JSX

[`src/components/data-table/row-actions.tsx`](../src/components/data-table/row-actions.tsx)

Return a `RowAction[]` and let the shared renderer draw it. Permission filtering
then happens in exactly one place instead of being re-implemented per screen.

The same list feeds **two** renderers, which is the reason for declaring it as
data rather than JSX:

- `<DataTableRowActions>` — icon buttons inline in the table cell, wrapping
  rather than shrinking when the column is tight
- `<RowActionButtons>` — icon **and** label, for the record's view dialog

So build the list in a hook, not inside the cell component — see
`use-product-actions.ts` — and pass it to both.

```tsx
const actions: RowAction[] = [
  { label: 'View', icon: Eye, permission: 'widgets.view', onSelect: () => select('view') },
  { label: 'Edit', icon: Pencil, permission: 'widgets.update', onSelect: () => select('update'), hidden: isDeleted },
  { label: 'History', icon: History, permission: 'activity-logs.viewAny', onSelect: () => select('history') },
  { label: 'Restore', icon: RotateCcw, permission: 'widgets.restore', onSelect: () => select('restore'), hidden: !isDeleted, separatorBefore: true },
  { label: 'Delete', icon: Trash2, permission: 'widgets.delete', onSelect: () => select('delete'), variant: 'destructive', hidden: isDeleted, separatorBefore: true },
]
```

| Field | Use |
| --- | --- |
| `permission` | A string or array; the user needs one of them |
| `hidden` | Structural absence — Restore on a live record |
| `variant: 'destructive'` | Red styling |
| `separatorBefore` | Draws a divider before it, fencing destructive actions off; suppressed if it would land first |

`hidden` and `permission` are different things: `hidden` means *not applicable
to this row*, `permission` means *not allowed for this user*.

---

## 3. View is the edit form, read-only

There is no separate detail component. The mutate dialog takes `readOnly`, and
the same fields you edit are the fields you read — so the two cannot drift.

```tsx
<WidgetMutateDialog
  key={currentRow ? `widget-${currentRow.id}` : 'create'}
  open={open === 'view' || open === 'create' || open === 'update'}
  currentRow={open === 'create' ? null : currentRow}
  readOnly={open === 'view'}
  onRequestEdit={() => setOpen('update')}
/>
```

Inside the dialog, wrap the body in **one** disabled `fieldset`:

```tsx
<fieldset disabled={readOnly} className='grid gap-4 sm:grid-cols-2'>
```

**Why a `fieldset` rather than a `disabled` prop per field:** a native fieldset
disables every descendant control, including Radix `Select` and `Checkbox`
triggers (they are buttons) and the bare file inputs that sit *outside*
react-hook-form. Threading `disabled` through each field misses exactly those.

The footer swaps **Save** for **Edit**, behind `<Can permission='…update'>`.

---

## 4. Dialog layout

Any dialog with a scrolling body:

```tsx
<DialogContent className='flex max-h-[90vh] flex-col overflow-hidden sm:max-w-3xl'>
  <DialogHeader>…</DialogHeader>
  <DialogBody>…</DialogBody>
  <DialogFooter>…</DialogFooter>
</DialogContent>
```

[`src/components/dialog-body.tsx`](../src/components/dialog-body.tsx) explains
the two details that carry the behaviour — `min-h-0`, and why it uses native
overflow rather than Radix `ScrollArea`. Both were bugs before they were rules.

---

## 5. Soft deletes

Deletes are soft everywhere; there is **no force delete** in the UI, the API or
the permission set.

For a soft-deletable resource:

- a **Show deleted** toggle in the toolbar, sending `trashed: 'with'`
- `isRowDeleted` on `<DataTable>` for the red tint and edge marker
- **Restore** replacing **Delete** in the row menu

Not every table has this. Audit logs and system logs are append-only, and roles
live in spatie's tables which have no soft deletes — those three have no toggle.

---

## 6. Permission gating

Three tools, one source of truth — the permission list on the signed-in user:

| Where | Tool |
| --- | --- |
| Route | `requirePermission(['widgets.viewAny'])` in `beforeLoad` |
| UI | `<Can permission='widgets.create'>` |
| Sidebar and ⌘K palette | `filterNavGroups`, via the `permission` field on nav entries |

Gate on **permissions**, never roles. A role gate drifts the moment someone
edits that role from the Roles screen.

Hiding UI is usability, not security — the API enforces every one of these
independently. The point of using the same vocabulary on both sides is that the
sidebar never offers a page that immediately 403s.

---

## 7. Required-field markers are automatic

Import `zodResolver` from
[`src/lib/zod-resolver.ts`](../src/lib/zod-resolver.ts) rather than
`@hookform/resolvers/zod`, and every required field gets a red asterisk with no
further work:

```tsx
import { zodResolver } from '@/lib/zod-resolver'

const form = useForm({ resolver: zodResolver(formSchema) })
```

The wrapper tags the schema onto the resolver, react-hook-form stores it on
`control`, and `<Form>` reads it back. So the markers come from **the schema
that actually validates the form** — a hand-maintained `required` prop per
label drifts the moment a field's optionality changes, and nothing catches it.

`.optional()` and `.default()` both count as not-required: in either case the
user need not supply a value. `<FormControl>` also sets `aria-required`, which
is what conveys the requirement to a screen reader — the asterisk is
`aria-hidden` decoration.

For a form that is not react-hook-form based, import `RequiredMark` from
`@/components/ui/form` and place it in the label yourself; the lookup dialog
does this.

---

## 8. Formatting

Never call `toLocaleString()`, `toLocaleDateString()` or `Intl.NumberFormat`
directly. Import from [`src/lib/format.ts`](../src/lib/format.ts):
`formatMoney`, `formatDate`, `formatDateTime`, `formatTime`.

A bare `toLocaleString()` follows the *viewer's* browser locale, so the same
record reads differently on two machines.

---

## 9. Record history

Any model in [`src/lib/subject-types.ts`](../src/lib/subject-types.ts) gets a
timeline for free:

```tsx
<RecordHistorySheet
  subjectType={subjectTypes.widget}
  subjectId={widget.id}
  title={widget.name}
  open={open === 'history'}
  onOpenChange={(isOpen) => !isOpen && setOpen(null)}
/>
```

Add the row action behind `<Can permission='activity-logs.viewAny'>`. Remember
the silent-failure warning in
[customizing.md](./customizing.md#7-audit-subjects--srclibsubject-typests--fails-silently).

---

## 10. Data fetching

- One `queryOptions` factory per query, colocated in `data/*-api.ts`
- Parse every response with Zod **at the boundary** — a schema change surfaces
  as a parse error at the fetch, not as `undefined` three components deep
- `placeholderData: (previous) => previous` on lists, so paging does not flash a
  skeleton on every keystroke
- Map 422s back onto form fields with `form.setError`; toast everything else

## 11. Docblocks

Every exported symbol outside `src/features/` carries a TSDoc block, so hovering
it in an editor explains it. Two tiers, because a rule that demands `@param` on
a `<div>` wrapper gets ignored within a week.

### Tier A — anything with real parameters

Functions, hooks, providers, stores, and components with a meaningful props
object. Full tags.

```ts
/**
 * One-line summary, imperative mood.
 *
 * The WHY — what problem this solves, what is non-obvious, what breaks if it
 * is used wrongly. This is the part that earns its keep.
 *
 * @param params - What the object as a whole represents
 * @param params.navigate - Router navigate fn; must replace, not push
 * @returns What the caller gets back
 * @example
 * const { pagination } = useTableUrlState({ search, navigate })
 */
```

### Tier B — presentational sub-components

The parts in `src/components/ui/` that only spread props onto an element:
`CardHeader`, `TableCell`, `SheetFooter`. One line, no tags.

```ts
/** The title row of a `Card`. Renders a `<div>`; accepts all div props. */
```

No `@param` here on purpose. The tag would restate
`React.ComponentProps<'div'>`, which the editor already shows next to the
docblock — a summary is what hover is missing, the parameter list is not.

**Escalate a Tier B component to Tier A when it has behaviour you could get
wrong.** `DialogContent` carries a layout contract, `SidebarProvider` persists
to a cookie, `Table` wraps itself in a scroll container. Those need the why.

### Link, do not restate

When the reasoning already lives somewhere, point at it. `dialog-body.tsx`
explains the dialog layout traps; `sidebar-data.ts` explains the navigation
tiers; `subject-types.ts` explains why a typo there fails silently. Copying
those into a second docblock just creates a second thing to go stale — the
same rule the [docs README](./README.md) sets out.

---

## Checklist for a new screen

- [ ] Could this be a lookup config entry instead of a feature?
- [ ] Uses `<DataTable>`, not its own `useReactTable`
- [ ] Six columns including SN and actions
- [ ] Actions declared as `RowAction[]` with permissions
- [ ] View reuses the mutate dialog with `readOnly`
- [ ] Show deleted toggle, if the resource soft-deletes
- [ ] Route guarded with `requirePermission`
- [ ] Sidebar entry carries its `permission`
- [ ] Dates and money go through `lib/format.ts`
- [ ] `subject-types.ts` entry, if you want history
- [ ] Checked as `viewer@test.com` — the menu should collapse to View
