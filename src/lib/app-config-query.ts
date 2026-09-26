import { z } from 'zod'
import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'

/**
 * Facts about the deployment, not about the user.
 *
 * Anything user-shaped belongs on `/auth/me`; this is for flags that decide
 * whether a feature exists at all on this box.
 */
const appConfigSchema = z.object({
  /**
   * Whether payments can be simulated here.
   *
   * True only when the server has both DEBUG and GEPG_SIMULATE on. Read from
   * the API rather than from a build-time env var so the UI cannot disagree
   * with the server about whether the endpoint exists — a button that 404s is
   * worse than no button.
   */
  simulate_payments: z.boolean().default(false),
})

/**
 * Named apart from `config/app-config.ts`'s `AppConfig`, which is the static
 * build-time config. These are facts about the *deployment*, fetched from it.
 */
export type DeploymentConfig = z.infer<typeof appConfigSchema>

/** Facts about this deployment, fetched once from `GET /config` - e.g. whether payments can be simulated. */
export const appConfigQuery = () =>
  queryOptions({
    queryKey: ['config'],
    queryFn: async (): Promise<DeploymentConfig> => {
      const res = await api.get('/config')
      return appConfigSchema.parse(res.data)
    },
    // Deployment facts do not change while a tab is open.
    staleTime: Infinity,
  })
