import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to track real-time physical device compass orientation (0° - 360°)
 * Works across Native Android (Capacitor), Android Chrome/WebView, and iOS.
 */
export const useDeviceCompass = () => {
  const [heading, setHeading] = useState(0);
  const currentHeadingRef = useRef(0);
  const animFrameRef = useRef(null);
  const targetHeadingRef = useRef(0);

  useEffect(() => {
    let isListening = false;

    // Smooth shortest-path interpolation (EMA filter)
    const updateSmoothHeading = () => {
      const target = targetHeadingRef.current;
      const current = currentHeadingRef.current;

      // Calculate shortest angular distance (-180 to +180)
      const diff = ((target - current) % 360 + 540) % 360 - 180;
      
      // Interpolate with smoothing factor
      if (Math.abs(diff) > 0.05) {
        currentHeadingRef.current = (current + diff * 0.2 + 360) % 360;
        setHeading(Math.round(currentHeadingRef.current * 10) / 10);
      }

      animFrameRef.current = requestAnimationFrame(updateSmoothHeading);
    };

    animFrameRef.current = requestAnimationFrame(updateSmoothHeading);

    const handleOrientation = (e) => {
      let rawDeg = null;

      // 1. iOS Safari / WKWebView
      if (typeof e.webkitCompassHeading === 'number') {
        rawDeg = e.webkitCompassHeading;
      }
      // 2. Android Chrome / Capacitor WebView with 3D Euler angles
      else if (e.alpha !== null && e.alpha !== undefined) {
        const alpha = e.alpha;
        const beta = e.beta;
        const gamma = e.gamma;

        if (beta !== null && gamma !== null) {
          const degToRad = Math.PI / 180;
          const radToDeg = 180 / Math.PI;
          const a = alpha * degToRad;
          const b = beta * degToRad;
          const g = gamma * degToRad;

          // Compute directional vector in screen coordinates
          const cA = Math.cos(a), sA = Math.sin(a);
          const cB = Math.cos(b), sB = Math.sin(b);
          const cG = Math.cos(g), sG = Math.sin(g);

          const rA = -cA * sG - sA * sB * cG;
          const rB = -sA * sG + cA * sB * cG;

          let comp = Math.atan2(rA, rB) * radToDeg;
          if (comp < 0) comp += 360;
          rawDeg = comp;
        } else {
          // Fallback flat orientation
          rawDeg = (360 - alpha) % 360;
        }
      }

      if (rawDeg !== null && !isNaN(rawDeg)) {
        targetHeadingRef.current = rawDeg;
      }
    };

    // Listen for absolute orientation first (magnetic/true North on Android), then fallback
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      isListening = true;
    } else if ('ondeviceorientation' in window) {
      window.addEventListener('deviceorientation', handleOrientation, true);
      isListening = true;
    }

    // iOS 13+ permission request helper if available
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      DeviceOrientationEvent.requestPermission()
        .then((permissionState) => {
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation, true);
          }
        })
        .catch(() => {});
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (isListening) {
        window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, []);

  return heading;
};
