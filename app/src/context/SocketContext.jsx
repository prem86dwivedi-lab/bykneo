import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

import { Capacitor } from '@capacitor/core';

const SocketContext = createContext(null);

const getBackendUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;

  if (typeof window !== 'undefined') {
    // Native Android / iOS APK (Capacitor runtime)
    if (Capacitor.isNativePlatform() || window.location.protocol === 'capacitor:' || (window.location.hostname === 'localhost' && !window.location.port)) {
      return 'https://bykneo-backend.onrender.com';
    }

    const hostname = window.location.hostname;
    // Cloudflare Pages, Render, or any live production domain
    if (
      hostname.includes('pages.dev') ||
      hostname.includes('onrender.com') ||
      (!hostname.includes('localhost') &&
        !hostname.includes('127.0.0.1') &&
        !hostname.startsWith('192.168.') &&
        !hostname.startsWith('10.'))
    ) {
      return 'https://bykneo-backend.onrender.com';
    }
    // Local network Wi-Fi IP
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:5000`;
    }
  }
  return 'http://localhost:5000';
};

export const BACKEND_URL = getBackendUrl();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    s.on('connect', () => {
      console.log('⚡ Connected to Bykneo Real-time Backend:', s.id);
      setConnected(true);
    });

    s.on('disconnect', () => {
      console.log('🔌 Disconnected from Bykneo Backend');
      setConnected(false);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, backendUrl: BACKEND_URL }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
