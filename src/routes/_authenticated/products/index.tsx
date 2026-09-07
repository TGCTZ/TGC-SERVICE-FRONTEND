import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/authz'
import { Products } from '@/features/products'

/**
 * Table state lives in the URL so a filtered view is shareable and survives a
 * refresh. `.catch()` keeps a malformed URL from crashing the page.
 */
const productsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  search: z.string().optional().catch(''),
  sortBy: z.string().optional().catch(undefined),
  sortDir: z.enum(['asc', 'desc']).optional().catch(undefined),
  categoryId: z.number().optional().catch(undefined),
  statusId: z.number().optional().catch(undefined),
  showDeleted: z.boolean().optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/products/')({
  beforeLoad: requirePermission(['products.viewAny']),
  validateSearch: productsSearchSchema,
  component: Products,
})
