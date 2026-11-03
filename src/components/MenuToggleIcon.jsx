 import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web/build/player/lottie_light';
import menuAnimationData from '../assets/menu-toggle.json';

export default function MenuToggleIcon({ isOpen }) {
  const containerRef = useRef(null);
  const animRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Load lottie animation with SVG renderer
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData: menuAnimationData,
    });
    animRef.current = anim;

    // Set initial frame state
    if (isOpen) {
      anim.goToAndStop(30, true);
    } else {
      anim.goToAndStop(0, true);
    }

    return () => {
      anim.destroy();
    };
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const anim = animRef.current;
    if (!anim) return;

    if (isOpen) {
      // Transition Hamburger -> 'X'
      anim.setSpeed(0.9);
      anim.playSegments([18, 30], true);
    } else {
      // Transition 'X' -> Hamburger
      anim.setSpeed(1.3);
      anim.playSegments([47, 61], true);
    }
  }, [isOpen]);

  return <div className="menu-lottie-icon" ref={containerRef} aria-hidden="true" />;
}
