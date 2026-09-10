import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  buildListParams,
  paginatedSchema,
  toPaginated,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import { serviceProviderSchema, type ServiceProvider } from './schema'

const listSchema = paginatedSchema(serviceProviderSchema)

export async function fetchServiceProviders(
  params: ListParams
): Promise<Paginated<ServiceProvider>> {
  const res = await api.get('/service-providers', {
    params: buildListParams(params),
  })

  return toPaginated(listSchema.parse(res.data), params)
}

export const serviceProvidersQuery = (params: ListParams) =>
  queryOptions({
    queryKey: ['service-providers', params],
    queryFn: () => fetchServiceProviders(params),
    placeholderData: (previous) => previous,
  })

export type ServiceProviderPayload = Record<string, unknown>

export async function createServiceProvider(
  payload: ServiceProviderPayload
): Promise<ServiceProvider> {
  const res = await api.post('/service-providers', payload)
  return serviceProviderSchema.parse(res.data)
}

export async function updateServiceProvider(
  id: number,
  payload: ServiceProviderPayload
): Promise<ServiceProvider> {
  const res = await api.put(`/service-providers/${id}`, payload)
  return serviceProviderSchema.parse(res.data)
}

export async function deleteServiceProvider(id: number): Promise<void> {
  await api.delete(`/service-providers/${id}`)
}

/** Deletes are soft: a provider referenced by past bills is never truly gone. */
export async function restoreServiceProvider(id: number): Promise<void> {
  await api.post(`/service-providers/${id}/restore`)
}
