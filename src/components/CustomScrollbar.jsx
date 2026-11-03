import React, { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './CustomScrollbar.css'

const CustomScrollbar = ({ lenis, visible = true }) => {
  const thumbRef = useRef(null)
  const trackRef = useRef(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const isDraggingRef = useRef(false)
  const didDragRef = useRef(false)
  const hideTimeoutRef = useRef(null)

  useEffect(() => {
    const thumb = thumbRef.current
    const track = trackRef.current
    if (!thumb || !track) return

    const thumbHeight = 50 // Compact 50px pill

    const updateThumb = () => {
      const maxScroll = lenis ? lenis.limit : (document.documentElement.scrollHeight - window.innerHeight)
      const currentScroll = lenis ? lenis.scroll : window.scrollY
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, currentScroll / maxScroll)) : 0
      const trackHeight = window.innerHeight
      const availableHeight = trackHeight - thumbHeight
      const thumbY = progress * availableHeight

      thumb.style.transform = `translate3d(0, ${thumbY}px, 0)`
    }

    const onScroll = () => {
      if (isDraggingRef.current) return
      updateThumb()

      setIsScrolling(true)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false)
      }, 900)
    }

    // Attach to Lenis if ready, fallback to native scroll
    if (lenis) {
      lenis.on('scroll', onScroll)
    } else {
      window.addEventListener('scroll', onScroll, { passive: true })
    }

    // Keep thumb accurate on window resize or ScrollTrigger recalculation
    window.addEventListener('resize', updateThumb, { passive: true })
    ScrollTrigger.addEventListener('refresh', updateThumb)

    // Initial positioning
    updateThumb()

    // Smooth dragging with pointer capture
    let startY = 0
    let startScroll = 0

    const onPointerDown = (e) => {
      e.stopPropagation()
      e.preventDefault()
      isDraggingRef.current = true
      didDragRef.current = false
      startY = e.clientY
      startScroll = lenis ? lenis.scroll : window.scrollY
      document.body.style.userSelect = 'none'

      if (e.target.setPointerCapture) {
        try { e.target.setPointerCapture(e.pointerId) } catch { /* ignore */ }
      }

      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
    }

    const onPointerMove = (e) => {
      if (!isDraggingRef.current) return
      const deltaY = e.clientY - startY
      if (Math.abs(deltaY) > 2) {
        didDragRef.current = true
      }

      const trackHeight = window.innerHeight
      const availableHeight = trackHeight - thumbHeight
      const maxScroll = lenis ? lenis.limit : (document.documentElement.scrollHeight - window.innerHeight)
      const scrollDelta = (deltaY / availableHeight) * maxScroll
      const targetScroll = Math.max(0, Math.min(maxScroll, startScroll + scrollDelta))

      if (lenis) {
        lenis.scrollTo(targetScroll, { immediate: true })
      } else {
        window.scrollTo(0, targetScroll)
      }
      updateThumb()
    }

    const onPointerUp = (e) => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      document.body.style.userSelect = ''

      if (e.target.releasePointerCapture) {
        try { e.target.releasePointerCapture(e.pointerId) } catch { /* ignore */ }
      }

      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    const onTrackClick = (e) => {
      if (e.target === thumb || didDragRef.current) return
      const clickY = e.clientY
      const trackHeight = window.innerHeight
      const progress = clickY / trackHeight
      const maxScroll = lenis ? lenis.limit : (document.documentElement.scrollHeight - window.innerHeight)
      const target = progress * maxScroll

      if (lenis) {
        lenis.scrollTo(target, { duration: 1.1 })
      } else {
        window.scrollTo({ top: target, behavior: 'smooth' })
      }
    }

    thumb.addEventListener('pointerdown', onPointerDown)
    track.addEventListener('click', onTrackClick)

    return () => {
      if (lenis) {
        lenis.off('scroll', onScroll)
      } else {
        window.removeEventListener('scroll', onScroll)
      }
      window.removeEventListener('resize', updateThumb)
      ScrollTrigger.removeEventListener('refresh', updateThumb)
      thumb.removeEventListener('pointerdown', onPointerDown)
      track.removeEventListener('click', onTrackClick)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [lenis])

  return (
    <div
      ref={trackRef}
      className={`agency-scrollbar ${isScrolling ? 'is-scrolling' : ''} ${visible ? 'is-visible' : 'is-hidden'}`}
      aria-hidden="true"
    >
      <div ref={thumbRef} className="agency-scrollbar-thumb" />
    </div>
  )
}

export default CustomScrollbar
