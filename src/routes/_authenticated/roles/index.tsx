import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/authz'
import { perm } from '@/lib/permissions'
import { Roles } from '@/features/roles'

export const Route = createFileRoute('/_authenticated/roles/')({
  beforeLoad: requirePermission([perm('roles', 'view')]),
  component: Roles,
})
