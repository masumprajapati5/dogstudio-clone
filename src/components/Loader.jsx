import React, { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import './Loader.css'

const Loader = ({ onComplete, onStartAudio }) => {
  const [mounted, setMounted] = useState(true)
  const [showChoice, setShowChoice] = useState(false)

  const wrapperRef = useRef(null)
  const mainLayerRef = useRef(null)
  const prelayer1Ref = useRef(null) // Red (#ff3344)
  const prelayer2Ref = useRef(null) // Midnight (#16192b)
  const prelayer3Ref = useRef(null) // Charcoal (#0b0c10)
  const progressContentRef = useRef(null)
  const brandScreenRef = useRef(null)
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

  // 2. Dog loader progress countdown -> Reveal Agency Audio Screen
  useEffect(() => {
    const circumference = 420.973415581
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
    const duration = isMobile ? 1200 : 2000
    const startTime = performance.now()
    let rafId

    const transitionToChoiceScreen = () => {
      // Fade & shrink the running dog loader
      if (progressContentRef.current) {
        gsap.to(progressContentRef.current, {
          opacity: 0,
          scale: 0.85,
          duration: 0.35,
          ease: 'power2.inOut',
          onComplete: () => {
            setShowChoice(true)
          },
        })
      } else {
        setShowChoice(true)
      }
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
        transitionToChoiceScreen()
      }
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [])

  // 3. Staggered Curtain Wipe into Site
  const startStaggeredExit = (withAudio) => {
    if (animTriggeredRef.current) return
    animTriggeredRef.current = true

    const mainLayer = mainLayerRef.current
    const pre1 = prelayer1Ref.current
    const pre2 = prelayer2Ref.current
    const pre3 = prelayer3Ref.current
    const brandScreen = brandScreenRef.current

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

    // Fade out agency brand screen
    if (brandScreen) {
      tl.to(
        brandScreen,
        {
          opacity: 0,
          y: -15,
          scale: 0.96,
          duration: 0.28,
          ease: 'power2.in',
        },
        0
      )
    }

    // Multi-layer staggered wipe to the left
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
        0.06 + i * 0.07
      )
    })

    // Trigger hero section entrance in sync with wipe clearance
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
      {/* Prelayers stacked under the main layer for staggered wipe */}
      <div ref={prelayer3Ref} className="loader-prelayer prelayer-3" aria-hidden="true" />
      <div ref={prelayer2Ref} className="loader-prelayer prelayer-2" aria-hidden="true" />
      <div ref={prelayer1Ref} className="loader-prelayer prelayer-1" aria-hidden="true" />

      {/* Main loader panel */}
      <div ref={mainLayerRef} className="loader-main-layer">
        {/* Step 1: Running Dog with Circular Progress */}
        {!showChoice && (
          <div ref={progressContentRef} className="site-loader-content">
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
        )}

        {/* Step 2: Agency Audio Choice Screen (like emotion-agency.com) */}
        {showChoice && (
          <div ref={brandScreenRef} className="loader-agency-screen">
            <div className="loader-agency-center">
              <div className="loader-agency-logo-wrap">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 401.23099 116.838"
                  className="loader-agency-logo"
                  fill="white"
                >
                  <path d="M97.9212,84.4793c0-13.21301-7.2132-23.3924-25.54961-23.3924h-19.6172v46.7851h19.6172c18.3364,0,25.54961-10.1797,25.54961-23.3927Zm-13.3478,0c0,9.2356-5.1908,12.6737-12.404,12.6737h-6.6739v-25.3474h6.6739c7.2132,0,12.404,3.4381,12.404,12.6737Z" />
                  <path d="M100.972,107.872h37.078v-10.6516h-24.33701v-8.0222h21.37v-10.112h-21.37v-7.348h23.73v-10.6513h-36.47099v46.7851Z" />
                  <path d="M181.211,77.3335c0-11.7973-7.55-16.2466-19.28-16.2466h-20.29199v46.7851h12.741v-14.2919h7.55099c11.73,0,19.28-4.4493,19.28-16.2466Zm-13.213,0c0,4.5841-2.157,6.47169-7.34801,6.47169h-6.26999v-12.9434h6.26999c5.19101,0,7.34801,1.8876,7.34801,6.4717Z" />
                  <path d="M182.601,72.0079h14.76401v35.86411h12.741v-35.86411h14.763v-10.921h-42.26801v10.921Z" />
                  <path d="M219.575,101.66c0,4.23399,3.427,7.661,7.661,7.661,4.233,0,7.694-3.427,7.694-7.661,0-4.23331-3.461-7.69421-7.694-7.69421-4.23399,0-7.661,3.4609-7.661,7.69421Zm1.478,0c0-3.4941,2.755-6.35011,6.183-6.35011,3.427,0,6.216,2.856,6.216,6.35011,0,3.495-2.789,6.31699-6.216,6.31699-3.42799,0-6.183-2.822-6.183-6.31699Zm2.58701,3.797h2.42v-2.621h1.377l1.44501,2.621h2.621l-1.74701-3.091c.806-.336,1.41101-1.243,1.41101-2.251,0-1.781-1.14201-2.6211-3.091-2.6211h-4.436v7.9631Zm5.07401-5.309c0,.639-.403,.908-1.17601,.908h-1.478v-1.6804h1.478c.77301,0,1.17601,.2016,1.17601,.7724Z" />
                  <path d="M48.0438,24.4527C48.0438,11.1965,40.807,.98386,22.4106,.98386H2.72925V47.9216H22.4106c18.3964,0,25.6332-10.2127,25.6332-23.4689Zm-13.3915,0c0,9.2658-5.2078,12.7152-12.4446,12.7152h-6.6957V11.7376h6.6957c7.2368,0,12.4446,3.4493,12.4446,12.7151Z" />
                  <path d="M99.8921,24.4527C99.8921,9.84386,90.8292,.17226,75.2734,.17226s-24.6186,9.6716-24.6186,24.28044,9.0629,24.2805,24.6186,24.2805,24.6187-9.6716,24.6187-24.2805Zm-13.4591,0c0,7.8455-4.2609,13.5944-11.1596,13.5944s-11.1595-5.7489-11.1595-13.5944,4.2609-13.5943,11.1595-13.5943,11.1596,5.7488,11.1596,13.5943Z" />
                  <path d="M175.40601,48.7332c12.715,0,20.696-5.9517,20.696-15.4205,0-7.7102-5.073-11.7006-12.98601-13.3238l-10.145-2.0966c-4.058-.8116-5.27499-2.0967-5.27499-4.1933,0-2.2996,2.367-4.1933,6.62801-4.1933,4.73399,0,8.183,2.029,8.52199,6.2899h12.57901c0-11.22716-9.468-15.62334-21.16901-15.62334-11.22699,0-19.411,5.61359-19.411,14.74414,0,7.7102,5.073,11.7006,12.98599,13.3238l10.145,2.0967c4.058,.8116,5.27501,2.0966,5.27501,4.1932,0,2.9759-2.908,4.6668-7.507,4.6668-5.20801,0-8.99501-2.7054-9.26601-7.575h-12.58c.27101,10.5508,7.44,17.1113,21.50801,17.1113Z" />
                  <path d="M196.80901,11.9405h14.812V47.9216h12.782V11.9405h14.812V.98386h-42.40599V11.9405Z" />
                  <path d="M263.302,48.7332c13.59399,0,21.16901-6.1547,21.16901-20.4254V.98386h-12.78302V28.3078c0,6.29-3.17899,9.5364-8.38599,9.5364-5.276,0-8.455-3.2464-8.455-9.5364V.98386h-12.782V28.3078c0,14.2707,7.575,20.4254,21.237,20.4254Z" />
                  <path d="M332.995,24.4527c0-13.2562-7.237-23.46884-25.633-23.46884h-19.68201V47.9216h19.68201c18.396,0,25.633-10.2127,25.633-23.4689Zm-13.39099,0c0,9.2658-5.20801,12.7152-12.44501,12.7152h-6.69598V11.7376h6.69598c7.237,0,12.44501,3.4493,12.44501,12.7151Z" />
                  <path d="M335.90399,47.9216h12.78302V.98386h-12.78302V47.9216Z" />
                  <path d="M401.23099,24.4527c0-14.60884-9.06299-24.28044-24.61899-24.28044s-24.61899,9.6716-24.61899,24.28044,9.06299,24.2805,24.61899,24.2805,24.61899-9.6716,24.61899-24.2805Zm-13.45999,0c0,7.8455-4.26001,13.5944-11.159,13.5944s-11.16-5.7489-11.16-13.5944,4.26102-13.5943,11.16-13.5943,11.159,5.7488,11.159,13.5943Z" />
                  <path d="M128.905,30.638h10.41501c-1.21701,4.802-5.74901,7.5074-11.22701,7.5074-7.169,0-11.904-5.2754-11.904-13.8649,0-7.8455,4.32899-13.5944,11.769-13.5944,4.464,0,8.31899,1.8938,9.40099,6.1547h13.59401c-1.48801-10.68614-10.88901-16.8408-23.26601-16.8408-15.758,0-24.95699,9.67161-24.95699,24.2805,0,14.6765,9.46899,24.2805,22.184,24.2805,7.237,0,11.76801-2.7054,14.88-6.5605v5.7489h11.29399V21.3046h-22.183v9.3334Z" />
                  <path d="M30.4351,61.1758h-10.4155L0,116.838H10.3479L30.4351,61.1758Z" />
                </svg>
              </div>
              <p className="loader-agency-tagline">
                Award-winning creative studio at the intersection of art, design and technology
              </p>
            </div>

            <div className="loader-agency-actions">
              <button
                type="button"
                className="loader-action-btn loader-action-primary"
                onClick={() => handleSelectAudio(true)}
                aria-label="Enter with audio"
              >
                <svg
                  className="loader-action-icon"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-2.5 0L6.5 7.73H3v8.54h3.5l5 4.5V3.23zM14 8.77v6.46c1.39-.58 2.5-1.92 2.5-3.23s-1.11-2.65-2.5-3.23z" />
                </svg>
                <span>Enter with audio</span>
              </button>

              <button
                type="button"
                className="loader-action-btn loader-action-secondary"
                onClick={() => handleSelectAudio(false)}
                aria-label="Enter without audio"
              >
                <svg
                  className="loader-action-icon"
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27l4.78 4.78H3v8.54h4.5l5 4.5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4v3.27l-.01-.01L8.27 4H12z" />
                </svg>
                <span>Enter without audio</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Loader
