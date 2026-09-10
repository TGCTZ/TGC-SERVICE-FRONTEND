import { DataTableRowActions } from '@/components/data-table'
import { type Stone } from '../data/schema'
import { useStoneActions } from '../hooks/use-actions'

export function StonesRowActions({ stone }: { stone: Stone }) {
  return <DataTableRowActions actions={useStoneActions(stone)} />
}
