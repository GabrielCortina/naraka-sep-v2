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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <span className="font-extrabold uppercase tracking-[0.15em] text-[#111111]" style={{ fontSize: '40px' }}>
        NARAKA | SEP
      </span>
      <div className="w-40 h-0.5 rounded-full overflow-hidden mt-2.5" style={{ backgroundColor: '#f0f0f0' }}>
        <div className="h-full w-1/3 rounded-full animate-loading-slide" style={{ backgroundColor: '#d0d0d0' }} />
      </div>
    </div>
  )
}
