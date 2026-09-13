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
 * Customers matching a search term, for the order form's picker.
 *
 * The API's `search` is an OR of `icontains` across names, phone, email,
 * company and ID number, so one field finds a returning customer whether
 * reception remembers their name or reads their phone off a receipt.
 *
 * Disabled below two characters by the caller: a one-letter term matches most
 * of the table and tells nobody anything.
 */
export const customerSearchQuery = (term: string) =>
  queryOptions({
    queryKey: ['customers', 'search', term],
    queryFn: async () => {
      const res = await api.get('/customers', {
        params: { search: term, page_size: 10, ordering: 'first_name' },
      })
      return listSchema.parse(res.data).results
    },
    enabled: term.trim().length >= 2,
    staleTime: 60 * 1000,
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
