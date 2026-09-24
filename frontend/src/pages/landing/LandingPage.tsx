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

function setMobileMenu(root: HTMLElement, open: boolean) {
  const menu = root.querySelector<HTMLElement>('#mobile-menu')
  const toggle = root.querySelector<HTMLButtonElement>('.nav-toggle')
  if (!menu || !toggle) return
  menu.classList.toggle('open', open)
  if (open) menu.removeAttribute('hidden')
  else menu.setAttribute('hidden', '')
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false')
  toggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç')
}

export function LandingPage() {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      const toggle = target?.closest?.('.nav-toggle') as HTMLButtonElement | null
      if (toggle) {
        e.preventDefault()
        const open = toggle.getAttribute('aria-expanded') !== 'true'
        setMobileMenu(root, open)
        return
      }

      const a = target?.closest?.('a')
      if (!a) return
      const href = a.getAttribute('href') || ''

      if (href === '/giris' || href.startsWith('/giris')) {
        e.preventDefault()
        setMobileMenu(root, false)
        navigate('/giris')
        return
      }

      if (href.startsWith('#') && href.length > 1) {
        e.preventDefault()
        const id = href.slice(1)
        const tab = a.getAttribute('data-sbtab')
        if (tab) selectProductTab(tab)
        setMobileMenu(root, false)
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
