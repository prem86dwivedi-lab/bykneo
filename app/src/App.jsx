import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { useSocket, BACKEND_URL } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { DrawerMenu } from './components/DrawerMenu';
import { InteractiveMap } from './components/InteractiveMap';
import { LoginScreen } from './screens/auth/LoginScreen';

// Passenger Screens
import { BookRideScreen } from './screens/passenger/BookRideScreen';
import { FindingDriverScreen } from './screens/passenger/FindingDriverScreen';
import { LiveTrackingScreen } from './screens/passenger/LiveTrackingScreen';
import { RideCompleteModal } from './screens/passenger/RideCompleteModal';
import { MyRidesScreen } from './screens/passenger/MyRidesScreen';
import { WalletScreen } from './screens/passenger/WalletScreen';
import { ProfileScreen } from './screens/passenger/ProfileScreen';

// Driver Screens
import { DriverHomeScreen } from './screens/driver/DriverHomeScreen';
import { IncomingRequestModal } from './screens/driver/IncomingRequestModal';
import { DriverTripScreen } from './screens/driver/DriverTripScreen';
import { DriverEarningsScreen } from './screens/driver/DriverEarningsScreen';
import { DriverProfileScreen } from './screens/driver/DriverProfileScreen';
import { CaptainKycScreen } from './screens/driver/CaptainKycScreen';
import { InstallPwaBanner } from './components/InstallPwaBanner';
import { sendPwaNotification, requestNotificationPermission } from './utils/notification';
import { subscribeToPush, unsubscribeFromPush } from './utils/pushNotification.js';
import { getPreciseCurrentPosition, watchPreciseLocation, requestLocationPermissions } from './utils/nativeLocation.js';
import { ShieldCheck, X } from 'lucide-react';

export function App() {
  const { user, driverProfile, setDriverProfile, updateDriverProfile, activeRole, loading } = useAuth();
  const { socket, connected } = useSocket();

  // Navigation State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('main'); // 'main', 'my_rides', 'wallet', 'profile', 'earnings', 'driver_profile'

  // Map & Booking State
  const [pickup, setPickup] = useState({
    name: 'Locating GPS...',
    lat: 23.2599,
    lng: 77.4126
  });
  const [drop, setDrop] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('bike');
  const [selectingMode, setSelectingMode] = useState(null); // 'pickup' | 'drop' | null
  const [estimatedFare, setEstimatedFare] = useState(null);

  // Active Ride & Request State
  const [activeRide, setActiveRide] = useState(null);
  const [findingDriver, setFindingDriver] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [showRideCompletedModal, setShowRideCompletedModal] = useState(false);
  const [lastCompletedRide, setLastCompletedRide] = useState(null);
  const [driverKycToast, setDriverKycToast] = useState(null);
  const [rideAlertToast, setRideAlertToast] = useState(null);

  // Dedicated Live Assigned Captain Coordinates (Received over WebSocket on Rider phone)
  const [assignedCaptainLocation, setAssignedCaptainLocation] = useState(null);

  // Driver Online State (persisted across restarts - never automatically switched off)
  const [isDriverOnline, setIsDriverOnline] = useState(() => {
    const saved = localStorage.getItem('bykneo_driver_online');
    if (saved !== null) return saved === 'true';
    return Boolean(driverProfile?.is_online);
  });

  useEffect(() => {
    if (driverProfile?.is_online !== undefined) {
      setIsDriverOnline(Boolean(driverProfile.is_online));
      localStorage.setItem('bykneo_driver_online', String(Boolean(driverProfile.is_online)));
    }
  }, [driverProfile?.is_online]);

  // null = GPS not yet resolved; never emit hardcoded fake coords
  const [driverGpsLocation, setDriverGpsLocation] = useState(null);
  const [gpsReady, setGpsReady] = useState(false);
  // Active Serviceable Cities & Geofencing State
  const [activeCities, setActiveCities] = useState([]);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);

  // Calculate distance in KM
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Helper to check if coordinates are within an active geofence
  const getZoneStatus = (lat, lng) => {
    const active = (activeCities || []).filter((c) => c.is_active !== false);
    if (!active || active.length === 0) {
      return { isServiceable: false, matchedCity: null, activeCities: [] };
    }
    if (!lat || !lng) {
      return { isServiceable: true, matchedCity: active[0] || null, activeCities: active };
    }
    const matched = active.find((c) => {
      const dist = calculateDistance(lat, lng, Number(c.lat), Number(c.lng));
      return dist <= (Number(c.radius_km) || 30);
    });
    return {
      isServiceable: !!matched,
      matchedCity: matched || null,
      activeCities: active
    };
  };

  // Fetch active serviceable cities from backend
  const fetchActiveCities = () => {
    fetch(`${BACKEND_URL}/api/cities/active`)
      .then((res) => res.json())
      .then((data) => {
        if (data.cities) {
          setActiveCities(data.cities);
        }
      })
      .catch(console.error);
  };

  // Fast non-blocking reverse geocoding with timeout
  const reverseGeocodeFast = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en,hi' }, signal: AbortSignal.timeout(3000) }
      );
      const data = await res.json();
      if (data && data.display_name) {
        return data.display_name.split(',').slice(0, 3).join(', ');
      }
    } catch (e) {
      // Non-blocking fallback
    }
    return null;
  };

  const lastGpsFixRef = useRef(null);

  // Immediate Live Location Fetcher & Continuous Real-time GPS Tracking (Capacitor Native + PWA)
  useEffect(() => {
    let unwatch = null;

    const handleNewLocation = (lat, lng, heading = 0, isFast = false) => {
      // Stationary Jitter Deadband Filter: Ignore sub-2.5m GPS satellite noise when stationary
      if (lastGpsFixRef.current && !isFast) {
        const dLat = (lat - lastGpsFixRef.current.lat) * 111320;
        const dLng = (lng - lastGpsFixRef.current.lng) * 111320 * Math.cos((lat * Math.PI) / 180);
        const distMeters = Math.sqrt(dLat * dLat + dLng * dLng);

        // If moved less than 2.5 meters, treat as stationary and do not jitter
        if (distMeters < 2.5) {
          return;
        }
      }

      lastGpsFixRef.current = { lat, lng, heading };

      // Mark GPS as ready — real device coordinates are now available
      setGpsReady(true);

      // 1. Immediately update driver live GPS coordinates with heading
      setDriverGpsLocation({ lat, lng, heading });

      // 2. Immediately update passenger pickup coordinates
      setPickup((prev) => {
        const isDefault =
          !prev ||
          prev.name === 'Locating GPS...' ||
          prev.name === 'Current Location' ||
          prev.name === 'My Current Location';
        if (isDefault) {
          return {
            name: prev?.name && prev.name !== 'Locating GPS...' ? prev.name : 'Current Location',
            lat,
            lng
          };
        }
        return prev;
      });

      // 3. Asynchronously resolve human-friendly address without blocking map/UI
      reverseGeocodeFast(lat, lng).then((resolvedName) => {
        if (resolvedName) {
          setPickup((prev) => {
            const isDefault =
              !prev ||
              prev.name === 'Locating GPS...' ||
              prev.name === 'Current Location' ||
              prev.name === 'My Current Location';
            if (isDefault) {
              return { name: resolvedName, lat, lng };
            }
            return prev;
          });
        }
      });
    };

    // TIER 1: Fast initial one-shot fix
    getPreciseCurrentPosition()
      .then((pos) => {
        if (pos?.lat && pos?.lng) {
          handleNewLocation(pos.lat, pos.lng, pos.heading || 0, true);
        }
      })
      .catch((e) => console.log('Fast GPS init note:', e.message));

    // TIER 2 & 3: High-frequency continuous native GPS / PWA watcher
    unwatch = watchPreciseLocation(
      (pos) => {
        handleNewLocation(pos.lat, pos.lng, pos.heading || 0, false);
      },
      (err) => {
        console.warn('Live GPS watch notice:', err.message);
      }
    );

    return () => {
      if (typeof unwatch === 'function') unwatch();
    };
  }, []);

  useEffect(() => {
    fetchActiveCities();
  }, []);

  // Fetch online drivers for map
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/drivers/online`)
      .then(res => res.json())
      .then(data => setNearbyDrivers(data.drivers || []))
      .catch(console.error);
  }, []);

  // Fetch active ongoing ride on load & poll while trip is active
  useEffect(() => {
    if (!user) return;

    const checkActiveRide = () => {
      fetch(`${BACKEND_URL}/api/rides/active?userId=${user.id}&role=${activeRole}&driverId=${driverProfile?.id || ''}`)
        .then(res => res.json())
        .then(data => {
          if (data.activeRide) {
            setActiveRide(data.activeRide);
            if (data.activeRide.status === 'REQUESTED') {
              setFindingDriver(true);
            } else {
              setFindingDriver(false);
            }
          } else if (activeRide && activeRole !== 'driver') {
            // Ride ended on server — fetch final ride status to verify if completed or cancelled
            fetch(`${BACKEND_URL}/api/rides/${activeRide.id}`)
              .then(r => r.json())
              .then(resData => {
                const finalRide = resData.ride;
                if (finalRide && finalRide.status === 'COMPLETED') {
                  setLastCompletedRide(finalRide);
                  setActiveRide(null);
                  setFindingDriver(false);
                  setAssignedCaptainLocation(null);
                  setShowRideCompletedModal(true);
                } else {
                  // Ride was cancelled or removed — clean reset WITHOUT showing completed modal!
                  setActiveRide(null);
                  setFindingDriver(false);
                  setAssignedCaptainLocation(null);
                  setShowRideCompletedModal(false);
                }
              })
              .catch(() => {
                setActiveRide(null);
                setFindingDriver(false);
                setAssignedCaptainLocation(null);
              });
          }
        })
        .catch(console.error);

      // If captain is online without an active trip, proactively check for pending ride requests
      if (activeRole === 'driver' && isDriverOnline && !activeRide && driverProfile?.id) {
        fetch(`${BACKEND_URL}/api/rides/pending-request?driverId=${driverProfile.id}`)
          .then(res => res.json())
          .then(data => {
            if (data?.success && data?.ride && !activeRide) {
              setIncomingRequest(data.ride);
            }
          })
          .catch(() => {});
      }
    };

    checkActiveRide();
    // Poll every 3 seconds only while in an ongoing trip (IN_PROGRESS or ARRIVED)
    let interval = null;
    if (activeRide && activeRide.status !== 'REQUESTED') {
      interval = setInterval(checkActiveRide, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, activeRole, activeRide?.id, activeRide?.status, isDriverOnline, driverProfile?.id]);

  // Resume & App Visibility Listener: Re-sync pending rides when driver returns to app
  useEffect(() => {
    const handleAppResume = () => {
      if (document.visibilityState === 'visible' && activeRole === 'driver' && isDriverOnline && !activeRide) {
        if (socket && driverProfile?.id) {
          socket.emit('join_driver', { driverId: driverProfile.id });
        }
        if (driverProfile?.id) {
          fetch(`${BACKEND_URL}/api/rides/pending-request?driverId=${driverProfile.id}`)
            .then(res => res.json())
            .then(data => {
              if (data?.success && data?.ride && !activeRide) {
                setIncomingRequest(data.ride);
              }
            })
            .catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleAppResume);
    window.addEventListener('focus', handleAppResume);
    return () => {
      document.removeEventListener('visibilitychange', handleAppResume);
      window.removeEventListener('focus', handleAppResume);
    };
  }, [activeRole, isDriverOnline, activeRide, socket, driverProfile?.id]);

  // Continuous Captain GPS Ping to Backend whenever Online OR in an Active Trip
  useEffect(() => {
    if (activeRole !== 'driver' || !socket || !driverProfile) return;
    if (!isDriverOnline && !activeRide) return;
    // Never emit until real GPS coords are available from the device
    if (!gpsReady || !driverGpsLocation?.lat || !driverGpsLocation?.lng) return;

    const pingLocation = () => {
      if (driverGpsLocation?.lat && driverGpsLocation?.lng) {
        socket.emit('driver:location_ping', {
          driverId: driverProfile.id,
          lat: driverGpsLocation.lat,
          lng: driverGpsLocation.lng,
          heading: driverGpsLocation.heading || 0
        });
      }
    };

    pingLocation();
    const interval = setInterval(pingLocation, 3000);
    return () => clearInterval(interval);
  }, [activeRole, socket, driverProfile, isDriverOnline, activeRide, driverGpsLocation, gpsReady]);

  // Socket.IO Event Listeners
  useEffect(() => {
    if (!socket) return;

    // 0. Live Admin Geofenced Cities Update
    socket.on('admin:cities_updated', ({ cities }) => {
      console.log('🔄 Admin updated serviceable cities via Socket:', cities);
      if (Array.isArray(cities)) {
        setActiveCities(cities.filter(c => c.is_active !== false));
      }
    });

    // 1. Rider: Captain Matched
    socket.on('ride:matched', ({ ride, driver }) => {
      console.log('✅ Captain Matched:', driver);
      setActiveRide(ride);
      setFindingDriver(false);
      if (driver) {
        setAssignedCaptainLocation({
          lat: Number(driver.lat || ride.pickup_lat || 23.2599),
          lng: Number(driver.lng || ride.pickup_lng || 77.4126),
          heading: Number(driver.heading || 0),
          name: driver.name,
          model: driver.vehicle_model,
          number: driver.vehicle_number,
          category: driver.vehicle_category,
          avatar: driver.avatar
        });
      }
    });

    // 2. Rider: Driver Live Location Stream
    socket.on('ride:driver_location', ({ lat, lng, heading }) => {
      setAssignedCaptainLocation((prev) => ({
        ...prev,
        lat: Number(lat),
        lng: Number(lng),
        heading: Number(heading || 0)
      }));
    });

    // 3. Driver: Incoming Request Alert
    socket.on('driver:incoming_request', ({ ride }) => {
      if (activeRole === 'driver' && isDriverOnline && !activeRide) {
        console.log('🔔 Incoming ride request:', ride);
        setIncomingRequest(ride);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([300, 150, 300, 150, 500]);
          } catch (e) {}
        }
      }
    });

    // 4. Driver: Dismiss pending incoming request when accepted by another driver or expired
    socket.on('driver:dismiss_request', ({ rideId }) => {
      setIncomingRequest((prev) => (prev?.id === rideId ? null : prev));
    });

    socket.on('ride:request_cancelled', ({ rideId }) => {
      setIncomingRequest((prev) => (prev?.id === rideId ? null : prev));
    });

    // 5. Driver: Assigned Successfully
    socket.on('ride:assigned_success', ({ ride }) => {
      console.log('✅ Captain assigned successfully to ride:', ride.id);
      setActiveRide(ride);
      setIncomingRequest(null);
    });

    // 6. Ride Arrived (Both Passenger and Driver)
    socket.on('ride:driver_arrived', ({ ride }) => {
      console.log('📍 Captain has arrived at pickup:', ride.id);
      setActiveRide(ride);
    });

    // 7. Ride Started
    socket.on('ride:started', ({ ride }) => {
      console.log('🚀 Ride started:', ride.id);
      setActiveRide(ride);
    });

    // 8. Ride Completed
    socket.on('ride:completed', ({ ride }) => {
      console.log('🏁 Ride completed:', ride.id);
      setLastCompletedRide(ride);
      setActiveRide(null);
      setFindingDriver(false);
      setAssignedCaptainLocation(null);
      if (activeRole !== 'driver' || (user && ride.rider_id === user.id)) {
        setShowRideCompletedModal(true);
      }
    });

    // 9. Ride Cancelled by other party (Instant alert & reset)
    socket.on('ride:cancelled_by_other', ({ ride, cancelledBy, reason }) => {
      console.log('🚫 Ride cancelled by other:', cancelledBy, reason);
      setActiveRide(null);
      setFindingDriver(false);
      setIncomingRequest(null);
      setAssignedCaptainLocation(null);

      if (activeRole === 'driver') {
        sendPwaNotification('⚠️ Ride Cancelled by Passenger', reason || 'The passenger has cancelled this booking.');
        setRideAlertToast({
          type: 'cancelled',
          title: 'Ride Cancelled by Passenger',
          message: reason || 'The passenger has cancelled this ride request. You are back online and ready for new requests.'
        });
      } else {
        setRideAlertToast({
          type: 'cancelled',
          title: 'Ride Cancelled',
          message: reason || 'This ride booking has been cancelled.'
        });
      }
    });

    // 10. Captain KYC Approval / Rejection Real-Time Push Notification
    socket.on('driver:kyc_status_updated', ({ status, rejectionReason, driver }) => {
      console.log('🛡️ Received driver:kyc_status_updated:', status);
      
      setDriverProfile((prev) => {
        const updated = driver || (prev ? { ...prev, kyc_status: status, kyc_rejection_reason: rejectionReason || '' } : null);
        if (updated) localStorage.setItem('bykneo_driver', JSON.stringify(updated));
        return updated;
      });

      if (status === 'approved') {
        sendPwaNotification(
          '🎉 Bykneo Captain KYC Approved!',
          'Your documents have been verified by Admin. You are now authorized to Go Online and accept rides.'
        );
        setDriverKycToast({
          type: 'success',
          title: '🎉 KYC Approved & Activated!',
          message: 'Your documents have been verified by Admin. You can now Go Online and accept rides.'
        });
      } else if (status === 'rejected') {
        sendPwaNotification(
          '⚠️ Captain KYC Update: Action Needed',
          `Reason: ${rejectionReason || 'Please review and re-upload your documents.'}`
        );
        setDriverKycToast({
          type: 'rejected',
          title: '❌ KYC Verification Rejected',
          message: rejectionReason || 'Please review and re-upload clear DL, RC, or Aadhaar photos.'
        });
      }
    });

    return () => {
      socket.off('admin:cities_updated');
      socket.off('ride:matched');
      socket.off('ride:driver_location');
      socket.off('driver:incoming_request');
      socket.off('driver:dismiss_request');
      socket.off('ride:request_cancelled');
      socket.off('ride:assigned_success');
      socket.off('ride:driver_arrived');
      socket.off('ride:started');
      socket.off('ride:completed');
      socket.off('ride:cancelled_by_other');
      socket.off('driver:kyc_status_updated');
    };
  }, [socket, activeRole, isDriverOnline, activeRide, incomingRequest]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white text-sm font-bold">
        Loading Bykneo...
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // Handle Location selection tap on map or pin drag with instant reverse geocoding
  const handleLocationSelect = async ({ lat, lng, type, name }) => {
    let finalName = name;
    
    if (!finalName || finalName.startsWith('Custom Location')) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'en,hi' } }
        );
        const data = await res.json();
        if (data && data.display_name) {
          finalName = data.display_name.split(',').slice(0, 3).join(', ');
        }
      } catch (e) {
        console.warn('Reverse geocode error:', e);
      }
    }

    const loc = {
      name: finalName || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      lat,
      lng
    };

    if (type === 'pickup') setPickup(loc);
    else if (type === 'drop') setDrop(loc);
    setSelectingMode(null);
  };

  // PASSENGER: Request Ride with Selected Vehicle Category
  const handleRequestRide = async (paymentMode, selectedVehicle = null) => {
    if (!pickup || !drop || !estimatedFare) return;

    const chosenVeh = selectedVehicle || estimatedFare.vehicles?.[0] || {
      id: 'bike',
      name: 'Bykneo Bike',
      category: 'BIKE',
      fare: estimatedFare.fare
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/rides/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rider_id: user.id,
          rider_name: user.name,
          rider_phone: user.phone,
          pickup_name: pickup.name,
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          drop_name: drop.name,
          drop_lat: drop.lat,
          drop_lng: drop.lng,
          vehicle_id: chosenVeh.id,
          vehicle_name: chosenVeh.name,
          vehicle_category: chosenVeh.category || 'BIKE',
          fare: chosenVeh.fare || estimatedFare.fare,
          distance_km: estimatedFare.distance_km,
          duration_mins: estimatedFare.duration_mins,
          payment_mode: paymentMode
        })
      });

      const data = await res.json();
      if (data.success) {
        setActiveRide(data.ride);
        setFindingDriver(true);

        // Broadcast through socket to all online drivers
        socket.emit('ride:request_broadcast', data.ride);
      }
    } catch (e) {
      console.error('Error booking ride:', e);
    }
  };

  // PASSENGER: Cancel Ride
  const handleCancelRide = (rideId) => {
    fetch(`${BACKEND_URL}/api/rides/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rideId,
        reason: 'Cancelled by Passenger',
        cancelledBy: 'rider'
      })
    }).catch(console.error);

    socket.emit('ride:cancel', {
      rideId,
      reason: 'Cancelled by Passenger',
      cancelledBy: 'rider'
    });

    setActiveRide(null);
    setFindingDriver(false);
    setAssignedCaptainLocation(null);
    setDrop(null);
    setEstimatedFare(null);
    setSelectingMode(null);
  };

  // CAPTAIN: Accept Incoming Ride
  const handleAcceptRide = (rideId) => {
    if (!driverProfile) return;
    socket.emit('driver:accept_ride', {
      rideId,
      driverId: driverProfile.id,
      lat: driverGpsLocation?.lat,
      lng: driverGpsLocation?.lng
    });
  };

  // CAPTAIN: Reject Incoming Ride
  const handleRejectRide = (rideId) => {
    setIncomingRequest(null);
  };

  // CAPTAIN: Driver Arrived at Pickup
  const handleDriverArrived = (rideId) => {
    setActiveRide(prev => (prev ? { ...prev, status: 'ARRIVED' } : null));
    socket.emit('driver:arrived_pickup', { rideId });
  };

  // CAPTAIN: Start Ride with OTP
  const handleStartRide = (rideId, enteredOtp, callback) => {
    socket.emit('driver:start_ride', { rideId, enteredOtp }, (res) => {
      if (res && res.success && res.ride) {
        setActiveRide(res.ride);
      }
      if (callback) callback(res);
    });
  };

  // CAPTAIN: Complete Ride
  const handleCompleteRide = (rideId) => {
    setActiveRide(null);
    setAssignedCaptainLocation(null);
    socket.emit('driver:complete_ride', { rideId });
  };

  // CAPTAIN: Toggle Online / Offline (Strictly Manual)
  const handleToggleDriverOnline = async () => {
    const newStatus = !isDriverOnline;
    setIsDriverOnline(newStatus);
    localStorage.setItem('bykneo_driver_online', String(newStatus));

    if (driverProfile) {
      updateDriverProfile({ is_online: newStatus, is_available: newStatus });

      fetch(`${BACKEND_URL}/api/drivers/toggle-online`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: driverProfile.id,
          isOnline: newStatus
        })
      }).catch(console.error);

      // Subscribe to Web Push when going online so OS can wake the app
      // for incoming ride alerts even when another app is in the foreground.
      if (newStatus) {
        if (socket) {
          socket.emit('join_driver', { driverId: driverProfile.id });
        }
        // Immediately fetch any active pending ride request
        fetch(`${BACKEND_URL}/api/rides/pending-request?driverId=${driverProfile.id}`)
          .then(res => res.json())
          .then(data => {
            if (data?.success && data?.ride && !activeRide) {
              setIncomingRequest(data.ride);
            }
          })
          .catch(() => {});

        subscribeToPush(driverProfile.id, BACKEND_URL).catch(console.warn);
      } else {
        unsubscribeFromPush(driverProfile.id, BACKEND_URL).catch(console.warn);
      }
    }
  };

  // Full Screen Sub-Views (My Rides, Wallet, Profile, Earnings)
  if (currentScreen === 'my_rides') {
    return <MyRidesScreen onBack={() => setCurrentScreen('main')} />;
  }
  if (currentScreen === 'wallet') {
    return <WalletScreen onBack={() => setCurrentScreen('main')} />;
  }
  if (currentScreen === 'profile') {
    return <ProfileScreen onBack={() => setCurrentScreen('main')} />;
  }
  if (currentScreen === 'earnings') {
    return <DriverEarningsScreen onBack={() => setCurrentScreen('main')} />;
  }
  if (currentScreen === 'driver_profile') {
    return (
      <DriverProfileScreen
        onBack={() => setCurrentScreen('main')}
        onOpenKyc={() => setCurrentScreen('driver_kyc')}
      />
    );
  }

  if (currentScreen === 'driver_kyc') {
    return (
      <CaptainKycScreen
        driverProfile={driverProfile}
        onBack={() => setCurrentScreen('main')}
        onKycSubmitted={() => {
          setDriverProfile((prev) => {
            const updated = prev ? { ...prev, kyc_status: 'pending' } : null;
            if (updated) localStorage.setItem('bykneo_driver', JSON.stringify(updated));
            return updated;
          });
          setCurrentScreen('main');
        }}
      />
    );
  }

  const isCaptain = activeRole === 'driver';

  const currentZoneStatus = isCaptain
    ? getZoneStatus(driverGpsLocation?.lat, driverGpsLocation?.lng)
    : getZoneStatus(pickup?.lat, pickup?.lng);

  return (
    <div className="relative w-full h-[100dvh] min-h-[100dvh] overflow-hidden bg-gray-950 font-sans">
      {/* 0. PWA 1-Tap Mobile Install Banner */}
      <InstallPwaBanner />

      {/* Global Ride Alert / Cancellation Notice Modal */}
      {rideAlertToast && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-gray-900 border border-brand-yellow/40 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-yellow/20 text-brand-yellow flex items-center justify-center mx-auto text-xl font-black">
              🔔
            </div>
            <div>
              <h3 className="text-sm font-black text-white">{rideAlertToast.title}</h3>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">{rideAlertToast.message}</p>
            </div>
            <button
              onClick={() => setRideAlertToast(null)}
              className="w-full py-3 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition"
            >
              OK, GOT IT
            </button>
          </div>
        </div>
      )}

      {/* 1. Top Navbar */}
      <Navbar
        onOpenMenu={() => setDrawerOpen(true)}
        zoneStatus={currentZoneStatus}
        isDriverOnline={isDriverOnline}
        onOpenKyc={() => setCurrentScreen('driver_kyc')}
        onNavigate={(screenId) => {
          if (screenId === 'book_ride' || screenId === 'driver_home') {
            setCurrentScreen('main');
          } else {
            setCurrentScreen(screenId);
          }
        }}
      />

      {/* 2. Slide-out Drawer Menu */}
      <DrawerMenu
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentScreen={currentScreen}
        onNavigate={(screenId) => {
          if (screenId === 'book_ride' || screenId === 'driver_home') {
            setCurrentScreen('main');
          } else {
            setCurrentScreen(screenId);
          }
        }}
        isDriverOnline={isDriverOnline}
        onToggleDriverOnline={handleToggleDriverOnline}
      />

      {/* 3. Central Interactive Map */}
      <InteractiveMap
        pickup={
          isCaptain
            ? activeRide
              ? { lat: activeRide.pickup_lat, lng: activeRide.pickup_lng }
              : null
            : pickup
        }
        drop={
          isCaptain
            ? activeRide
              ? { lat: activeRide.drop_lat, lng: activeRide.drop_lng }
              : null
            : drop
        }
        driverLocation={
          isCaptain
            ? isDriverOnline && currentZoneStatus?.isServiceable !== false
              ? driverGpsLocation
              : null
            : activeRide && assignedCaptainLocation
            ? assignedCaptainLocation
            : null
        }
        nearbyDrivers={isCaptain ? [] : nearbyDrivers}
        selectedVehicleId={selectedVehicleId}
        onLocationSelect={handleLocationSelect}
        selectingMode={selectingMode}
        isCaptain={isCaptain}
        isServiceable={currentZoneStatus?.isServiceable !== false && (estimatedFare ? estimatedFare.is_serviceable !== false : true)}
        activeRide={activeRide}
      />

      {/* 4. PASSENGER EXPERIENCE */}
      {!isCaptain && (
        <>
          {/* Default State: Booking Sheet */}
          {!activeRide && !findingDriver && (
            <BookRideScreen
              pickup={pickup}
              drop={drop}
              setPickup={setPickup}
              setDrop={setDrop}
              selectedVehicleId={selectedVehicleId}
              setSelectedVehicleId={setSelectedVehicleId}
              onStartSearchMode={(mode) => setSelectingMode(mode)}
              onRequestRide={handleRequestRide}
              estimatedFare={estimatedFare}
              setEstimatedFare={setEstimatedFare}
              zoneStatus={currentZoneStatus}
              activeCity={currentZoneStatus?.matchedCity || null}
              activeCities={activeCities}
            />
          )}

          {/* Searching State: Radar Animation */}
          {findingDriver && (
            <FindingDriverScreen
              ride={activeRide}
              onCancel={() => handleCancelRide(activeRide?.id)}
            />
          )}

          {/* Active Trip State: Live Approaching / In Progress */}
          {activeRide && !findingDriver && (
            <LiveTrackingScreen
              ride={activeRide}
              onCancelRide={handleCancelRide}
            />
          )}

          {/* Trip Completed Rating Modal */}
          {showRideCompletedModal && (
            <RideCompleteModal
              ride={lastCompletedRide}
              onClose={() => {
                setShowRideCompletedModal(false);
                setDrop(null);
                setEstimatedFare(null);
                setSelectingMode(null);
              }}
            />
          )}
        </>
      )}

      {/* 5. CAPTAIN (DRIVER) EXPERIENCE */}
      {isCaptain && (
        <>
          {/* Floating Captain KYC Live Push Notification Banner */}
          {driverKycToast && (
            <div className="fixed top-20 left-3 right-3 z-50 max-w-sm mx-auto bg-gray-900/95 backdrop-blur-2xl border-2 border-brand-yellow p-3.5 rounded-2xl shadow-2xl animate-in slide-in-from-top duration-300 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-yellow text-gray-950 flex items-center justify-center font-black shrink-0 mt-0.5 shadow-md">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">{driverKycToast.title}</div>
                  <div className="text-[11px] text-gray-300 mt-0.5">{driverKycToast.message}</div>
                </div>
              </div>

              <button
                onClick={() => setDriverKycToast(null)}
                className="p-1 text-gray-400 hover:text-white rounded-lg active:scale-95 transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Driver Home & Online/Offline Bar */}
          {!activeRide && (
            <DriverHomeScreen
              isOnline={isDriverOnline}
              onToggleOnline={handleToggleDriverOnline}
              activeRide={activeRide}
              driverLocation={driverGpsLocation}
              setDriverLocation={setDriverGpsLocation}
              zoneStatus={currentZoneStatus}
              onOpenKyc={() => setCurrentScreen('driver_kyc')}
            />
          )}

          {/* Incoming Ride Request Alert Modal */}
          {incomingRequest && !activeRide && (
            <IncomingRequestModal
              request={incomingRequest}
              onAccept={handleAcceptRide}
              onReject={handleRejectRide}
            />
          )}

          {/* Active Captain Navigation & Trip Lifecycle */}
          {activeRide && (
            <DriverTripScreen
              ride={activeRide}
              onDriverArrived={handleDriverArrived}
              onStartRide={handleStartRide}
              onCompleteRide={handleCompleteRide}
            />
          )}
        </>
      )}
    </div>
  );
}
export default App;
