import { db } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import { calculateDistance } from '../controllers/ride.controller.js';
import { sendPushToDriver } from '../services/push.service.js';

export const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    // 1. Join Rooms based on role
    socket.on('join_user', ({ userId }) => {
      socket.join(`user:${userId}`);
      console.log(`👤 User joined room: user:${userId}`);
    });

    socket.on('join_driver', ({ driverId }) => {
      socket.join(`driver:${driverId}`);
      socket.join('drivers:online');
      console.log(`🏍️ Driver joined rooms: driver:${driverId}, drivers:online`);

      // Immediately check if there is an active REQUESTED ride to offer to this newly connected/resumed captain
      try {
        const now = new Date().getTime();
        const pendingRides = db.filter('rides', r => {
          if (r.status !== 'REQUESTED' || r.driver_id) return false;
          const createdAt = new Date(r.created_at).getTime();
          return (now - createdAt) < 180000;
        });

        if (pendingRides.length > 0) {
          const latestRide = pendingRides.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          socket.emit('driver:incoming_request', { ride: latestRide });
        }
      } catch (err) {
        console.error("Error checking pending rides on join_driver:", err);
      }
    });

    socket.on('join_admin', () => {
      socket.join('admins');
      console.log(`💻 Admin joined 'admins' room`);
    });

    socket.on('join_ride', ({ rideId }) => {
      if (rideId) {
        socket.join(`ride:${rideId}`);
        console.log(`💬 Socket joined ride chat room: ride:${rideId}`);
      }
    });

    // 2. Driver Location Ping (Real-time GPS update)
    socket.on('driver:location_ping', ({ driverId, lat, lng, heading }) => {
      const driver = db.find('drivers', d => d.id === driverId || d.user_id === driverId);
      if (!driver) return;

      const updated = db.update('drivers', driver.id, {
        lat: Number(lat),
        lng: Number(lng),
        heading: Number(heading || 0),
        last_ping: new Date().toISOString()
      });

      // Broadcast to admin live map
      io.to('admins').emit('admin:driver_moved', {
        driverId: driver.id,
        lat: Number(lat),
        lng: Number(lng),
        heading: Number(heading || 0)
      });

      // Check if driver is currently in an active ride, and stream to that specific passenger
      const activeRide = db.get('rides').find(
        r => r.driver_id === driver.id && ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(r.status)
      );

      if (activeRide) {
        io.to(`user:${activeRide.rider_id}`).emit('ride:driver_location', {
          rideId: activeRide.id,
          driverId: driver.id,
          lat: Number(lat),
          lng: Number(lng),
          heading: Number(heading || 0)
        });
      }
    });

    // 3. Passenger creates ride request (Priority Nearest Captain Dispatch)
    socket.on('ride:request_broadcast', (rideData) => {
      console.log(`📢 Broadcasting ride request ${rideData.id} to nearest online drivers`);
      
      const onlineDrivers = db.filter('drivers', d => d.is_online && d.is_available !== false);
      
      // Calculate distance from each online Captain to the rider's pickup location
      const driversSorted = onlineDrivers.map(d => {
        const dist = (d.lat && d.lng && rideData.pickup_lat && rideData.pickup_lng)
          ? calculateDistance(rideData.pickup_lat, rideData.pickup_lng, d.lat, d.lng)
          : 999;
        return { driver: d, distance_km: dist };
      }).sort((a, b) => a.distance_km - b.distance_km);

      // Dispatch to each individual captain room with their specific distance to pickup
      driversSorted.forEach(({ driver, distance_km }) => {
        const payload = {
          ride: {
            ...rideData,
            driver_pickup_distance_km: distance_km
          }
        };

        // 1. Real-time socket event to driver ID and driver user ID
        io.to(`driver:${driver.id}`).emit('driver:incoming_request', payload);
        if (driver.user_id) {
          io.to(`user:${driver.user_id}`).emit('driver:incoming_request', payload);
        }

        // 2. Web Push notification (works when app is backgrounded / phone locked)
        const pushSub = db.find('push_subscriptions', s => s.driver_id === driver.id || s.driver_id === driver.user_id);
        if (pushSub) {
          const distLabel = distance_km < 1
            ? `${Math.round(distance_km * 1000)}m`
            : `${distance_km.toFixed(1)}km`;

          sendPushToDriver(pushSub.subscription, {
            title:    `🏍️ New Ride — ₹${rideData.fare}`,
            body:     `Pickup ${distLabel} away · ${rideData.pickup_name || 'Nearby'}`,
            rideId:   rideData.id,
            fare:     rideData.fare,
            distance: distance_km,
            pickup:   rideData.pickup_name || ''
          }).then(result => {
            // Auto-purge expired/unsubscribed push tokens
            if (result === 'stale') {
              db.delete('push_subscriptions', pushSub.id);
            }
          });
        }
      });

      // Broadcast to general online drivers room
      io.to('drivers:online').emit('driver:incoming_request', {
        ride: rideData
      });

      // Also notify admins
      io.to('admins').emit('admin:ride_created', { ride: rideData });
    });

    // 4. Driver accepts ride
    socket.on('driver:accept_ride', ({ rideId, driverId, lat, lng }) => {
      const ride = db.find('rides', r => r.id === rideId);
      const driver = db.find('drivers', d => d.id === driverId || d.user_id === driverId);

      if (!ride || !driver) return;
      if (ride.status !== 'REQUESTED') {
        socket.emit('ride:already_taken', { message: 'This ride was already accepted by another Captain.' });
        return;
      }

      // Update driver current location if provided
      if (lat && lng) {
        db.update('drivers', driver.id, {
          lat: Number(lat),
          lng: Number(lng),
          last_ping: new Date().toISOString()
        });
        driver.lat = Number(lat);
        driver.lng = Number(lng);
      }

      // Update ride with driver details
      const updatedRide = db.update('rides', rideId, {
        driver_id: driver.id,
        driver_name: driver.name,
        driver_phone: driver.phone,
        vehicle_model: driver.vehicle_model,
        vehicle_number: driver.vehicle_number,
        vehicle_category: driver.vehicle_category || ride.vehicle_category || 'BIKE',
        vehicle_id: driver.vehicle_id || ride.vehicle_id || 'bike',
        driver_avatar: driver.avatar || driver.selfie_photo || null,
        driver_rating: driver.rating || 4.9,
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString()
      });

      // Mark driver as busy (is_available: false)
      db.update('drivers', driver.id, { is_available: false });

      console.log(`✅ Ride ${rideId} accepted by Captain ${driver.name} at (${driver.lat}, ${driver.lng})`);

      // Notify passenger
      io.to(`user:${ride.rider_id}`).emit('ride:matched', {
        ride: updatedRide,
        driver: {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          vehicle_model: driver.vehicle_model,
          vehicle_number: driver.vehicle_number,
          vehicle_category: driver.vehicle_category || 'BIKE',
          vehicle_id: driver.vehicle_id || 'bike',
          avatar: driver.avatar || driver.selfie_photo,
          rating: driver.rating || 4.9,
          lat: driver.lat,
          lng: driver.lng,
          heading: driver.heading || 0
        }
      });

      // Notify driver room & sender socket
      io.to(`driver:${driver.id}`).emit('ride:assigned_success', { ride: updatedRide });
      if (driver.user_id) {
        io.to(`user:${driver.user_id}`).emit('ride:assigned_success', { ride: updatedRide });
      }
      socket.emit('ride:assigned_success', { ride: updatedRide });

      // Notify other drivers to dismiss their pending incoming request modal
      socket.broadcast.to('drivers:online').emit('driver:dismiss_request', { rideId });

      // Notify admin
      io.to('admins').emit('admin:ride_updated', { ride: updatedRide });
    });

    // 5. Driver Arrived at Pickup
    socket.on('driver:arrived_pickup', ({ rideId }) => {
      const ride = db.find('rides', r => r.id === rideId);
      if (!ride) return;

      const updated = db.update('rides', rideId, { status: 'ARRIVED' });
      console.log(`📍 Captain arrived at pickup for ride ${rideId}`);

      // Broadcast to passenger, driver rooms, and admins
      io.to(`user:${ride.rider_id}`).emit('ride:driver_arrived', { ride: updated });
      if (ride.driver_id) {
        io.to(`driver:${ride.driver_id}`).emit('ride:driver_arrived', { ride: updated });
        const drv = db.find('drivers', d => d.id === ride.driver_id);
        if (drv?.user_id) {
          io.to(`user:${drv.user_id}`).emit('ride:driver_arrived', { ride: updated });
        }
      }
      socket.emit('ride:driver_arrived', { ride: updated });
      io.to('admins').emit('admin:ride_updated', { ride: updated });
    });

    // 6. Driver starts ride (Verifies Passenger OTP)
    socket.on('driver:start_ride', ({ rideId, enteredOtp }, callback) => {
      const ride = db.find('rides', r => r.id === rideId);
      if (!ride) {
        if (callback) callback({ success: false, message: 'Ride not found' });
        return;
      }

      if (String(ride.otp || '').trim() !== String(enteredOtp || '').trim()) {
        console.log(`❌ Invalid OTP: entered=${enteredOtp}, expected=${ride.otp}`);
        if (callback) callback({ success: false, message: 'Incorrect 4-Digit PIN! Please check with passenger.' });
        return;
      }

      const updated = db.update('rides', rideId, {
        status: 'IN_PROGRESS',
        started_at: new Date().toISOString()
      });

      console.log(`🚀 Ride ${rideId} OTP verified & started!`);
      if (callback) callback({ success: true, ride: updated });

      io.to(`user:${ride.rider_id}`).emit('ride:started', { ride: updated });
      if (ride.driver_id) {
        io.to(`driver:${ride.driver_id}`).emit('ride:started', { ride: updated });
      }
      socket.emit('ride:started', { ride: updated });
      io.to('admins').emit('admin:ride_updated', { ride: updated });
    });

    // 7. Driver Completes Ride
    socket.on('driver:complete_ride', ({ rideId }) => {
      const ride = db.find('rides', r => r.id === rideId);
      if (!ride) return;

      const updated = db.update('rides', rideId, {
        status: 'COMPLETED',
        payment_status: 'PAID',
        completed_at: new Date().toISOString()
      });

      // Free up driver
      if (ride.driver_id) {
        const driver = db.find('drivers', d => d.id === ride.driver_id);
        if (driver) {
          const now = new Date();
          const hasActivePass = driver.subscription_expires_at && new Date(driver.subscription_expires_at) > now;
          
          // 0% Commission if Driver has Active 24-Hour Subscription Pass!
          const platformFee = hasActivePass ? 0 : (ride.fare * (db.data.settings.platform_commission_pct / 100));
          const driverEarning = ride.fare - platformFee;
          
          db.update('drivers', driver.id, {
            is_available: true,
            total_rides: (driver.total_rides || 0) + 1,
            today_earnings: Math.round((driver.today_earnings || 0) + driverEarning)
          });

          // Record payment transaction
          db.insert('payments', {
            id: `pay_${uuidv4().slice(0, 8)}`,
            ride_id: ride.id,
            user_id: ride.rider_id,
            driver_id: driver.id,
            amount: ride.fare,
            commission_amount: Number(platformFee.toFixed(2)),
            driver_amount: Number(driverEarning.toFixed(2)),
            method: ride.payment_mode || 'CASH',
            has_subscription_pass: hasActivePass,
            status: 'SUCCESS',
            created_at: new Date().toISOString()
          });
        }
      }

      console.log(`🏁 Ride ${rideId} completed!`);
      io.to(`user:${ride.rider_id}`).emit('ride:completed', { ride: updated });
      if (ride.driver_id) {
        io.to(`driver:${ride.driver_id}`).emit('ride:completed', { ride: updated });
      }
      socket.emit('ride:completed', { ride: updated });
      io.to('admins').emit('admin:ride_updated', { ride: updated });
    });

    // 8. Cancellation
    socket.on('ride:cancel', ({ rideId, reason, cancelledBy }) => {
      const ride = db.find('rides', r => r.id === rideId);
      if (!ride) return;

      const updated = db.update('rides', rideId, {
        status: 'CANCELLED',
        cancellation_reason: reason,
        cancelled_by: cancelledBy,
        cancelled_at: new Date().toISOString()
      });

      console.log(`🚫 Ride ${rideId} cancelled by ${cancelledBy}: ${reason}`);

      if (ride.driver_id) {
        db.update('drivers', ride.driver_id, { is_available: true });
        io.to(`driver:${ride.driver_id}`).emit('ride:cancelled_by_other', { ride: updated, cancelledBy, reason });
        const drv = db.find('drivers', d => d.id === ride.driver_id);
        if (drv?.user_id) {
          io.to(`user:${drv.user_id}`).emit('ride:cancelled_by_other', { ride: updated, cancelledBy, reason });
        }
      }

      io.to(`user:${ride.rider_id}`).emit('ride:cancelled_by_other', { ride: updated, cancelledBy, reason });
      io.to('drivers:online').emit('driver:dismiss_request', { rideId });
      io.to('admins').emit('admin:ride_updated', { ride: updated });
    });

    // 9. Real-time In-Ride Chat Messaging (Rider <-> Driver)
    socket.on('ride:send_chat_message', (messageData) => {
      const { rideId, senderRole, text } = messageData;
      const ride = db.find('rides', r => String(r.id) === String(rideId));
      if (!ride) return;

      console.log(`💬 In-Ride Message [${rideId}] from ${senderRole}: ${text?.slice(0, 30)}`);

      // Persist to database so messages are never lost
      const existing = Array.isArray(ride.messages) ? ride.messages : [];
      if (!existing.some(m => m.id === messageData.id)) {
        db.update('rides', ride.id, { messages: [...existing, messageData] });
      }

      // 1. Broadcast to ride room
      io.to(`ride:${ride.id}`).emit('ride:chat_message', messageData);

      // 2. Broadcast to specific user and driver rooms
      io.to(`user:${ride.rider_id}`).emit('ride:chat_message', messageData);
      if (ride.driver_id) {
        io.to(`driver:${ride.driver_id}`).emit('ride:chat_message', messageData);
        const drv = db.find('drivers', d => d.id === ride.driver_id);
        if (drv?.user_id) {
          io.to(`user:${drv.user_id}`).emit('ride:chat_message', messageData);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};
