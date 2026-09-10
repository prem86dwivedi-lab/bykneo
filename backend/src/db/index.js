import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'bykneo_db.json');

// Default initial state with rich sample data for instant testing
const DEFAULT_DATA = {
  users: [
    {
      id: "usr_passenger_1",
      phone: "+91 9876543210",
      name: "Rahul Sharma",
      email: "rahul@bykneo.com",
      role: "passenger",
      avatar: null,
      wallet_balance: 0.00,
      rating: 4.9,
      created_at: new Date().toISOString()
    },
    {
      id: "usr_driver_1",
      phone: "+91 9123456780",
      name: "Vikram Singh",
      email: "vikram@bykneo.com",
      role: "driver",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
      wallet_balance: 0.00,
      rating: 4.85,
      created_at: new Date().toISOString()
    },
    {
      id: "usr_driver_2",
      phone: "+91 9811223344",
      name: "Amit Patel",
      email: "amit@bykneo.com",
      role: "driver",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      wallet_balance: 0.00,
      rating: 4.92,
      created_at: new Date().toISOString()
    },
    {
      id: "usr_admin_1",
      phone: "+91 9999999999",
      name: "Bykneo Super Admin",
      email: "admin@bykneo.com",
      role: "admin",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      wallet_balance: 0.00,
      rating: 5.0,
      created_at: new Date().toISOString()
    }
  ],
  drivers: [
    {
      id: "drv_1",
      user_id: "usr_driver_1",
      name: "Vikram Singh",
      phone: "+91 9123456780",
      vehicle_model: "Honda Shine (Black)",
      vehicle_number: "DL 03 AB 4589",
      license_number: "DL-1420180029341",
      is_online: true,
      is_available: true,
      lat: 28.6139,
      lng: 77.2090, // Central Delhi / Connaught Place
      heading: 45,
      rating: 4.85,
      total_rides: 342,
      today_earnings: 780.00,
      kyc_status: "approved" // approved, pending, rejected
    },
    {
      id: "drv_2",
      user_id: "usr_driver_2",
      name: "Amit Patel",
      phone: "+91 9811223344",
      vehicle_model: "Hero Splendor Plus",
      vehicle_number: "DL 07 XY 1290",
      license_number: "DL-0820200034123",
      is_online: true,
      is_available: true,
      lat: 28.6250,
      lng: 77.2180,
      heading: 90,
      rating: 4.92,
      total_rides: 512,
      today_earnings: 1120.00,
      kyc_status: "approved"
    },
    {
      id: "drv_3",
      user_id: "usr_driver_3",
      name: "Suresh Kumar",
      phone: "+91 9871100223",
      vehicle_model: "TVS Apache RTR 160",
      vehicle_number: "UP 16 CD 7821",
      license_number: "UP-1620190018273",
      is_online: false,
      is_available: false,
      lat: 28.5700,
      lng: 77.3200,
      heading: 0,
      rating: 4.70,
      total_rides: 180,
      today_earnings: 0.00,
      kyc_status: "pending"
    }
  ],
  rides: [
    {
      id: "ride_101",
      rider_id: "usr_passenger_1",
      rider_name: "Rahul Sharma",
      rider_phone: "+91 9876543210",
      driver_id: "drv_1",
      driver_name: "Vikram Singh",
      driver_phone: "+91 9123456780",
      vehicle_model: "Honda Shine",
      vehicle_number: "DL 03 AB 4589",
      pickup_name: "Connaught Place Inner Circle, New Delhi",
      pickup_lat: 28.6315,
      pickup_lng: 77.2167,
      drop_name: "India Gate, Rajpath, New Delhi",
      drop_lat: 28.6129,
      drop_lng: 77.2295,
      fare: 65.00,
      distance_km: 3.2,
      duration_mins: 9,
      status: "COMPLETED", // REQUESTED, ACCEPTED, ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED
      otp: "4829",
      payment_mode: "UPI",
      payment_status: "PAID",
      rider_rating: 5,
      driver_rating: 5,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      completed_at: new Date(Date.now() - 3600000 * 1.8).toISOString()
    }
  ],
  payments: [
    {
      id: "pay_101",
      ride_id: "ride_101",
      user_id: "usr_passenger_1",
      amount: 65.00,
      commission_amount: 9.75, // 15% platform commission
      driver_amount: 55.25,
      method: "UPI",
      status: "SUCCESS",
      created_at: new Date(Date.now() - 3600000 * 1.8).toISOString()
    }
  ],
  complaints: [
    {
      id: "cmp_1",
      user_id: "usr_passenger_1",
      user_name: "Rahul Sharma",
      ride_id: "ride_101",
      subject: "Helmet was loose",
      description: "Captain provided clean helmet but lock strap was slightly loose.",
      status: "RESOLVED",
      priority: "LOW",
      created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    }
  ],
  cities: [
    {
      id: "city_bhopal",
      name: "Bhopal",
      state: "Madhya Pradesh",
      lat: 23.2599,
      lng: 77.4126,
      radius_km: 30, // 30 KM radius
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: "city_delhi",
      name: "Delhi NCR",
      state: "Delhi",
      lat: 28.6139,
      lng: 77.2090,
      radius_km: 35, // 35 KM radius
      is_active: true,
      created_at: new Date().toISOString()
    }
  ],
  settings: {
    base_fare: 25.00, // covers first 1.5 km
    rate_per_km: 6.80,
    rate_per_min: 0.15,
    surge_multiplier: 1.0,
    platform_commission_pct: 15.0, // Bykneo takes 15%
    cancellation_fee: 15.00,
    auto_kyc_enabled: true,
    subscription_enabled: true,
    admin_upi_id: "bykneo@okhdfcbank",
    admin_merchant_name: "Bykneo Mobility",
    subscription_pricing: {
      bike_lite: 20,
      bike: 25,
      auto_lite: 30,
      auto: 35,
      cab_economy: 55,
      cab_premium: 70
    },
    allowed_pass_durations: [1, 2, 3, 5, 7, 10, 20, 30],
    pass_pack_discounts: {
      "1": 0,
      "2": 0,
      "3": 0,
      "5": 0,
      "7": 5,
      "10": 5,
      "15": 10,
      "20": 10,
      "30": 15
    },
    razorpay_key_id: "rzp_live_TAKnbp18wnY8Mu",
    razorpay_key_secret: "KEXn7SaynyjQ0uQhIlscY1Sc",
    geofencing_enabled: true // When true, restricts booking to active cities
  }
};

class Database {
  constructor() {
    this.data = DEFAULT_DATA;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
    } catch (e) {
      console.error("Failed to load db, resetting to default:", e);
      this.data = DEFAULT_DATA;
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error("Error saving DB:", e);
    }
  }

  // Collections helper
  get(collection) {
    return this.data[collection] || [];
  }

  find(collection, predicate) {
    const list = this.get(collection);
    return list.find(predicate);
  }

  filter(collection, predicate) {
    const list = this.get(collection);
    return list.filter(predicate);
  }

  insert(collection, item) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    this.data[collection].unshift(item);
    this.save();
    return item;
  }

  update(collection, id, updates) {
    const list = this.get(collection);
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[collection][index] = { ...this.data[collection][index], ...updates };
      this.save();
      return this.data[collection][index];
    }
    return null;
  }

  delete(collection, id) {
    const list = this.get(collection);
    this.data[collection] = list.filter(item => item.id !== id);
    this.save();
    return true;
  }
}

export const db = new Database();
