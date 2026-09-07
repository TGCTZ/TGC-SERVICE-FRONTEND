import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '@/components/coming-soon'

export const Route = createFileRoute('/_authenticated/reports/')({
  component: () => (
    <ComingSoon
      title='Reports'
      description='Aggregated views of the data this app manages.'
    />
  ),
})
