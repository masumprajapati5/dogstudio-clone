import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import './StaggeredMenu.css';

const NAV_ITEMS = [
  { label: 'Overview', href: '#section-1' },
  { label: 'Featured Works', href: '#section-2' },
  { label: 'Our Philosophy', href: '#section-3' },
  { label: 'Studio & Values', href: '#section-4' },
  { label: 'Get in Touch', href: '.site-footer' },
];

const PRELAYERS = [
  { color: '#ff3344', className: 'sm-prelayer-1' }, // Dogstudio Coral Red
  { color: '#16192b', className: 'sm-prelayer-2' }, // Midnight Navy
  { color: '#0b0c10', className: 'sm-prelayer-3' }, // Charcoal Dark
];

export default function StaggeredMenu({
  isOpen,
  onClose,
  soundOn,
  onToggleSound,
  onNavClick,
}) {
  const [mounted, setMounted] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef(null);
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const isFirstRender = useRef(true);
  const activeTlRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize GSAP layout states (Offscreen above viewport: yPercent: -100)
  useEffect(() => {
    if (!mounted) return;
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const layers = Array.from(container.querySelectorAll('.sm-prelayer'));
      const backdrop = backdropRef.current;

      if (!panel) return;

      // Start fullscreen panel & prelayers completely offscreen above viewport
      gsap.set([panel, ...layers], { yPercent: -100, y: 0, xPercent: 0, x: 0 });
      if (backdrop) {
        gsap.set(backdrop, { opacity: 0 });
      }

      const itemInners = panel.querySelectorAll('.sm-panel-itemInner');
      const footerBar = panel.querySelector('.sm-panel-footer-bar');

      if (itemInners.length) gsap.set(itemInners, { yPercent: 120, rotate: 6, opacity: 0 });
      if (footerBar) gsap.set(footerBar, { opacity: 0, y: 25 });
    }, containerRef);

    return () => ctx.revert();
  }, [mounted]);

  // Handle open / close animations (Top to Bottom Wipe)
  useEffect(() => {
    if (!mounted) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!isOpen) return;
    }

    const container = containerRef.current;
    if (!container) return;

    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    const layers = Array.from(container.querySelectorAll('.sm-prelayer'));
    if (!panel) return;

    const itemInners = panel.querySelectorAll('.sm-panel-itemInner');
    const footerBar = panel.querySelector('.sm-panel-footer-bar');

    if (activeTlRef.current) {
      activeTlRef.current.kill();
      activeTlRef.current = null;
    }

    if (isOpen) {
      setIsActive(true);

      // Reset offscreen positions above viewport before animating down
      gsap.set([panel, ...layers], { yPercent: -100, y: 0, xPercent: 0, x: 0 });
      if (backdrop) gsap.set(backdrop, { opacity: 0 });
      if (itemInners.length) gsap.set(itemInners, { yPercent: 120, rotate: 6, opacity: 0 });
      if (footerBar) gsap.set(footerBar, { opacity: 0, y: 25 });

      const tl = gsap.timeline();

      // 1. Soft backdrop fade in
      if (backdrop) {
        tl.to(
          backdrop,
          { opacity: 1, duration: 0.35, ease: 'power2.out' },
          0
        );
      }

      // 2. Cascading Curtain Prelayers drop down from Top to Bottom
      layers.forEach((layer, i) => {
        tl.fromTo(
          layer,
          { yPercent: -100, y: 0 },
          { yPercent: 0, y: 0, duration: 0.62, ease: 'power4.out' },
          i * 0.07
        );
      });

      // 3. Main Fullscreen Panel drops down from Top to Bottom
      const panelStart = layers.length * 0.07 + 0.02;
      const panelDuration = 0.72;
      tl.fromTo(
        panel,
        { yPercent: -100, y: 0 },
        { yPercent: 0, y: 0, duration: panelDuration, ease: 'power4.out' },
        panelStart
      );

      // 4. Staggered Content Reveal
      const contentStart = panelStart + panelDuration * 0.22;

      // Navigation items (dash + text) roll up gracefully in unison
      if (itemInners.length) {
        tl.fromTo(
          itemInners,
          { yPercent: 120, rotate: 6, opacity: 0 },
          {
            yPercent: 0,
            rotate: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'power4.out',
            stagger: 0.065,
          },
          contentStart + 0.05
        );
      }

      // Full-width footer bar (Sound & Socials/Copyright) slides up
      if (footerBar) {
        tl.fromTo(
          footerBar,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' },
          contentStart + 0.25
        );
      }

      activeTlRef.current = tl;
    } else {
      // Close Timeline: Retract back up to Top (yPercent: 0 -> -100)
      const all = [panel, ...layers.slice().reverse()];
      const tl = gsap.timeline({
        onComplete: () => {
          setIsActive(false);
          gsap.set([panel, ...layers], { yPercent: -100, y: 0, xPercent: 0, x: 0 });
          if (itemInners.length) gsap.set(itemInners, { yPercent: 120, rotate: 6, opacity: 0 });
          if (footerBar) gsap.set(footerBar, { opacity: 0, y: 25 });
        },
      });

      if (backdrop) {
        tl.to(
          backdrop,
          { opacity: 0, duration: 0.32, ease: 'power2.in' },
          0
        );
      }

      // Fast fade out for nav elements before panel leaves
      if (itemInners.length) {
        tl.to(
          itemInners,
          { opacity: 0, yPercent: -40, duration: 0.22, ease: 'power2.in', stagger: 0.02 },
          0
        );
      }
      if (footerBar) {
        tl.to(
          footerBar,
          { opacity: 0, y: -15, duration: 0.22, ease: 'power2.in' },
          0
        );
      }

      // Prelayers & panel slide up into ceiling in a smooth cascade
      tl.to(
        all,
        {
          yPercent: -100,
          y: 0,
          duration: 0.45,
          ease: 'power3.in',
          stagger: 0.04,
        },
        0.05
      );

      activeTlRef.current = tl;
    }
  }, [isOpen, mounted]);

  // Close on ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const isVisible = isOpen || isActive;

  return createPortal(
    <div
      ref={containerRef}
      className={`staggered-menu-scope ${isVisible ? 'is-visible' : 'is-hidden'}`}
      data-open={isOpen ? 'true' : 'false'}
    >
      {/* Backdrop for transition depth */}
      <div
        ref={backdropRef}
        className="sm-backdrop"
        aria-hidden="true"
      />

      {/* Cascading curtain prelayers (Red -> Midnight -> Charcoal) covering whole screen */}
      <div className="sm-prelayers" aria-hidden="true">
        {PRELAYERS.map((pl, idx) => (
          <div
            key={idx}
            className={`sm-prelayer ${pl.className}`}
            style={{ backgroundColor: pl.color }}
          />
        ))}
      </div>

      {/* Main Fullscreen Menu Panel */}
      <aside
        id="staggered-menu-panel"
        ref={panelRef}
        className="staggered-menu-panel"
        aria-label="Navigation Menu"
        aria-hidden={!isOpen}
      >
        <div className="sm-panel-inner">
          {/* Main Navigation Items (Dash line + text) */}
          <div className="sm-nav-section">
            <ul className="sm-panel-list" role="list">
              {NAV_ITEMS.map((item) => (
                <li className="sm-panel-itemWrap" key={item.label}>
                  <a
                    className="sm-panel-item"
                    href={item.href}
                    onClick={(e) => {
                      if (onNavClick) {
                        onNavClick(item.href, e);
                      } else {
                        onClose();
                      }
                    }}
                  >
                    <div className="sm-panel-itemInner">
                      <span className="sm-panel-itemDash" aria-hidden="true" />
                      <span className="sm-panel-itemLabel">{item.label}</span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Full-Width Bottom Bar (Matching User Reference Image) */}
          <div className="sm-panel-footer-bar">
            {/* Top row above line: Sound Toggle on the Right */}
            <div className="sm-footer-top-row">
              <div
                className="sm-setting-row"
                onClick={onToggleSound}
                role="button"
                tabIndex={0}
                aria-label="Toggle site sound"
              >
                <div className="sm-setting-left">
                  <i
                    className={`sm-setting-icon ${
                      soundOn ? 'ri-volume-up-line' : 'ri-volume-mute-line'
                    }`}
                  />
                  <span className="sm-setting-label">Sound</span>
                </div>
                <div className={`sm-toggle-switch ${soundOn ? 'is-active' : ''}`}>
                  <div className="sm-toggle-thumb" />
                </div>
              </div>
            </div>

            {/* Continuous Full-Width Divider Line */}
            <div className="sm-fullwidth-divider" />

            {/* Bottom row below line: Socials on Left, Copyright on Right */}
            <div className="sm-footer-bottom-row">
              <div className="sm-socials-links">
                <a href="#facebook" onClick={(e) => e.preventDefault()} aria-label="Facebook">Fb</a>
                <span className="sm-socials-sep">/</span>
                <a href="#instagram" onClick={(e) => e.preventDefault()} aria-label="Instagram">Ins</a>
                <span className="sm-socials-sep">/</span>
                <a href="#dribbble" onClick={(e) => e.preventDefault()} aria-label="Dribbble">Dri</a>
                <span className="sm-socials-sep">/</span>
                <a href="#twitter" onClick={(e) => e.preventDefault()} aria-label="Twitter">Tw</a>
              </div>
              <div className="sm-brand-tag">Dogstudio Clone ©</div>
            </div>
          </div>
        </div>
      </aside>
    </div>,
    document.body
  );
}
