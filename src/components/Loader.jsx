import React, { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import './Loader.css'

const Loader = ({ onComplete, onStartAudio, soundOn = true }) => {
  const [mounted, setMounted] = useState(true)
  const [needsClick, setNeedsClick] = useState(false)

  const wrapperRef = useRef(null)
  const mainLayerRef = useRef(null)
  const prelayer1Ref = useRef(null) // Red (#ff3344)
  const prelayer2Ref = useRef(null) // Midnight (#16192b)
  const prelayer3Ref = useRef(null) // Charcoal (#0b0c10)
  const contentRef = useRef(null)
  const enterRef = useRef(null)
  const canvasRef = useRef(null)
  const progressCircleRef = useRef(null)
  const animTriggeredRef = useRef(false)
  const hasInteractedRef = useRef(false)

  const onCompleteRef = useRef(onComplete)
  const onStartAudioRef = useRef(onStartAudio)
  const soundOnRef = useRef(soundOn)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    onStartAudioRef.current = onStartAudio
  }, [onStartAudio])

  useEffect(() => {
    soundOnRef.current = soundOn
  }, [soundOn])

  // 1. Dog Canvas Runner — high-precision, rock-solid frame animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const dogImg = new Image()
    dogImg.src = '/loader/dog.png'

    const shadowImg = new Image()
    shadowImg.src = '/loader/shadow.png'

    let frame = 0
    let lastTime = 0
    let rafId
    const fps = 24
    const interval = 1000 / fps

    const render = (currentTime) => {
      rafId = requestAnimationFrame(render)

      if (currentTime - lastTime < interval) return
      lastTime = currentTime

      ctx.clearRect(0, 0, 130, 130)

      // Draw shadow
      if (shadowImg.complete && shadowImg.naturalWidth) {
        ctx.drawImage(shadowImg, (130 - 128) / 2, 88, 128, 16)
      }

      // Draw animated red running dog (16 frames of 256x256 in 4096x256 image)
      if (dogImg.complete && dogImg.naturalWidth) {
        ctx.drawImage(dogImg, frame * 256, 0, 256, 256, 0, 0, 130, 130)
      }

      frame = (frame + 1) % 16
    }

    rafId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [])

  const startStaggeredExit = () => {
    if (animTriggeredRef.current) return
    animTriggeredRef.current = true

    const mainLayer = mainLayerRef.current
    const pre1 = prelayer1Ref.current
    const pre2 = prelayer2Ref.current
    const pre3 = prelayer3Ref.current
    const content = contentRef.current
    const enterEl = enterRef.current

    if (!mainLayer || !pre1 || !pre2 || !pre3) {
      if (onCompleteRef.current) onCompleteRef.current()
      setMounted(false)
      return
    }

    const tl = gsap.timeline({
      onComplete: () => {
        setMounted(false)
      },
    })

    // A) Fade out dog, progress circle, and enter button
    if (content) {
      tl.to(
        content,
        {
          opacity: 0,
          scale: 0.92,
          duration: 0.22,
          ease: 'power2.in',
        },
        0
      )
    }

    if (enterEl) {
      tl.to(
        enterEl,
        {
          opacity: 0,
          y: -10,
          duration: 0.2,
          ease: 'power2.in',
        },
        0
      )
    }

    // B) Multi-layer staggered wipe to the left (xPercent: -100)
    const layers = [mainLayer, pre1, pre2, pre3]
    const layerDuration = 0.72

    layers.forEach((layer, i) => {
      tl.to(
        layer,
        {
          xPercent: -100,
          duration: layerDuration,
          ease: 'power4.inOut',
        },
        0.04 + i * 0.07
      )
    })

    // C) Trigger Hero Section entrance together as the last layer wipes across and clears
    tl.call(
      () => {
        if (onCompleteRef.current) {
          onCompleteRef.current()
        }
      },
      null,
      0.44
    )
  }

  const handleUserClick = (e) => {
    if (e) {
      e.stopPropagation()
    }
    hasInteractedRef.current = true

    if (soundOnRef.current && onStartAudioRef.current) {
      onStartAudioRef.current().catch(() => {})
    }

    if (needsClick) {
      setNeedsClick(false)
      startStaggeredExit()
    }
  }

  // 2. Exact 2-Second Loader Progress & Auto / Interactive Gate
  useEffect(() => {
    const circumference = 420.973415581
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
    const duration = isMobile ? 1100 : 2000
    const startTime = performance.now()
    let rafId

    const handleProgressDone = () => {
      // If user already clicked anywhere while the dog was running
      if (hasInteractedRef.current) {
        if (soundOnRef.current && onStartAudioRef.current) {
          onStartAudioRef.current().catch(() => {})
        }
        startStaggeredExit()
        return
      }

      // If sound is off or no audio starter, exit directly
      if (!soundOnRef.current || !onStartAudioRef.current) {
        startStaggeredExit()
        return
      }

      // Check if the browser allows unmuted audio autoplay
      onStartAudioRef.current()
        .then(() => {
          // Browser allowed autoplay! Wipe open seamlessly
          startStaggeredExit()
        })
        .catch(() => {
          // Browser blocked unmuted autoplay due to policy!
          // Display the 'Click to Enter' interactive prompt
          setNeedsClick(true)
        })
    }

    const tick = (now) => {
      const elapsed = now - startTime
      const progressPercent = Math.min(100, (elapsed / duration) * 100)

      if (progressCircleRef.current) {
        const offset = Math.max(0, circumference - (circumference * progressPercent) / 100)
        progressCircleRef.current.style.strokeDashoffset = `${offset}`
      }

      if (elapsed < duration) {
        rafId = requestAnimationFrame(tick)
      } else {
        if (progressCircleRef.current) {
          progressCircleRef.current.style.strokeDashoffset = '0'
        }
        handleProgressDone()
      }
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [])

  // Auto-enter fallback after 4.5 seconds if user is idle
  useEffect(() => {
    if (needsClick) {
      const fallbackTimer = setTimeout(() => {
        startStaggeredExit()
      }, 4500)
      return () => clearTimeout(fallbackTimer)
    }
  }, [needsClick])

  if (!mounted) return null

  const circumference = 420.973415581

  return (
    <div
      ref={wrapperRef}
      className={`site-loader-wrapper ${needsClick ? 'needs-click' : ''}`}
      onClick={handleUserClick}
      aria-label="Loading site"
    >
      {/* Prelayers stacked under the main layer for staggered wipe */}
      <div ref={prelayer3Ref} className="loader-prelayer prelayer-3" aria-hidden="true" />
      <div ref={prelayer2Ref} className="loader-prelayer prelayer-2" aria-hidden="true" />
      <div ref={prelayer1Ref} className="loader-prelayer prelayer-1" aria-hidden="true" />

      {/* Main loader panel */}
      <div ref={mainLayerRef} className="loader-main-layer">
        <div ref={contentRef} className="site-loader-content">
          <div className="site-loader-dog">
            <canvas
              ref={canvasRef}
              width={130}
              height={130}
              className="site-loader-canvas"
            />
          </div>
          <div className="site-loader-progress">
            <svg viewBox="0 0 136 136">
              <circle r="67" cx="68" cy="68" className="site-loader-stroke" />
              <circle
                ref={progressCircleRef}
                r="67"
                cx="68"
                cy="68"
                className="site-loader-percent"
                style={{ strokeDashoffset: circumference }}
              />
            </svg>
          </div>
        </div>

        {/* Cinematic 'Click to Enter' gate when browser blocks unmuted autoplay */}
        {needsClick && (
          <div ref={enterRef} className="loader-enter-container">
            <button
              type="button"
              className="loader-enter-btn"
              onClick={handleUserClick}
              aria-label="Enter experience with sound"
            >
              <span className="enter-dot" aria-hidden="true" />
              <span className="enter-text">CLICK TO ENTER</span>
            </button>
            <span className="enter-subtext">Click anywhere to explore with sound</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Loader
