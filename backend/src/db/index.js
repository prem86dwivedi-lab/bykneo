import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'bykneo_db.json');

// Default initial state for production (No mock/simulated drivers or riders)
const DEFAULT_DATA = {
  users: [
    {
      id: "usr_admin_1",
      phone: "+91 79747 04918",
      name: "RiderXO Super Admin",
      email: "admin@riderxo.com",
      role: "admin",
      avatar: null,
      wallet_balance: 0.00,
      rating: 5.0,
      created_at: new Date().toISOString()
    }
  ],
  drivers: [],
  rides: [],
  payments: [],
  complaints: [],
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
  },
  push_subscriptions: []   // { id, driver_id, subscription, created_at, updated_at }
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
