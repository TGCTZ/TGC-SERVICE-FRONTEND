import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { subjectTypes } from '@/lib/subject-types'
import { Button } from '@/components/ui/button'
import { Can } from '@/components/can'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { RecordHistorySheet } from '@/components/record-history-sheet'
import { ThemeSwitch } from '@/components/theme-switch'
import { GeneralError } from '@/features/errors/general-error'
import { ProductDeleteDialog } from './components/product-delete-dialog'
import { ProductMutateDialog } from './components/product-mutate-dialog'
import { ProductRestoreDialog } from './components/product-restore-dialog'
import { ProductsProvider, useProducts } from './components/products-provider'
import {
  ProductsTable,
  type ProductsQueryState,
} from './components/products-table'
import { useProductActions } from './components/use-product-actions'
import { productsQueryOptions } from './data/products-api'

const route = getRouteApi('/_authenticated/products/')

export function Products() {
  return (
    <ProductsProvider>
      <ProductsContent />
    </ProductsProvider>
  )
}

function ProductsContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { open, setOpen, currentRow, setCurrentRow } = useProducts()

  // The same list the table cell renders, so the view dialog offers exactly
  // the actions the row does.
  const actions = useProductActions(currentRow)

  // Table state lives in the URL, so a filtered view is shareable and survives
  // a refresh or a back-navigation.
  const state: ProductsQueryState = {
    page: search.page ?? 1,
    perPage: search.pageSize ?? 10,
    search: search.search ?? '',
    sortBy: search.sortBy,
    sortDir: search.sortDir,
    categoryId: search.categoryId,
    statusId: search.statusId,
    showDeleted: search.showDeleted,
  }

  const { data, isPending, isError, isFetching } = useQuery(
    productsQueryOptions({
      page: state.page,
      perPage: state.perPage,
      search: state.search,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      filters: {
        product_category_id: state.categoryId,
        product_status_id: state.statusId,
      },
      trashed: state.showDeleted ? 'with' : undefined,
    })
  )

  function handleStateChange(next: Partial<ProductsQueryState>) {
    navigate({
      search: (prev) => ({
        ...prev,
        page: next.page ?? prev.page,
        pageSize: next.perPage ?? prev.pageSize,
        search: next.search !== undefined ? next.search : prev.search,
        sortBy: 'sortBy' in next ? next.sortBy : prev.sortBy,
        sortDir: 'sortDir' in next ? next.sortDir : prev.sortDir,
        categoryId: 'categoryId' in next ? next.categoryId : prev.categoryId,
        statusId: 'statusId' in next ? next.statusId : prev.statusId,
        showDeleted:
          'showDeleted' in next ? next.showDeleted : prev.showDeleted,
      }),
      replace: true,
    })
  }

  return (
    <>
      <Header fixed>
        <div className='ms-auto flex items-center gap-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Products</h2>
            <p className='text-muted-foreground'>
              Manage your product catalogue.
            </p>
          </div>

          <Can permission='products.create'>
            <Button
              onClick={() => {
                setCurrentRow(null)
                setOpen('create')
              }}
            >
              Add product
              <Plus className='ms-1 size-4' />
            </Button>
          </Can>
        </div>

        {isError ? (
          <GeneralError minimal className='h-auto py-12' />
        ) : (
          <ProductsTable
            data={data?.items ?? []}
            meta={data?.meta}
            isFetching={isPending || isFetching}
            state={state}
            onStateChange={handleStateChange}
            onRowClick={(product) => {
              setCurrentRow(product)
              setOpen('view')
            }}
          />
        )}
      </Main>

      {currentRow && (
        <RecordHistorySheet
          subjectType={subjectTypes.product}
          subjectId={currentRow.id}
          title={currentRow.name}
          open={open === 'history'}
          onOpenChange={(isOpen) => {
            if (!isOpen) setOpen(null)
          }}
        />
      )}

      {/*
        View and Edit are the same dialog. Reusing it means a record reads
        exactly as it edits - same fields, same order, same labels - instead of
        the two drifting apart as a separate detail layout would.
      */}
      <ProductMutateDialog
        key={currentRow ? `product-${currentRow.id}` : 'create'}
        open={open === 'view' || open === 'create' || open === 'update'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen(null)
            setCurrentRow(null)
          }
        }}
        currentRow={open === 'create' ? null : currentRow}
        readOnly={open === 'view'}
        onRequestEdit={() => setOpen('update')}
        actions={actions}
      />

      {currentRow && (
        <ProductRestoreDialog
          open={open === 'restore'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setOpen(null)
              setCurrentRow(null)
            }
          }}
          currentRow={currentRow}
        />
      )}

      {currentRow && (
        <ProductDeleteDialog
          open={open === 'delete'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setOpen(null)
              setCurrentRow(null)
            }
          }}
          currentRow={currentRow}
        />
      )}
    </>
  )
}
