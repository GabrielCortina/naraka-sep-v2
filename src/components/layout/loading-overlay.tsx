'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function LoadingOverlay() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const prevPathname = useRef(pathname)

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      setLoading(false)
      prevPathname.current = pathname
    }
  }, [pathname])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (href && href.startsWith('/') && href !== pathname) {
        setLoading(true)
      }
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [pathname])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm bg-black/40">
      <span className="text-3xl font-bold text-white tracking-wide mb-6">
        NARAKA
      </span>
      <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-white/80 rounded-full animate-loading-slide" />
      </div>
    </div>
  )
}
