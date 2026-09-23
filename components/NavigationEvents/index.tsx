'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl'
import NProgress from 'nprogress'

NProgress.configure({ showSpinner: false, trickleSpeed: 200 });

export default function NavigationEvents() {
  const pathname = usePathname()
  const [message, setMessage] = useState('')
  const hasNavigated = useRef(false)

  // Localization
  const Global = useTranslations('Global');

  // Fires when pathname changes — i.e. navigation completed
  useEffect(() => {
    // Skip the initial mount so screen readers don't announce on page load
    if (!hasNavigated.current) {
      hasNavigated.current = true
      return
    }

    NProgress.done()
    setMessage(Global('messaging.pageLoaded'))
  }, [pathname])

  // Listen for navigation start events dispatched by TransitionLink component
  useEffect(() => {
    const handleStart = () => {
      setMessage(Global('messaging.loadingPage'))
    }
    window.addEventListener('app:navigation:start', handleStart)
    return () => window.removeEventListener('app:navigation:start', handleStart)
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}