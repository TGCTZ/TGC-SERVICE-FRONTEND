import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Dashboard } from '@/features/dashboard'
import { RANGE_PRESETS } from '@/features/dashboard/data/analytics'

const dashboardSearchSchema = z.object({
  tab: z.enum(['operations', 'management']).optional().catch(undefined),
  range: z.enum(RANGE_PRESETS).optional().catch(undefined),
  // A custom range; both must be present. Order and length are checked where
  // the period is resolved, so a bad pair falls back instead of failing.
  from: z.iso.date().optional().catch(undefined),
  to: z.iso.date().optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/')({
  validateSearch: dashboardSearchSchema,
  component: Dashboard,
})
