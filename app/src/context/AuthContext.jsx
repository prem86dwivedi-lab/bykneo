import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket, BACKEND_URL } from './SocketContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { socket } = useSocket();
  const [user, setUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [activeRole, setActiveRole] = useState('passenger'); // 'passenger' | 'driver'
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage or default demo passenger
  useEffect(() => {
    const savedUser = localStorage.getItem('bykneo_user');
    const savedRole = localStorage.getItem('bykneo_role') || 'passenger';
    const savedDriver = localStorage.getItem('bykneo_driver');

    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setActiveRole(savedRole);
      if (savedDriver) setDriverProfile(JSON.parse(savedDriver));
    }
    setLoading(false);
  }, []);

  // Sync with socket rooms whenever user/role changes
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('join_user', { userId: user.id });

    if (activeRole === 'driver' && driverProfile) {
      socket.emit('join_driver', { driverId: driverProfile.id });
    }
  }, [socket, user, activeRole, driverProfile]);

  const loginWithPhone = async (phone, role = 'passenger') => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, role })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setActiveRole(role);
        setDriverProfile(data.driverProfile);
        localStorage.setItem('bykneo_user', JSON.stringify(data.user));
        localStorage.setItem('bykneo_role', role);
        if (data.driverProfile) {
          localStorage.setItem('bykneo_driver', JSON.stringify(data.driverProfile));
        }
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      console.error(err);
      return { success: false, error: 'Network error connecting to backend' };
    }
  };

  const switchRole = async (newRole) => {
    if (!user) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/switch-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, newRole })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setActiveRole(newRole);
        setDriverProfile(data.driverProfile);
        localStorage.setItem('bykneo_user', JSON.stringify(data.user));
        localStorage.setItem('bykneo_role', newRole);
        if (data.driverProfile) {
          localStorage.setItem('bykneo_driver', JSON.stringify(data.driverProfile));
        }
      }
    } catch (e) {
      console.error(e);
      setActiveRole(newRole);
      localStorage.setItem('bykneo_role', newRole);
    }
  };

  const logout = () => {
    setUser(null);
    setDriverProfile(null);
    localStorage.removeItem('bykneo_user');
    localStorage.removeItem('bykneo_role');
    localStorage.removeItem('bykneo_driver');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        driverProfile,
        setDriverProfile,
        activeRole,
        setActiveRole,
        loginWithPhone,
        switchRole,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
