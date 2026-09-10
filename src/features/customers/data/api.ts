import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  buildListParams,
  paginatedSchema,
  toPaginated,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import { customerSchema, type Customer } from './schema'

const listSchema = paginatedSchema(customerSchema)

export async function fetchCustomers(
  params: ListParams
): Promise<Paginated<Customer>> {
  const res = await api.get('/customers', { params: buildListParams(params) })

  return toPaginated(listSchema.parse(res.data), params)
}

export const customersQuery = (params: ListParams) =>
  queryOptions({
    queryKey: ['customers', params],
    queryFn: () => fetchCustomers(params),
    placeholderData: (previous) => previous,
  })

/**
 * Every customer, for the order form's dropdown.
 *
 * Fetched whole rather than paged: the list is small enough, and a `<Select>`
 * that pages is worse than one that does not.
 */
export const customerOptionsQuery = () =>
  queryOptions({
    queryKey: ['customer-options'],
    queryFn: async () => {
      const res = await api.get('/customers', {
        params: { page_size: 200, ordering: 'first_name' },
      })
      return listSchema.parse(res.data).results
    },
    staleTime: 5 * 60 * 1000,
  })

export type CustomerPayload = Record<string, unknown>

export async function createCustomer(
  payload: CustomerPayload
): Promise<Customer> {
  const res = await api.post('/customers', payload)
  return customerSchema.parse(res.data)
}

export async function updateCustomer(
  id: number,
  payload: CustomerPayload
): Promise<Customer> {
  const res = await api.put(`/customers/${id}`, payload)
  return customerSchema.parse(res.data)
}

export async function deleteCustomer(id: number): Promise<void> {
  await api.delete(`/customers/${id}`)
}

/** Deletes are soft, so a removed customer can always be brought back. */
export async function restoreCustomer(id: number): Promise<void> {
  await api.post(`/customers/${id}/restore`)
}
