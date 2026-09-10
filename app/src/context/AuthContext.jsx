import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket, BACKEND_URL } from './SocketContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { socket } = useSocket();
  const [user, setUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [activeRole, setActiveRole] = useState('passenger'); // 'passenger' | 'driver'
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('bykneo_user');
      const savedRole = localStorage.getItem('bykneo_role') || 'passenger';
      const savedDriver = localStorage.getItem('bykneo_driver');

      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setActiveRole(savedRole);
        if (savedDriver) setDriverProfile(JSON.parse(savedDriver));
      }
    } catch (e) {
      console.warn("Error parsing local storage auth session:", e);
    }
    setLoading(false);
  }, []);

  // Sync with socket rooms whenever user/role changes OR socket reconnects
  useEffect(() => {
    if (!socket || !user) return;

    const joinRooms = () => {
      socket.emit('join_user', { userId: user.id });
      if (activeRole === 'driver' && driverProfile) {
        socket.emit('join_driver', { driverId: driverProfile.id });
      }
    };

    joinRooms();
    socket.on('connect', joinRooms);
    return () => {
      socket.off('connect', joinRooms);
    };
  }, [socket, user, activeRole, driverProfile]);

  /**
   * Send 6-digit SMS OTP via MSG91
   */
  const sendOtp = async (phone, role = 'passenger') => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, role })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("sendOtp error:", err);
      return { success: false, error: 'Network error connecting to backend server' };
    }
  };

  /**
   * Resend OTP via MSG91
   */
  const resendOtp = async (phone) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("resendOtp error:", err);
      return { success: false, error: 'Failed to resend OTP code' };
    }
  };

  /**
   * Verify entered 6-digit OTP code
   */
  const verifyOtp = async (phone, otp, role = 'passenger') => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, role })
      });
      const data = await res.json();

      // ONLY log in directly if user is completely registered and has existing profile
      if (data.success && data.user && !data.isNewUser) {
        setUser(data.user);
        setActiveRole(data.user.role || role);
        setDriverProfile(data.driverProfile || null);

        localStorage.setItem('bykneo_user', JSON.stringify(data.user));
        localStorage.setItem('bykneo_role', data.user.role || role);
        if (data.driverProfile) {
          localStorage.setItem('bykneo_driver', JSON.stringify(data.driverProfile));
        }
      }

      return data;
    } catch (err) {
      console.error("verifyOtp error:", err);
      return { success: false, error: 'Network error during OTP verification' };
    }
  };

  /**
   * Complete Rider or Captain Registration Profile and save to database
   */
  const completeProfile = async (profileData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/complete-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();

      if (data.success && data.user) {
        setUser(data.user);
        setActiveRole(data.user.role || profileData.role);
        setDriverProfile(data.driverProfile || null);

        localStorage.setItem('bykneo_user', JSON.stringify(data.user));
        localStorage.setItem('bykneo_role', data.user.role || profileData.role);
        if (data.driverProfile) {
          localStorage.setItem('bykneo_driver', JSON.stringify(data.driverProfile));
        }
      }

      return data;
    } catch (err) {
      console.error("completeProfile error:", err);
      return { success: false, error: 'Network error saving registration profile' };
    }
  };

  /**
   * 1-Click Quick Demo Login (for Rahul / Vikram buttons)
   */
  const loginWithPhone = async (phone, role = 'passenger') => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/demo-login`, {
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
      console.error("loginWithPhone error:", err);
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
        sendOtp,
        resendOtp,
        verifyOtp,
        completeProfile,
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
