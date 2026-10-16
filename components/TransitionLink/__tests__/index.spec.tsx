import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TransitionLink from '../index';


const mockPush = jest.fn()
const mockStartTransition = jest.fn((cb: () => void) => cb())
let mockIsPending = false

jest.mock('@/i18n/routing', () => ({
  Link: ({
    children,
    onClick,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      {...props}
      onClick={(e) => {
        e.preventDefault()
        onClick?.(e)
      }}
    >
      {children}
    </a>
  ),
  useRouter: jest.fn(() => ({ push: mockPush })),
  usePathname: jest.fn(() => '/'),
}));

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useTransition: () => [mockIsPending, mockStartTransition],
}))

jest.mock('nprogress', () => ({
  start: jest.fn(),
  done: jest.fn(),
}))

jest.mock('./transitionLink.module.scss', () => ({
  pending: 'pending',
}))

import NProgress from 'nprogress'

const renderLink = (props = {}) =>
  render(
    <TransitionLink href="/about" {...props}>
      Go to About
    </TransitionLink>
  )

describe('TransitionLink', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockIsPending = false
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('rendering', () => {
    it('should render children correctly', () => {
      renderLink()
      expect(screen.getByText('Go to About')).toBeInTheDocument()
    })

    it('should render with the correct href', () => {
      renderLink()
      expect(screen.getByRole('link')).toHaveAttribute('href', '/about')
    })

    it('should forward extra props to the underlying Link', () => {
      renderLink({ 'data-testid': 'my-link', className: 'custom-class' })
      const link = screen.getByTestId('my-link')
      expect(link).toHaveClass('custom-class')
    })

    it('should accept an object href with a pathname', () => {
      render(
        <TransitionLink href={{ pathname: '/contact' }}>Contact</TransitionLink>
      )
      expect(screen.getByRole('link')).toBeInTheDocument()
    })
  })

  describe('normal click navigation', () => {
    it('should call router.push with a string href on click', async () => {
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      })
      renderLink()
      await user.click(screen.getByRole('link'))
      expect(mockPush).toHaveBeenCalledWith('/about')
    })

    it('should call router.push with the pathname when href is an object', async () => {
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      })
      render(
        <TransitionLink href={{ pathname: '/services' }}>Services</TransitionLink>
      )
      await user.click(screen.getByRole('link'))
      expect(mockPush).toHaveBeenCalledWith('/services')
    })

    it('should fall back to "/" when href object has no pathname', async () => {
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      })
      render(<TransitionLink href={{}}>Home</TransitionLink>)
      await user.click(screen.getByRole('link'))
      expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('should prevent default browser navigation on click', () => {
      renderLink()
      const link = screen.getByRole('link')

      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      })

      const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

      link.dispatchEvent(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should call startTransition wrapping router.push', async () => {
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      })
      renderLink()
      await user.click(screen.getByRole('link'))
      expect(mockStartTransition).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith('/about')
    })
  })

  describe('NProgress behaviour', () => {
    it('should NOT start NProgress immediately on click (debounced)', async () => {
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      })
      renderLink()
      await user.click(screen.getByRole('link'))
      expect(NProgress.start).not.toHaveBeenCalled()
    })

    it('should start NProgress after the 100 ms debounce', async () => {
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      })
      renderLink()
      await user.click(screen.getByRole('link'))
      act(() => jest.advanceTimersByTime(100))
      expect(NProgress.start).toHaveBeenCalledTimes(1)
    })

    it('should dispatch app:navigation:start event after 100 ms', async () => {
      const handler = jest.fn()
      window.addEventListener('app:navigation:start', handler)
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      })
      renderLink()
      await user.click(screen.getByRole('link'))
      act(() => jest.advanceTimersByTime(100))

      expect(handler).toHaveBeenCalledTimes(1)
      window.removeEventListener('app:navigation:start', handler)
    })
  })

  describe('modified key clicks (open in new tab / window)', () => {
    const modifiers: [string, Partial<MouseEventInit>][] = [
      ['metaKey', { metaKey: true }],
      ['ctrlKey', { ctrlKey: true }],
      ['shiftKey', { shiftKey: true }],
      ['altKey', { altKey: true }],
    ]

    it.each(modifiers)(
      'should not intercept clicks with %s held',
      async (_, modifierInit) => {
        renderLink()
        fireEvent.click(screen.getByRole('link'), modifierInit)
        expect(mockPush).not.toHaveBeenCalled()
        expect(NProgress.start).not.toHaveBeenCalled()
      }
    )
  })

  describe('pending / in-flight state', () => {
    beforeEach(() => {
      mockIsPending = true
    })

    it('should ignore clicks while a transition is already pending', async () => {
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      })
      renderLink()
      await user.click(screen.getByRole('link'))
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should set aria-disabled when pending', () => {
      renderLink()
      expect(screen.getByRole('link')).toHaveAttribute('aria-disabled', 'true')
    })

    it('should set aria-busy when pending', () => {
      renderLink()
      expect(screen.getByRole('link')).toHaveAttribute('aria-busy', 'true')
    })

    it('should apply the pending CSS class when isPending is true', () => {
      renderLink()
      expect(screen.getByRole('link')).toHaveClass('pending')
    })
  })

  describe('idle state', () => {
    it('should not apply the pending class when idle', () => {
      renderLink()
      expect(screen.getByRole('link')).not.toHaveClass('pending')
    })

    it('should set aria-disabled to false when idle', () => {
      renderLink()
      expect(screen.getByRole('link')).toHaveAttribute('aria-disabled', 'false')
    })
  })

  describe('custom onClick prop', () => {
    it('should call the consumer onClick callback after navigation', async () => {
      const onClickSpy = jest.fn()
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      })
      render(
        <TransitionLink href="/about" onClick={onClickSpy}>
          About
        </TransitionLink>
      )
      await user.click(screen.getByRole('link'))
      expect(onClickSpy).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick for modified-key clicks', () => {
      const onClickSpy = jest.fn()
      render(
        <TransitionLink href="/about" onClick={onClickSpy}>
          About
        </TransitionLink>
      )
      fireEvent.click(screen.getByRole('link'), { metaKey: true })
      expect(onClickSpy).not.toHaveBeenCalled()
    })

    it('should not call onClick when already pending', async () => {
      mockIsPending = true
      const onClickSpy = jest.fn()
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      })
      render(
        <TransitionLink href="/about" onClick={onClickSpy}>
          About
        </TransitionLink>
      )
      await user.click(screen.getByRole('link'))
      expect(onClickSpy).not.toHaveBeenCalled()
    })
  })
})