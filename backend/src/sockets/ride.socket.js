import { db } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import { calculateDistance } from '../controllers/ride.controller.js';

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
    });

    socket.on('join_admin', () => {
      socket.join('admins');
      console.log(`💻 Admin joined 'admins' room`);
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
      
      const onlineDrivers = db.filter('drivers', d => d.is_online && d.is_available);
      
      // Calculate distance from each online Captain to the rider's pickup location
      const driversSorted = onlineDrivers.map(d => {
        const dist = (d.lat && d.lng && rideData.pickup_lat && rideData.pickup_lng)
          ? calculateDistance(rideData.pickup_lat, rideData.pickup_lng, d.lat, d.lng)
          : 999;
        return { driver: d, distance_km: dist };
      }).sort((a, b) => a.distance_km - b.distance_km);

      // Dispatch to each individual captain room with their specific distance to pickup
      driversSorted.forEach(({ driver, distance_km }) => {
        io.to(`driver:${driver.id}`).emit('driver:incoming_request', {
          ride: {
            ...rideData,
            driver_pickup_distance_km: distance_km
          }
        });
      });

      // Broadcast to general online drivers room
      io.to('drivers:online').emit('driver:incoming_request', {
        ride: rideData
      });

      // Also notify admins
      io.to('admins').emit('admin:ride_created', { ride: rideData });
    });

    // 4. Driver accepts ride
    socket.on('driver:accept_ride', ({ rideId, driverId }) => {
      const ride = db.find('rides', r => r.id === rideId);
      const driver = db.find('drivers', d => d.id === driverId || d.user_id === driverId);

      if (!ride || !driver) return;
      if (ride.status !== 'REQUESTED') {
        socket.emit('ride:already_taken', { message: 'This ride was already accepted by another Captain.' });
        return;
      }

      // Update ride with driver details
      const updatedRide = db.update('rides', rideId, {
        driver_id: driver.id,
        driver_name: driver.name,
        driver_phone: driver.phone,
        vehicle_model: driver.vehicle_model,
        vehicle_number: driver.vehicle_number,
        driver_rating: driver.rating,
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString()
      });

      // Mark driver as busy (is_available: false)
      db.update('drivers', driver.id, { is_available: false });

      console.log(`✅ Ride ${rideId} accepted by Captain ${driver.name}`);

      // Notify passenger
      io.to(`user:${ride.rider_id}`).emit('ride:matched', {
        ride: updatedRide,
        driver: {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          vehicle_model: driver.vehicle_model,
          vehicle_number: driver.vehicle_number,
          rating: driver.rating,
          lat: driver.lat,
          lng: driver.lng
        }
      });

      // Notify driver room
      io.to(`driver:${driver.id}`).emit('ride:assigned_success', { ride: updatedRide });

      // Notify other drivers to dismiss the incoming request modal
      socket.broadcast.to('drivers:online').emit('ride:request_cancelled', { rideId });

      // Notify admin
      io.to('admins').emit('admin:ride_updated', { ride: updatedRide });
    });

    // 5. Driver Arrived at Pickup
    socket.on('driver:arrived_pickup', ({ rideId }) => {
      const ride = db.find('rides', r => r.id === rideId);
      if (!ride) return;

      const updated = db.update('rides', rideId, { status: 'ARRIVED' });
      io.to(`user:${ride.rider_id}`).emit('ride:driver_arrived', { ride: updated });
      io.to('admins').emit('admin:ride_updated', { ride: updated });
    });

    // 6. Driver starts ride (Verifies Passenger OTP)
    socket.on('driver:start_ride', ({ rideId, enteredOtp }, callback) => {
      const ride = db.find('rides', r => r.id === rideId);
      if (!ride) {
        if (callback) callback({ success: false, message: 'Ride not found' });
        return;
      }

      if (ride.otp !== String(enteredOtp).trim()) {
        if (callback) callback({ success: false, message: 'Incorrect OTP! Ask passenger for 4-digit start OTP.' });
        return;
      }

      const updated = db.update('rides', rideId, {
        status: 'IN_PROGRESS',
        started_at: new Date().toISOString()
      });

      if (callback) callback({ success: true, ride: updated });

      io.to(`user:${ride.rider_id}`).emit('ride:started', { ride: updated });
      io.to(`driver:${ride.driver_id}`).emit('ride:started', { ride: updated });
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
          const platformFee = ride.fare * (db.data.settings.platform_commission_pct / 100);
          const driverEarning = ride.fare - platformFee;
          
          db.update('drivers', driver.id, {
            is_available: true,
            total_rides: (driver.total_rides || 0) + 1,
            today_earnings: (driver.today_earnings || 0) + driverEarning
          });

          // Record payment transaction
          db.insert('payments', {
            id: `pay_${uuidv4().slice(0, 8)}`,
            ride_id: ride.id,
            user_id: ride.rider_id,
            amount: ride.fare,
            commission_amount: Number(platformFee.toFixed(2)),
            driver_amount: Number(driverEarning.toFixed(2)),
            method: ride.payment_mode || 'CASH',
            status: 'SUCCESS',
            created_at: new Date().toISOString()
          });
        }
      }

      console.log(`🏁 Ride ${rideId} completed!`);
      io.to(`user:${ride.rider_id}`).emit('ride:completed', { ride: updated });
      io.to(`driver:${ride.driver_id}`).emit('ride:completed', { ride: updated });
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

      if (ride.driver_id) {
        db.update('drivers', ride.driver_id, { is_available: true });
        io.to(`driver:${ride.driver_id}`).emit('ride:cancelled_by_other', { ride: updated });
      }

      io.to(`user:${ride.rider_id}`).emit('ride:cancelled_by_other', { ride: updated });
      io.to('drivers:online').emit('ride:request_cancelled', { rideId });
      io.to('admins').emit('admin:ride_updated', { ride: updated });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};
