import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { type LookupConfig } from '../data/config'
import { LookupMutateDialog } from './mutate-dialog'

const mocks = vi.hoisted(() => ({
  createLookupRow: vi.fn(),
  updateLookupRow: vi.fn(),
}))

/**
 * The reference list a `optionsFrom` field draws on.
 *
 * Mocked at the module seam so the dialog's `useQueries` resolves without a
 * network, while still exercising the real "collect the distinct resources and
 * fetch them once" path.
 */
vi.mock('../data/api', () => ({
  createLookupRow: mocks.createLookupRow,
  updateLookupRow: mocks.updateLookupRow,
  lookupOptionsQuery: (resource: string) => ({
    queryKey: ['lookup', resource],
    queryFn: async () => [
      { id: 7, name: 'Beryl' },
      { id: 8, name: 'Quartz' },
    ],
  }),
}))

/** Stone types: a static enum select plus a nullable decimal. */
const stoneTypes: LookupConfig = {
  resource: 'stone-types',
  slug: 'stone-types',
  title: 'Stone types',
  description: 'What the lab identifies.',
  extraFields: [
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'precious', label: 'Precious' },
        { value: 'semi_precious', label: 'Semi-precious' },
      ],
      required: true,
    },
    { key: 'price', label: 'Identification fee', type: 'money' },
  ],
}

/** Varieties: a foreign key drawn from another reference table. */
const varieties: LookupConfig = {
  resource: 'varieties',
  slug: 'varieties',
  title: 'Varieties',
  description: 'A variety within a species.',
  extraFields: [
    {
      key: 'species',
      label: 'Species',
      type: 'select',
      optionsFrom: 'species',
      required: true,
    },
  ],
}

async function renderDialog(config: LookupConfig) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return await render(
    <QueryClientProvider client={client}>
      <LookupMutateDialog
        config={config}
        currentRow={null}
        open
        onOpenChange={() => {}}
      />
    </QueryClientProvider>
  )
}

describe('LookupMutateDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createLookupRow.mockResolvedValue({ id: 1, name: 'Amethyst' })
  })

  it('renders a static select as a dropdown, not a text box', async () => {
    // The regression this guards: `type: 'select'` was declared in the config
    // and never read, so a category was typed by hand as a raw enum code.
    const screen = await renderDialog(stoneTypes)

    await expect
      .element(screen.getByRole('combobox', { name: /Category/i }))
      .toBeInTheDocument()
  })

  it('sends the chosen code and a decimal fee', async () => {
    const screen = await renderDialog(stoneTypes)

    await userEvent.fill(
      screen.getByRole('textbox', { name: /^Name/i }),
      'Amethyst'
    )
    await userEvent.click(screen.getByRole('combobox', { name: /Category/i }))
    await userEvent.click(screen.getByRole('option', { name: 'Semi-precious' }))
    await userEvent.fill(
      screen.getByLabelText(/Identification fee/i),
      '12500.50'
    )

    await userEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    await vi.waitFor(() => expect(mocks.createLookupRow).toHaveBeenCalledOnce())
    expect(mocks.createLookupRow).toHaveBeenCalledWith(
      'stone-types',
      expect.objectContaining({
        name: 'Amethyst',
        category: 'semi_precious',
        price: 12500.5,
      })
    )
  })

  it('sends null for a cleared fee, so the column is actually emptied', async () => {
    // Dropping blank values instead would silently keep the old price on a PUT.
    const screen = await renderDialog(stoneTypes)

    await userEvent.fill(
      screen.getByRole('textbox', { name: /^Name/i }),
      'Unpriced'
    )
    await userEvent.click(screen.getByRole('combobox', { name: /Category/i }))
    // `exact` matters here: "Precious" is a substring of "Semi-precious".
    await userEvent.click(
      screen.getByRole('option', { name: 'Precious', exact: true })
    )

    await userEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    await vi.waitFor(() => expect(mocks.createLookupRow).toHaveBeenCalledOnce())
    expect(mocks.createLookupRow).toHaveBeenCalledWith(
      'stone-types',
      expect.objectContaining({ price: null })
    )
  })

  it('fills an optionsFrom select from its reference table and sends the id', async () => {
    const screen = await renderDialog(varieties)

    await userEvent.fill(
      screen.getByRole('textbox', { name: /^Name/i }),
      'Amethyst'
    )
    await userEvent.click(screen.getByRole('combobox', { name: /Species/i }))
    await userEvent.click(screen.getByRole('option', { name: 'Quartz' }))

    await userEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    await vi.waitFor(() => expect(mocks.createLookupRow).toHaveBeenCalledOnce())
    // A number, not the string the form held: the API expects an id.
    expect(mocks.createLookupRow).toHaveBeenCalledWith(
      'varieties',
      expect.objectContaining({ species: 8 })
    )
  })

  it('refuses to save without a required select', async () => {
    const screen = await renderDialog(varieties)

    await userEvent.fill(
      screen.getByRole('textbox', { name: /^Name/i }),
      'Nameless species'
    )
    await userEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    await expect
      .element(screen.getByText('Species is required.'))
      .toBeInTheDocument()
    expect(mocks.createLookupRow).not.toHaveBeenCalled()
  })
})
