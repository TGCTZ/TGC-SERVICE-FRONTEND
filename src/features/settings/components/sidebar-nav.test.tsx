import { type ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { SidebarNav } from './sidebar-nav'

const routerMocks = vi.hoisted(() => ({
  pathname: '/settings/account',
  navigate: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, ...props }: ComponentProps<'a'> & { to: string }) => (
    <a href={to} {...props} />
  ),
  useLocation: () => ({ pathname: routerMocks.pathname }),
  useNavigate: () => routerMocks.navigate,
}))

const items = [
  { title: 'Profile', href: '/settings', icon: <span>Profile icon</span> },
  {
    title: 'Account',
    href: '/settings/account',
    icon: <span>Account icon</span>,
  },
  {
    title: 'Appearance',
    href: '/settings/appearance',
    icon: <span>Appearance icon</span>,
  },
]

describe('Settings section navigation', () => {
  beforeEach(async () => {
    routerMocks.pathname = '/settings/account'
    routerMocks.navigate.mockReset()
    await page.viewport(1280, 800)
  })

  it('marks the current desktop section and links to each section', async () => {
    const screen = await render(<SidebarNav items={items} />)

    await expect
      .element(screen.getByRole('link', { name: 'Account' }))
      .toHaveAttribute('aria-current', 'page')
    await expect
      .element(screen.getByRole('link', { name: 'Appearance' }))
      .not.toHaveAttribute('aria-current', 'page')
    await expect
      .element(screen.getByRole('link', { name: 'Profile' }))
      .toHaveAttribute('href', '/settings')
  })

  it('navigates to the selected section on mobile', async () => {
    await page.viewport(375, 667)
    const screen = await render(<SidebarNav items={items} />)

    await userEvent.click(
      screen.getByRole('combobox', { name: 'Settings section' })
    )
    await userEvent.click(screen.getByRole('option', { name: 'Appearance' }))

    expect(routerMocks.navigate).toHaveBeenCalledWith({
      to: '/settings/appearance',
    })
  })

  it('treats the trailing slash as the Profile route', async () => {
    routerMocks.pathname = '/settings/'
    const screen = await render(<SidebarNav items={items} />)

    await expect
      .element(screen.getByRole('link', { name: 'Profile' }))
      .toHaveAttribute('aria-current', 'page')
  })
})
