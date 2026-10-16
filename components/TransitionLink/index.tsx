'use client'

import { useTransition, useRef } from 'react'
import { useRouter, Link } from '@/i18n/routing';
import NProgress from 'nprogress'
import type { ComponentProps } from 'react'
import styles from './transitionLink.module.scss';

type CustomLinkProps = ComponentProps<typeof Link>

export default function TransitionLink({
  href,
  children,
  onClick,
  ...props
}: CustomLinkProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Let the browser handle modified clicks natively
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

    // Prevent default link behavior to prevent native navigation with multiple rapid clicks
    e.preventDefault();

    // Ignore if already navigating
    if (isPending) return

    const url = typeof href === 'string' ? href : (href.pathname ?? '/')

    // prevent duplicate timers if user clicks multiple times rapidly
    if (progressTimer.current) {
      clearTimeout(progressTimer.current)
    }

    // Delay NProgress slightly to avoid flicker on instant navigations,
    // but cancel it if the transition finishes before it fires
    progressTimer.current = setTimeout(() => {
      NProgress.start()
      window.dispatchEvent(new CustomEvent('app:navigation:start'))
    }, 100)

    startTransition(() => {
      router.push(url)
    })

    onClick?.(e)
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-disabled={isPending}
      aria-busy={isPending}
      className={isPending ? styles.pending : undefined}
      {...props}
    >
      {children}
    </Link>
  )

}