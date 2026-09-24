import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import landingHtml from './landing-body.html?raw'
import './landing.css'

function scrollSectionFlush(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
}

function selectProductTab(tabId: string) {
  const input = document.getElementById(tabId) as HTMLInputElement | null
  if (input) {
    input.checked = true
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

export function LandingPage() {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a')
      if (!a) return
      const href = a.getAttribute('href') || ''

      if (href === '/giris' || href.startsWith('/giris')) {
        e.preventDefault()
        navigate('/giris')
        return
      }

      if (href.startsWith('#') && href.length > 1) {
        e.preventDefault()
        const id = href.slice(1)
        const tab = a.getAttribute('data-sbtab')
        if (tab) selectProductTab(tab)
        scrollSectionFlush(id)
        history.replaceState(null, '', href)
      }
    }

    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [navigate])

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (!hash) return
    requestAnimationFrame(() => scrollSectionFlush(hash))
  }, [])

  return (
    <div
      ref={rootRef}
      className="landing-root"
      dangerouslySetInnerHTML={{ __html: landingHtml }}
    />
  )
}
