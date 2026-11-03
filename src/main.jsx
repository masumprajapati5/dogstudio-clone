import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as THREE from 'three'
import App from './App.jsx'

// Silence Three.js r183+ Clock deprecation warning caused by @react-three/fiber's internal root store
if (typeof THREE.setConsoleFunction === 'function') {
  THREE.setConsoleFunction((type, message, ...params) => {
    if (typeof message === 'string' && message.includes('Clock: This module has been deprecated')) {
      return;
    }
    console[type](message, ...params);
  });
}

const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Clock: This module has been deprecated')) {
    return;
  }
  originalWarn.apply(console, args);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
