import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import './App.css'
import 'lenis/dist/lenis.css'
import Dog from './components/Dog'
import Loader from './components/Loader'
import MenuToggleIcon from './components/MenuToggleIcon'
import StaggeredMenu from './components/StaggeredMenu'
import CustomScrollbar from './components/CustomScrollbar'
import { Canvas } from '@react-three/fiber'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(ScrollTrigger, CustomEase)
CustomEase.create('dogstudioEase', '0.245, 0.495, 0, 0.99')

function App() {
  const [lenisInstance, setLenisInstance] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [menuState, setMenuState] = useState('closed') // 'closed' | 'open' | 'closing'
  const [soundOn, setSoundOn] = useState(true)
  const lenisRef = useRef(null)
  const audioRef = useRef(null)

  const handleLoaderComplete = () => {
    setIsLoaded(true)
    if (soundOn) {
      playSound()
    }
    const tl = gsap.timeline({ defaults: { ease: 'power4.out'} })

    tl.fromTo(
      '.bg-texture',
      { opacity: 0 },
      { opacity: 1, duration: 0.9, ease: 'power2.out', clearProps: 'opacity' },
      0
    )
    tl.fromTo(
      '#canvas-elem',
      { opacity: 0, scale: 1.9, x: 50 },
      { opacity: 1, scale: 1, x: 0, duration: 1.5, ease: 'power3.out' },
      0
    )
    tl.fromTo(
      'nav .nav-elem',
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: 'power3.out' },
      0.02
    )
    tl.fromTo(
      '.hero-title-line .fx-letter',
      {
        x: 80,
        y: 50,
        z: -300,
        scaleY: 0.01,
        rotateX: -90,
        rotateZ: -35,
        opacity: 0,
        transformOrigin: '0% 100%',
      },
      {
        x: 0,
        y: 0,
        z: 0,
        scaleY: 1,
        rotateX: 0,
        rotateZ: 0,
        opacity: 1,
        duration: 1.2,
        stagger: 0.025,
        ease: 'dogstudioEase',
      },
      0.04
    )
    tl.fromTo(
      '.bottom .right p',
      { y: 35, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.85, stagger: 0.08, ease: 'power3.out' },
      0.14
    )
    tl.fromTo(
      ['.first-line', '.second-line'],
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 0.85, transformOrigin: 'left center', ease: 'power3.inOut' },
      0.18
    )
    tl.fromTo(
      '.site-volume',
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' },
      0.28
    )
  }

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      smoothWheel: true,
    })

    lenisRef.current = lenis
    setLenisInstance(lenis)
    lenis.on('scroll', ScrollTrigger.update)

    const update = (time) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(update)
      lenis.destroy()
    }
  }, [])

  const closeMenu = () => {
    if (menuState === 'open') {
      setMenuState('closed')
    }
  }

  const handleToggleMenu = () => {
    if (menuState === 'open') {
      closeMenu()
    } else {
      setMenuState('open')
    }
  }

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0.15
      audioRef.current.play().catch(() => {})
    }
  }
  const pauseSound = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }

  const handleToggleSound = () => {
    setSoundOn((prev) => {
      const next = !prev
      if (next) {
        playSound()
      } else {
        pauseSound()
      }
      return next
    })
  }

  // Auto-start sound on page load / first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (soundOn && audioRef.current && audioRef.current.paused) {
        playSound()
      }
    }

    if (soundOn) {
      playSound()
    }

    window.addEventListener('click', handleFirstInteraction, { passive: true })
    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true })
    window.addEventListener('keydown', handleFirstInteraction, { passive: true })
    window.addEventListener('wheel', handleFirstInteraction, { passive: true })
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true })

    return () => {
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('pointerdown', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
      window.removeEventListener('wheel', handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
    }
  }, [soundOn])

  const handleNavClick = (selector, e) => {
    if (e) e.preventDefault()
    closeMenu()
    setTimeout(() => {
      const target = document.querySelector(selector)
      if (target) {
        if (lenisRef.current) {
          lenisRef.current.scrollTo(target, { duration: 1.2 })
        } else {
          target.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }, 120)
  }

  const handleBackToTop = (e) => {
    if (e) e.preventDefault()
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, {
        duration: 3,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    if (menuState !== 'open') return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeMenu()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuState])

  // Lock background scroll when drawer menu is open
  useEffect(() => {
    if (menuState === 'open') {
      if (lenisRef.current) lenisRef.current.stop()
      document.body.style.overflow = 'hidden'
    } else {
      if (lenisRef.current) lenisRef.current.start()
      document.body.style.overflow = ''
    }
  }, [menuState])

  return (
    <>
      <main>
        <audio ref={audioRef} src="/ambient-luxury-pad.wav" loop preload="none" />
        <Loader onComplete={handleLoaderComplete} />
        <CustomScrollbar lenis={lenisInstance} visible={isLoaded} />
        <StaggeredMenu
          isOpen={menuState === 'open'}
          onClose={closeMenu}
          soundOn={soundOn}
          onToggleSound={handleToggleSound}
          onNavClick={handleNavClick}
        />
        {createPortal(
          <button
            type="button"
            className={`menu-toggle-btn fixed-menu-toggle ${menuState === 'open' ? 'is-active' : ''}`}
            onClick={handleToggleMenu}
            aria-label="Toggle menu"
            aria-expanded={menuState === 'open'}
          >
            <MenuToggleIcon isOpen={menuState === 'open'} />
          </button>,
          document.body
        )}
        <div className="images">
          <img id='tomorrowland' src="/tommorowland.png" alt="Tomorrowland project visual" loading="lazy" decoding="async" fetchPriority="low" />
          <img id='navy-pier' src="/navy-pier.png" alt="Navy Pier project visual" loading="lazy" decoding="async" fetchPriority="low" />
          <img id='msi-chicago' src="/msi-chicago.png" alt="MSI Chicago project visual" loading="lazy" decoding="async" fetchPriority="low" />
          <img id='phone' src="/phone.png" alt="Louise's Phone project visual" loading="lazy" decoding="async" fetchPriority="low" />
          <img id='kikk' src="/kikk.png" alt="KIKK Festival project visual" loading="lazy" decoding="async" fetchPriority="low" />
          <img id='kennedy' src="/kennedy.png" alt="The Kennedy Center project visual" loading="lazy" decoding="async" fetchPriority="low" />
          <img id='opera' src="/opera.png" alt="Royal Opera of Wallonia project visual" loading="lazy" decoding="async" fetchPriority="low" />
        </div>
        <div className="bg-texture"></div>
        <Canvas
          id='canvas-elem'
          dpr={[1, 1.8]}
          gl={{
            powerPreference: 'high-performance',
            antialias: true,
            alpha: true,
            stencil: false,
            depth: true,
          }}
          performance={{ min: 0.5 }}
          style={{
            width: '100vw',
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 3,
            pointerEvents: 'none'
          }}>
          <Dog />
        </Canvas>
        <section id='section-1'>
          <nav>
            <div className="nav-elem">
              <svg xmlns="http://www.w3.org/2000/svg" fill='white' viewBox="0 0 401.23099 116.838">
                <path d="M97.9212,84.4793c0-13.21301-7.2132-23.3924-25.54961-23.3924h-19.6172v46.7851h19.6172c18.3364,0,25.54961-10.1797,25.54961-23.3927Zm-13.3478,0c0,9.2356-5.1908,12.6737-12.404,12.6737h-6.6739v-25.3474h6.6739c7.2132,0,12.404,3.4381,12.404,12.6737Z"></path>
                <path d="M100.972,107.872h37.078v-10.6516h-24.33701v-8.0222h21.37v-10.112h-21.37v-7.348h23.73v-10.6513h-36.47099v46.7851Z"></path>
                <path d="M181.211,77.3335c0-11.7973-7.55-16.2466-19.28-16.2466h-20.29199v46.7851h12.741v-14.2919h7.55099c11.73,0,19.28-4.4493,19.28-16.2466Zm-13.213,0c0,4.5841-2.157,6.47169-7.34801,6.47169h-6.26999v-12.9434h6.26999c5.19101,0,7.34801,1.8876,7.34801,6.4717Z"></path>
                <path d="M182.601,72.0079h14.76401v35.86411h12.741v-35.86411h14.763v-10.921h-42.26801v10.921Z"></path>
                <path d="M219.575,101.66c0,4.23399,3.427,7.661,7.661,7.661,4.233,0,7.694-3.427,7.694-7.661,0-4.23331-3.461-7.69421-7.694-7.69421-4.23399,0-7.661,3.4609-7.661,7.69421Zm1.478,0c0-3.4941,2.755-6.35011,6.183-6.35011,3.427,0,6.216,2.856,6.216,6.35011,0,3.495-2.789,6.31699-6.216,6.31699-3.42799,0-6.183-2.822-6.183-6.31699Zm2.58701,3.797h2.42v-2.621h1.377l1.44501,2.621h2.621l-1.74701-3.091c.806-.336,1.41101-1.243,1.41101-2.251,0-1.781-1.14201-2.6211-3.091-2.6211h-4.436v7.9631Zm5.07401-5.309c0,.639-.403,.908-1.17601,.908h-1.478v-1.6804h1.478c.77301,0,1.17601,.2016,1.17601,.7724Z"></path>
                <path d="M48.0438,24.4527C48.0438,11.1965,40.807,.98386,22.4106,.98386H2.72925V47.9216H22.4106c18.3964,0,25.6332-10.2127,25.6332-23.4689Zm-13.3915,0c0,9.2658-5.2078,12.7152-12.4446,12.7152h-6.6957V11.7376h6.6957c7.2368,0,12.4446,3.4493,12.4446,12.7151Z"></path>
                <path d="M99.8921,24.4527C99.8921,9.84386,90.8292,.17226,75.2734,.17226s-24.6186,9.6716-24.6186,24.28044,9.0629,24.2805,24.6186,24.2805,24.6187-9.6716,24.6187-24.2805Zm-13.4591,0c0,7.8455-4.2609,13.5944-11.1596,13.5944s-11.1595-5.7489-11.1595-13.5944,4.2609-13.5943,11.1595-13.5943,11.1596,5.7488,11.1596,13.5943Z"></path>
                <path d="M175.40601,48.7332c12.715,0,20.696-5.9517,20.696-15.4205,0-7.7102-5.073-11.7006-12.98601-13.3238l-10.145-2.0966c-4.058-.8116-5.27499-2.0967-5.27499-4.1933,0-2.2996,2.367-4.1933,6.62801-4.1933,4.73399,0,8.183,2.029,8.52199,6.2899h12.57901c0-11.22716-9.468-15.62334-21.16901-15.62334-11.22699,0-19.411,5.61359-19.411,14.74414,0,7.7102,5.073,11.7006,12.98599,13.3238l10.145,2.0967c4.058,.8116,5.27501,2.0966,5.27501,4.1932,0,2.9759-2.908,4.6668-7.507,4.6668-5.20801,0-8.99501-2.7054-9.26601-7.575h-12.58c.27101,10.5508,7.44,17.1113,21.50801,17.1113Z"></path>
                <path d="M196.80901,11.9405h14.812V47.9216h12.782V11.9405h14.812V.98386h-42.40599V11.9405Z"></path>
                <path d="M263.302,48.7332c13.59399,0,21.16901-6.1547,21.16901-20.4254V.98386h-12.78302V28.3078c0,6.29-3.17899,9.5364-8.38599,9.5364-5.276,0-8.455-3.2464-8.455-9.5364V.98386h-12.782V28.3078c0,14.2707,7.575,20.4254,21.237,20.4254Z"></path>
                <path d="M332.995,24.4527c0-13.2562-7.237-23.46884-25.633-23.46884h-19.68201V47.9216h19.68201c18.396,0,25.633-10.2127,25.633-23.4689Zm-13.39099,0c0,9.2658-5.20801,12.7152-12.44501,12.7152h-6.69598V11.7376h6.69598c7.237,0,12.44501,3.4493,12.44501,12.7151Z"></path>
                <path d="M335.90399,47.9216h12.78302V.98386h-12.78302V47.9216Z"></path>
                <path d="M401.23099,24.4527c0-14.60884-9.06299-24.28044-24.61899-24.28044s-24.61899,9.6716-24.61899,24.28044,9.06299,24.2805,24.61899,24.2805,24.61899-9.6716,24.61899-24.2805Zm-13.45999,0c0,7.8455-4.26001,13.5944-11.159,13.5944s-11.16-5.7489-11.16-13.5944,4.26102-13.5943,11.16-13.5943,11.159,5.7488,11.159,13.5943Z"></path>
                <path d="M128.905,30.638h10.41501c-1.21701,4.802-5.74901,7.5074-11.22701,7.5074-7.169,0-11.904-5.2754-11.904-13.8649,0-7.8455,4.32899-13.5944,11.769-13.5944,4.464,0,8.31899,1.8938,9.40099,6.1547h13.59401c-1.48801-10.68614-10.88901-16.8408-23.26601-16.8408-15.758,0-24.95699,9.67161-24.95699,24.2805,0,14.6765,9.46899,24.2805,22.184,24.2805,7.237,0,11.76801-2.7054,14.88-6.5605v5.7489h11.29399V21.3046h-22.183v9.3334Z"></path>
                <path d="M30.4351,61.1758h-10.4155L0,116.838H10.3479L30.4351,61.1758Z"></path>
              </svg>
            </div>
            <div
              className="nav-elem nav-showreel-btn"
              onClick={(e) => handleNavClick('#section-2', e)}
              style={{ cursor: 'pointer' }}
            >
              <i className='ri-arrow-right-s-line'></i> Our Showreel
            </div>
            <div className="nav-elem nav-menu-wrapper" style={{ width: 44, height: 44, pointerEvents: 'none' }} aria-hidden="true" />
          </nav>
          <div className="hero-content">
            <div className="middle">
              <div className="left">
                <h1 className="fx-parent">
                  <span className="hero-title-line">
                    <span className="fx-letter">W</span>
                    <span className="fx-letter">e</span>
                  </span>
                  <span className="hero-title-line">
                    <span className="fx-letter">M</span>
                    <span className="fx-letter">a</span>
                    <span className="fx-letter">k</span>
                    <span className="fx-letter">e</span>
                  </span>
                  <span className="hero-title-line">
                    <span className="fx-letter">G</span>
                    <span className="fx-letter">o</span>
                    <span className="fx-letter">o</span>
                    <span className="fx-letter">d</span>
                  </span>
                  <span className="hero-title-line">
                    <span className="fx-letter">S</span>
                    <span className="fx-letter">h</span>
                    <span className="fx-letter">i</span>
                    <span className="fx-letter">t</span>
                  </span>
                </h1>
              </div>
              <div className="right"></div>
            </div>
            <div
              className="mobile-showreel-btn"
              onClick={(e) => handleNavClick('#section-2', e)}
            >
              <i className='ri-arrow-right-s-line'></i> Our Showreel
            </div>
            <div className="bottom">
              <div className="left"></div>
              <div className="right">
                <p>Dogstudio is a multidisciplinary <br />
                  creative studio at the intersection <br />
                  of art, design and technology.</p>
                <p className="second-paragraph">Our goal is to deliver amazing experiences that make <br />
                  people talk, and build strategic value for brands, tech, <br />
                  entertainment, arts & culture.</p>
              </div>
            </div>
          </div>
          <div className="first-line"></div>
          <div className="second-line"></div>
        </section>
        <section id='section-2' >
          <div className="titles">
            <div img-title="tomorrowland" className="title">
              <small>2020 - ONGOING</small>
              <h1>Tomorrowland</h1>
            </div>
            <div img-title="navy-pier" className="title">
              <small>2018 - TODAY</small>
              <h1>Navy Pier</h1>
            </div>
            <div img-title="msi-chicago" className="title">
              <small>2015 - TODAY</small>
              <h1>MSI Chicago</h1>
            </div>
            <div img-title="phone" className="title">
              <small>2016</small>
              <h1>This Was Louise’s Phone</h1>
            </div>
            <div img-title="kikk" className="title">
              <small>2012 - TODAY</small>
              <h1>KIKK Festival 2018</h1>
            </div>
            <div img-title="kennedy" className="title">
              <small>2017</small>
              <h1>The Kennedy Center</h1>
            </div>
            <div img-title="opera" className="title">
              <small>2016 - ONGOING</small>
              <h1>Royal Opera Of Wallonia</h1>
            </div>
          </div>
        </section>
        <section id='section-3'>
          <div className="top">
            <div className="left">
              <span className="section-tag">THIS IS HOW WE DO IT</span>
              <h3>We're crafting <br />
                emotional <br />
                experiences aimed <br />
                at improving <br />
                results
              </h3>
            </div>
            <div className="right"></div>
          </div>
        </section>
        <div id="section-4">
          <div className="bottom">
            <div className="left"></div>
            <div className="right">
              <div className="about-col">
                <p>Dogstudio is a design & technology firm working globally from our offices based in Belgium and Chicago. Our strong focus on producing high quality & emotional brandings, digital products and experiences became a signature.</p>
                <a href="#values" onClick={(e) => e.preventDefault()} className="values-link">
                  Discover our values
                </a>
              </div>
              <div className="about-col">
                <p>We’re passionate about moving people and solving problems for the likes of Microsoft, The Museum of Science And Industry Of Chicago, The Kennedy Center of Washington, Dragone, Quanta Magazine, and many more.</p>
              </div>
            </div>
          </div>
        </div>
        <footer className="site-footer">
          <div className="site-footer-top">
            <div className="site-footer-locations">
              <div className="city">Chicago<b className="accent-dot">.</b></div>
              <div className="city">Amsterdam<b className="accent-dot">.</b></div>
              <div className="city">Paris<b className="accent-dot">.</b></div>
            </div>
            <div className="site-footer-social">
              <svg className="we-make-good-shit-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30.67 54.43">
                <path d="M592.66,694.59l-3-9.13-.81-.69h4.06l-.89.69,2.17,7.06,1.4-5-.7-2.15-.78-.59h4.06l-.92.59,2.21,7.17,2.17-7.09-1-.66h2.28l-.91.66-2.74,8.86-1.35.3L595.77,688,594,694.29Z" transform="translate(-575.91 -684.77)" fill="#ffffff" />
                <path d="M604,694.65a3.74,3.74,0,0,1-1.26-.21,3,3,0,0,1-1-.62,3,3,0,0,1-.71-1,3.28,3.28,0,0,1-.26-1.34A3.7,3.7,0,0,1,601,690a3.62,3.62,0,0,1,.73-1.12,3.83,3.83,0,0,1,1.06-.78,5.16,5.16,0,0,1,1.3-.44,3,3,0,0,1,1,.16,2.26,2.26,0,0,1,.79.47,2.18,2.18,0,0,1,.53.77,2.8,2.8,0,0,1,.19,1.08v.53h-4.12a3.2,3.2,0,0,0,.27,1.08,2.54,2.54,0,0,0,.53.76,2.11,2.11,0,0,0,.73.46,2.44,2.44,0,0,0,.86.15,2.63,2.63,0,0,0,.84-.12,4,4,0,0,0,.77-.36l.12.17q-.33.33-.63.59a7.21,7.21,0,0,1-.61.47c-.21.14-.42.28-.64.4S604.25,694.53,604,694.65Zm-1.55-4.17h2.1v-.59a3.44,3.44,0,0,0-.2-1.31.76.76,0,0,0-.77-.47.9.9,0,0,0-.86.56,3.82,3.82,0,0,0-.27,1.61Z" transform="translate(-575.91 -684.77)" fill="#ffffff" />
                <path d="M585.52,700.74l-3.23,8.77h-1l-3.43-9.09v8.46l.93.57h-2.09l.87-.57v-8.4l-.87-.71h3.22l2.93,7.43,2.75-7.43h3l-.9.71v8.4l.9.57h-3.84l.79-.57Z" transform="translate(-575.91 -684.77)" fill="#ffffff" />
                <path d="M592.23,702.71a3.85,3.85,0,0,1,.6.09,1.86,1.86,0,0,1,.44.16,1.67,1.67,0,0,1,.33.23,2,2,0,0,1,.47,1.53v3a3.81,3.81,0,0,0,0,.61,7.26,7.26,0,0,0,.14.72l.65.39h-2.47l-.33-1-1.89,1.22a2.77,2.77,0,0,1-.77-.1,1.77,1.77,0,0,1-.63-.32,1.48,1.48,0,0,1-.42-.54,1.76,1.76,0,0,1-.15-.75,2.15,2.15,0,0,1,.16-.8,1.65,1.65,0,0,1,.6-.72l3.05-.91v-1.24c0-.18,0-.33,0-.48a.89.89,0,0,0-.1-.36.52.52,0,0,0-.26-.22,1.21,1.21,0,0,0-.48-.08l-.28,0-.32.09-1.17,2-.92-1.37s.8-.46,1.44-.77A3.87,3.87,0,0,1,592.23,702.71Zm-.18,3s-1.3.25-1.6,1a2,2,0,0,0-.14.75,1.51,1.51,0,0,0,.21.86.65.65,0,0,0,.56.32,1,1,0,0,0,.41-.1,1.76,1.76,0,0,0,.33-.19l.22-.15Z" transform="translate(-575.91 -684.77)" fill="#ffffff" />
                <path d="M596.69,705.72l2.67-2-.59-.85h2.18l-2.72,2,2.75,3.95.69.63H599l-2.28-3.58v2.83l.73.75H594l.73-.62v-8.19L594,700l2.46-.4h.22Z" transform="translate(-575.91 -684.77)" fill="#ffffff" />
                <path d="M604,709.65a3.74,3.74,0,0,1-1.26-.21,3,3,0,0,1-1-.62,3,3,0,0,1-.71-1,3.28,3.28,0,0,1-.26-1.34A3.7,3.7,0,0,1,601,705a3.62,3.62,0,0,1,.73-1.12,3.83,3.83,0,0,1,1.06-.78,5.16,5.16,0,0,1,1.3-.44,3,3,0,0,1,1,.16,2.26,2.26,0,0,1,.79.47,2.18,2.18,0,0,1,.53.77,2.8,2.8,0,0,1,.19,1.08v.53h-4.12a3.2,3.2,0,0,0,.27,1.08,2.54,2.54,0,0,0,.53.76,2.11,2.11,0,0,0,.73.46,2.44,2.44,0,0,0,.86.15,2.63,2.63,0,0,0,.84-.12,4,4,0,0,0,.77-.36l.12.17q-.33.33-.63.59a7.21,7.21,0,0,1-.61.47c-.21.14-.42.28-.64.4S604.25,709.53,604,709.65Zm-1.55-4.17h2.1v-.59a3.44,3.44,0,0,0-.2-1.31.76.76,0,0,0-.77-.47.9.9,0,0,0-.86.56,3.82,3.82,0,0,0-.27,1.61Z" transform="translate(-575.91 -684.77)" fill="#ffffff" />
                <path d="M583.69,723.76c-.27.09-.55.17-.86.25a9,9,0,0,1-1,.19,8.66,8.66,0,0,1-1.15.07,5.17,5.17,0,0,1-1.82-.32,4.46,4.46,0,0,1-1.53-.95,4.53,4.53,0,0,1-1-1.52,5.11,5.11,0,0,1-.39-2,4.89,4.89,0,0,1,1.41-3.72,6.4,6.4,0,0,1,4-1.58,6.83,6.83,0,0,1,1.78.2,7.27,7.27,0,0,1,1.34.5v2.58l-1.34-2.25a2.43,2.43,0,0,0-.72-.56,2.27,2.27,0,0,0-1.05-.21,2.21,2.21,0,0,0-1.2.34,2.94,2.94,0,0,0-.93,1,5.1,5.1,0,0,0-.6,1.5,8.24,8.24,0,0,0-.21,2,10.63,10.63,0,0,0,.16,1.88,5.76,5.76,0,0,0,.48,1.54,2.88,2.88,0,0,0,.82,1A1.88,1.88,0,0,0,581,724a1.73,1.73,0,0,0,1.34-.57v-3.11l-1-.73h3.87l-.75.73v3.14C584.22,723.56,584,723.67,583.69,723.76Z" transform="translate(-575.91 -684.77)" fill="#ffffff" />
                <path d="M588.45,724.25a3,3,0,0,1-1.22-.24,2.94,2.94,0,0,1-1-.68,3.13,3.13,0,0,1-.65-1,3.73,3.73,0,0,1-.23-1.35,3.45,3.45,0,0,1,.28-1.46,3,3,0,0,1,.77-1,4.28,4.28,0,0,1,1.15-.7,9.18,9.18,0,0,1,1.4-.46,3.13,3.13,0,0,1,1.23.24,2.93,2.93,0,0,1,1,.68,3.13,3.13,0,0,1,.65,1,3.69,3.69,0,0,1,.24,1.34,3.52,3.52,0,0,1-.28,1.47,3.07,3.07,0,0,1-.77,1,4.1,4.1,0,0,1-1.15.7A9.36,9.36,0,0,1,588.45,724.25Zm.11-6.58a.92.92,0,0,0-.84.64,5.19,5.19,0,0,0-.3,2.05,6.36,6.36,0,0,0,.42,2.62q.42.89,1,.89a.92.92,0,0,0,.84-.65,5.17,5.17,0,0,0,.3-2,6.27,6.27,0,0,0-.43-2.65Q589.16,717.67,588.57,717.67Z" transform="translate(-575.91 -684.77)" fill="#ffffff" />
                <path d="M595.39,724.25a3,3,0,0,1-1.22-.24,2.94,2.94,0,0,1-1-.68,3.13,3.13,0,0,1-.65-1,3.72,3.72,0,0,1-.24-1.35,3.46,3.46,0,0,1,.28-1.46,3,3,0,0,1,.77-1,4.29,4.29,0,0,1,1.15-.7,9.19,9.19,0,0,1,1.4-.46,3.12,3.12,0,0,1,1.23.24,2.94,2.94,0,0,1,1,.68,3.13,3.13,0,0,1,.65,1,3.69,3.69,0,0,1,.24,1.34,3.5,3.5,0,0,1-.28,1.47,3,3,0,0,1-.77,1,4.08,4.08,0,0,1-1.15.7A9.39,9.39,0,0,1,595.39,724.25Zm.11-6.58a.92.92,0,0,0-.84.64,5.21,5.21,0,0,0-.3,2.05,6.34,6.34,0,0,0,.42,2.62q.42.89,1,.89a.92.92,0,0,0,.84-.65,5.17,5.17,0,0,0,.3-2,6.29,6.29,0,0,0-.43-2.65Q596.09,717.67,595.5,717.67Z" transform="translate(-575.91 -684.77)" fill="#ffffff" />
                <path d="M602,724.25a2.37,2.37,0,0,1-1.05-.23,2.58,2.58,0,0,1-.84-.66,3.21,3.21,0,0,1-.57-1,3.73,3.73,0,0,1-.21-1.26,5.08,5.08,0,0,1,.17-1.31,3.39,3.39,0,0,1,.53-1.12,3.29,3.29,0,0,1,.93-.86,4.17,4.17,0,0,1,1.39-.53,2.54,2.54,0,0,1,1.4.38v-2.52l-.75-.54,2.46-.4h.21v8.08a3.87,3.87,0,0,0,0,.64,5.56,5.56,0,0,0,.16.55l.74.21-2.43.48-.39-1.34Zm-.54-3.85a6.51,6.51,0,0,0,.08,1.07,3.29,3.29,0,0,0,.25.84,1.54,1.54,0,0,0,.4.54.82.82,0,0,0,.54.19,1,1,0,0,0,.39-.06,2.54,2.54,0,0,0,.43-.25l.19-.14v-4.47a1,1,0,0,0-.3-.29.83.83,0,0,0-.46-.12,1.21,1.21,0,0,0-1.15.73A4.38,4.38,0,0,0,601.45,720.4Z" transform="translate(-575.91 -684.77)" fill="#ffffff" />
                <path d="M586.22,737.57a5.06,5.06,0,0,0,.93.85,2,2,0,0,0,1.2.37,1.74,1.74,0,0,0,1.22-.42,1.45,1.45,0,0,0,.46-1.12,1.71,1.71,0,0,0-.3-1,3.5,3.5,0,0,0-1-.89l-1.84-1.22c-.23-.16-.44-.31-.63-.46a3,3,0,0,1-.49-.5,2.14,2.14,0,0,1-.32-.6,2.24,2.24,0,0,1-.12-.76,2.42,2.42,0,0,1,.17-.91,2.09,2.09,0,0,1,.57-.78,3.77,3.77,0,0,1,1-.62,5,5,0,0,1,3-.32,5.54,5.54,0,0,1,.63.15l.69.23v2.51l-1.12-2a2.43,2.43,0,0,0-.7-.52,2,2,0,0,0-.87-.19,1.69,1.69,0,0,0-1.13.37,1.3,1.3,0,0,0-.44,1.05,1.36,1.36,0,0,0,.34.95,4.12,4.12,0,0,0,.92.74l1.8,1.19a4.07,4.07,0,0,1,1.21,1.08,2.42,2.42,0,0,1,.38,1.39,2.54,2.54,0,0,1-.19,1,2.43,2.43,0,0,1-.61.85,4.18,4.18,0,0,1-1.11.7,8.58,8.58,0,0,1-1.68.53,5.37,5.37,0,0,1-1.53-.2,5.71,5.71,0,0,1-1.37-.64v-2.57Z" transform="translate(-575.91 -684.77)" fill="#ffffff" />
                <path d="M591.63,739l.72-.57V730l-.75-.44,2.46-.4h.22v4.6l2.45-1.52a2.3,2.3,0,0,1,.81.11,1.32,1.32,0,0,1,.46.29,1.16,1.16,0,0,1,.19.24,1.14,1.14,0,0,1,.12.31,3.24,3.24,0,0,1,.06.44c0,.17,0,.38,0,.63v4.17l.8.57h-3.33l.51-.57v-4.24a1,1,0,0,0-.16-.64.58.58,0,0,0-.48-.19,1.2,1.2,0,0,0-.53.11l-.53.29-.39.24v4.43l.53.57Z" transform="translate(-575.91 -684.77)" fill="#ffffff" />
                <path d="M598.69,739l.73-.57v-5l-.77-.56,2.47-.52h.23v6.11l.73.57Z" transform="translate(-575.91 -684.77)" fill="#ffffff" />
                <path d="M601.84,732.8v-.22h.86v-.94l1.94-1.76v2.7h1.75v.22h-1.75v4.45a.82.82,0,0,0,.21.63.77.77,0,0,0,.55.2A2,2,0,0,0,606,738a3.52,3.52,0,0,0,.54-.22l.1.19-2.31,1.19a1.42,1.42,0,0,1-1.21-.48,2.12,2.12,0,0,1-.37-1.31V732.8Z" transform="translate(-575.91 -684.77)" fill="#ffffff" />
                <circle cx="24.46" cy="45.67" r="0.97" fill="#ffffff" />
              </svg>
              <div className="social-links">
                <a href="#facebook" aria-label="Facebook" onClick={(e) => e.preventDefault()}>Fb</a>
                <span>/</span>
                <a href="#instagram" aria-label="Instagram" onClick={(e) => e.preventDefault()}>Ins</a>
                <span>/</span>
                <a href="#dribbble" aria-label="Dribbble" onClick={(e) => e.preventDefault()}>Dri</a>
                <span>/</span>
                <a href="#twitter" aria-label="Twitter (X)" onClick={(e) => e.preventDefault()}>Tw</a>
              </div>
            </div>
          </div>

          <div className="site-footer-divider"></div>

          <div className="site-footer-bottom">
            <div className="site-footer-contact">
              <span>H3llo Fr!end</span>
              <span className="contact-dash"></span>
              <a href="mailto:biz@dogstudio.be">Clone by me</a>
            </div>
            <div className="site-footer-right">
              <a
                href="#top"
                onClick={handleBackToTop}
                className="site-footer-policy"
                style={{ cursor: 'pointer' }}
              >
                Back to Top <i className="ri-arrow-up-line"></i>
              </a>
            </div>
          </div>
        </footer>
        <button
          type="button"
          className={`site-volume ${soundOn ? 'is-active' : ''}`}
          title={soundOn ? 'Turn sound off' : 'Turn sound on'}
          onClick={handleToggleSound}
          aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
        >
          <span className="sound-label">Sound</span>
          <div className="sound-wave" aria-hidden="true">
            <span className="sound-bar bar-1"></span>
            <span className="sound-bar bar-2"></span>
            <span className="sound-bar bar-3"></span>
            <span className="sound-bar bar-4"></span>
            <span className="sound-bar bar-5"></span>
          </div>
        </button>
      </main>
    </>
  )
}

export default App
