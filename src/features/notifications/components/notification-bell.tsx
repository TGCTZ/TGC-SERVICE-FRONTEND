import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  markAllNotificationsRead,
  markNotificationRead,
  notificationKeys,
  recentNotificationsQuery,
  unreadSummaryQuery,
} from '../data/api'
import { type Notification } from '../data/schema'

/**
 * The header's notification bell: an unread badge and a panel of recent items.
 *
 * Only the unread summary is polled; the list is fetched when the panel opens.
 * Arrival toasts belong to `useNotificationWatcher`, not here — every page
 * renders its own header, so the bell remounts on each navigation and cannot
 * remember the count it last saw.
 */
export function NotificationBell() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const { data: unread = 0 } = useQuery({
    ...unreadSummaryQuery(),
    select: (summary) => summary.count,
  })
  const recent = useQuery({ ...recentNotificationsQuery(), enabled: open })

  const follow = (notification: Notification) => {
    setOpen(false)
    if (notification.link) router.history.push(notification.link)
  }

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: notificationKeys.all })

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSettled: invalidate,
  })
  const markAllRead = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSettled: invalidate,
  })

  const handleClick = (notification: Notification) => {
    if (!notification.is_read) markRead.mutate(notification.id)
    follow(notification)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='relative scale-95 rounded-full'
          aria-label={
            unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'
          }
        >
          <Bell className='size-[1.2rem]' />
          {unread > 0 && (
            <span
              aria-hidden
              className='absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-medium text-white'
            >
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-80 p-0 sm:w-96'>
        <div className='flex items-center justify-between border-b px-4 py-3'>
          <p className='text-sm font-semibold'>Notifications</p>
          <Button
            variant='link'
            size='sm'
            className='h-auto p-0 text-xs'
            disabled={unread === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            Mark all as read
          </Button>
        </div>
        <NotificationList
          items={recent.data}
          isLoading={recent.isLoading}
          onSelect={handleClick}
        />
      </PopoverContent>
    </Popover>
  )
}

function NotificationList({
  items,
  isLoading,
  onSelect,
}: {
  items: Notification[] | undefined
  isLoading: boolean
  onSelect: (notification: Notification) => void
}) {
  if (isLoading) {
    return <p className='p-4 text-sm text-muted-foreground'>Loading…</p>
  }
  if (!items?.length) {
    return (
      <p className='p-4 text-sm text-muted-foreground'>
        You&apos;re all caught up.
      </p>
    )
  }

  return (
    <ScrollArea className='max-h-96'>
      <ul className='divide-y'>
        {items.map((item) => (
          <li key={item.id}>
            <button
              type='button'
              onClick={() => onSelect(item)}
              className={cn(
                'flex w-full gap-3 px-4 py-3 text-start hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
                !item.is_read && 'bg-primary/5'
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'mt-1.5 size-2 shrink-0 rounded-full',
                  item.is_read ? 'bg-transparent' : 'bg-primary'
                )}
              />
              <span className='min-w-0 flex-1'>
                <span
                  className={cn(
                    'block text-sm',
                    !item.is_read && 'font-medium'
                  )}
                >
                  {item.title}
                </span>
                {item.body && (
                  <span className='block text-xs text-muted-foreground'>
                    {item.body}
                  </span>
                )}
                <span className='mt-1 block text-[11px] text-muted-foreground'>
                  {formatDateTime(item.created_at)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </ScrollArea>
  )
}
