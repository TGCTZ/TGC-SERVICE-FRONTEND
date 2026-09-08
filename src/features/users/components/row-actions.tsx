import { DataTableRowActions } from '@/components/data-table'
import { type User } from '../data/schema'
import { useUserActions } from '../hooks/use-actions'

export function UsersRowActions({ user }: { user: User }) {
  return <DataTableRowActions actions={useUserActions(user)} />
}
