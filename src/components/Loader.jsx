import React, { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import './Loader.css'

const Loader = ({ onComplete, onStartAudio }) => {
  const [mounted, setMounted] = useState(true)
  const [showButtons, setShowButtons] = useState(false)

  const wrapperRef = useRef(null)
  const mainLayerRef = useRef(null)
  const prelayer1Ref = useRef(null) // Red (#ff3344)
  const prelayer2Ref = useRef(null) // Midnight (#16192b)
  const prelayer3Ref = useRef(null) // Charcoal (#0b0c10)
  const contentRef = useRef(null)
  const actionsRef = useRef(null)
  const canvasRef = useRef(null)
  const progressCircleRef = useRef(null)
  const animTriggeredRef = useRef(false)

  const onCompleteRef = useRef(onComplete)
  const onStartAudioRef = useRef(onStartAudio)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    onStartAudioRef.current = onStartAudio
  }, [onStartAudio])

  // 1. Dog Canvas Runner — 16-frame 24fps runner animation
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

      if (shadowImg.complete && shadowImg.naturalWidth) {
        ctx.drawImage(shadowImg, (130 - 128) / 2, 88, 128, 16)
      }

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

  useEffect(() => {
    const circumference = 420.973415581
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
    const duration = isMobile ? 1200 : 2000
    const startTime = performance.now()
    let rafId

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
        setShowButtons(true)
      }
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [])

  const startStaggeredExit = (withAudio) => {
    if (animTriggeredRef.current) return
    animTriggeredRef.current = true

    const mainLayer = mainLayerRef.current
    const pre1 = prelayer1Ref.current
    const pre2 = prelayer2Ref.current
    const pre3 = prelayer3Ref.current
    const content = contentRef.current
    const actions = actionsRef.current

    if (!mainLayer || !pre1 || !pre2 || !pre3) {
      if (onCompleteRef.current) onCompleteRef.current(withAudio)
      setMounted(false)
      return
    }

    const tl = gsap.timeline({
      onComplete: () => {
        setMounted(false)
      },
    })

    // Fade out running dog and action buttons
    const fadeTargets = [content, actions].filter(Boolean)
    if (fadeTargets.length) {
      tl.to(
        fadeTargets,
        {
          opacity: 0,
          duration: 0.24,
          ease: 'power2.in',
        },
        0
      )
    }

    // Staggered multi-layer curtain wipe to the left
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
        0.05 + i * 0.07
      )
    })

    // Reveal hero section in sync with wipe clearance
    tl.call(
      () => {
        if (onCompleteRef.current) {
          onCompleteRef.current(withAudio)
        }
      },
      null,
      0.44
    )
  }

  const handleSelectAudio = (withAudio) => {
    if (withAudio && onStartAudioRef.current) {
      onStartAudioRef.current().catch(() => {})
    }
    startStaggeredExit(withAudio)
  }

  if (!mounted) return null

  const circumference = 420.973415581

  return (
    <div ref={wrapperRef} className="site-loader-wrapper" aria-label="Loading site">
      {/* Prelayers for staggered curtain wipe */}
      <div ref={prelayer3Ref} className="loader-prelayer prelayer-3" aria-hidden="true" />
      <div ref={prelayer2Ref} className="loader-prelayer prelayer-2" aria-hidden="true" />
      <div ref={prelayer1Ref} className="loader-prelayer prelayer-1" aria-hidden="true" />

      {/* Main loader panel */}
      <div ref={mainLayerRef} className="loader-main-layer">
        {/* Center: Running Dog Loader */}
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

        {/* Bottom: Minimal Audio Selection Buttons */}
        <div
          ref={actionsRef}
          className={`loader-audio-actions ${showButtons ? 'is-visible' : ''}`}
        >
          <button
            type="button"
            className="loader-btn-audio"
            onClick={() => handleSelectAudio(true)}
            aria-label="Enter with audio"
          >
            <svg
              className="loader-btn-icon"
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-2.5 0L6.5 7.73H3v8.54h3.5l5 4.5V3.23zM14 8.77v6.46c1.39-.58 2.5-1.92 2.5-3.23s-1.11-2.65-2.5-3.23z" />
            </svg>
            <span>Enter with audio</span>
          </button>

          <button
            type="button"
            className="loader-btn-mute"
            onClick={() => handleSelectAudio(false)}
            aria-label="Enter without audio"
          >
            <svg
              className="loader-btn-icon"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27l4.78 4.78H3v8.54h4.5l5 4.5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4v3.27l-.01-.01L8.27 4H12z" />
            </svg>
            <span>Enter without audio</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Loader
