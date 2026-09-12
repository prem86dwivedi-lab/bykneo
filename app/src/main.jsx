import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import 'leaflet/dist/leaflet.css';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider } from './context/AuthContext';
import { listenForSwMessages } from './utils/pushNotification.js';

// Register Service Worker (handles caching + Web Push background notifications)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[SW] Registration failed:', err);
    });
  });
}

// Relay SW → App: when driver taps a push notification while a tab is open,
// the SW posts RIDE_INCOMING. We forward it as a CustomEvent that App.jsx catches.
listenForSwMessages(({ rideId }) => {
  window.dispatchEvent(new CustomEvent('bykneo:ride_incoming', { detail: { rideId } }));
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SocketProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </SocketProvider>
  </React.StrictMode>
);
