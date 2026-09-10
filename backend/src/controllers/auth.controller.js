import { db } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import { sendOtpToPhone, resendOtpToPhone, verifyOtpCode, cleanPhoneNumber } from '../services/msg91.service.js';
import { saveBase64Image } from '../utils/fileStorage.js';

// Format phone for standard presentation: e.g. "917974704918" -> "+91 79747 04918"
function formatDisplayPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    const main = digits.slice(2);
    return `+91 ${main.slice(0, 5)} ${main.slice(5)}`;
  } else if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return raw;
}

// Find user by flexible phone matching (exact or digit matching)
function findUserByPhone(phone) {
  const targetDigits = String(phone).replace(/\D/g, '');
  if (!targetDigits) return null;
  return db.find('users', u => {
    const userDigits = String(u.phone || '').replace(/\D/g, '');
    return userDigits === targetDigits || 
           userDigits.endsWith(targetDigits) || 
           targetDigits.endsWith(userDigits);
  });
}

// Find driver profile by user id or phone
function findDriverProfile(userId, phone) {
  let driver = null;
  if (userId) {
    driver = db.find('drivers', d => d.user_id === userId);
  }
  if (!driver && phone) {
    const targetDigits = String(phone).replace(/\D/g, '');
    if (targetDigits) {
      driver = db.find('drivers', d => {
        const dDigits = String(d.phone || '').replace(/\D/g, '');
        return dDigits === targetDigits || dDigits.endsWith(targetDigits) || targetDigits.endsWith(dDigits);
      });
    }
  }
  return driver;
}

/**
 * Step 1: Send 6-digit SMS OTP via MSG91
 */
export const sendOtp = async (req, res) => {
  try {
    const { phone, role = 'passenger' } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, error: "Mobile number is required" });
    }

    const cleaned = cleanPhoneNumber(phone);
    if (!cleaned || cleaned.length < 10) {
      return res.status(400).json({ success: false, error: "Please enter a valid 10-digit mobile number" });
    }

    const existingUser = findUserByPhone(phone);
    const result = await sendOtpToPhone(phone, role);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.json({
      success: true,
      message: result.message || "OTP sent successfully to your mobile number",
      reqId: result.reqId,
      isExistingUser: !!existingUser,
      user: existingUser ? {
        id: existingUser.id,
        name: existingUser.name,
        role: existingUser.role,
        phone: existingUser.phone
      } : null
    });
  } catch (err) {
    console.error("sendOtp error:", err);
    return res.status(500).json({ success: false, error: "Internal server error dispatching OTP" });
  }
};

/**
 * Step 1.5: Resend OTP via MSG91
 */
export const resendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: "Mobile number is required" });
    }

    const result = await resendOtpToPhone(phone);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.json({
      success: true,
      message: result.message || "OTP resent successfully"
    });
  } catch (err) {
    console.error("resendOtp error:", err);
    return res.status(500).json({ success: false, error: "Failed to resend OTP" });
  }
};

/**
 * Step 2: Verify 6-digit OTP
 */
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, role = 'passenger' } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, error: "Phone number and OTP are required" });
    }

    const verifyResult = await verifyOtpCode(phone, otp);
    if (!verifyResult.success) {
      return res.status(400).json({ success: false, error: verifyResult.error || "Invalid OTP code" });
    }

    // OTP verified successfully!
    const existingUser = findUserByPhone(phone);

    if (role === 'passenger') {
      // For Rider: existing if has complete registered name
      const isRealRider = existingUser && 
                          existingUser.name && 
                          !existingUser.name.toLowerCase().startsWith('new ') && 
                          existingUser.name.toLowerCase() !== 'rider' &&
                          existingUser.name.toLowerCase() !== 'captain';

      if (isRealRider) {
        return res.json({
          success: true,
          verified: true,
          isNewUser: false,
          user: existingUser,
          driverProfile: null,
          token: `bykneo_token_${existingUser.id}`
        });
      } else {
        // Needs Rider Name Registration
        return res.json({
          success: true,
          verified: true,
          isNewUser: true,
          phone: formatDisplayPhone(phone),
          role: 'passenger'
        });
      }
    } else {
      // For Captain: existing if has complete driver record with documents and KYC status
      const existingDriver = findDriverProfile(existingUser?.id, phone);
      const isRealCaptain = existingUser && 
                            existingDriver && 
                            existingDriver.license_number && 
                            existingDriver.vehicle_number && 
                            !existingDriver.name?.toLowerCase().startsWith('new ') && 
                            existingDriver.kyc_status;

      if (isRealCaptain) {
        return res.json({
          success: true,
          verified: true,
          isNewUser: false,
          user: existingUser,
          driverProfile: existingDriver,
          kycStatus: existingDriver.kyc_status,
          token: `bykneo_token_${existingUser.id}`
        });
      } else {
        // Needs Full Captain Registration & KYC Submission
        return res.json({
          success: true,
          verified: true,
          isNewUser: true,
          phone: formatDisplayPhone(phone),
          role: 'driver',
          existingDriver: existingDriver || null
        });
      }
    }
  } catch (err) {
    console.error("verifyOtp error:", err);
    return res.status(500).json({ success: false, error: "Internal server error during verification" });
  }
};

/**
 * Step 3: Complete Rider or Captain Registration Profile & KYC
 */
export const completeProfile = async (req, res) => {
  try {
    const {
      phone,
      role = 'passenger',
      name,
      email,
      vehicle_id = 'bike',
      vehicle_category = 'BIKE',
      vehicle_type_name = 'Bykneo Bike',
      vehicle_model,
      vehicle_number,
      license_number,
      rc_number,
      aadhaar_number,
      payout_upi,
      dl_photo,
      rc_photo,
      aadhaar_photo,
      selfie_photo
    } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, error: "Phone number is required" });
    }

    const formattedPhone = formatDisplayPhone(phone);
    const cleanDigits = String(phone).replace(/\D/g, '');
    const finalName = (name || '').trim() || (role === 'driver' ? 'Bykneo Captain' : 'Bykneo Rider');
    const finalEmail = (email || '').trim() || `${cleanDigits}@bykneo.com`;

    let user = findUserByPhone(phone);

    if (!user) {
      user = db.insert('users', {
        id: `usr_${uuidv4().slice(0, 8)}`,
        phone: formattedPhone,
        name: finalName,
        email: finalEmail,
        role: role,
        avatar: role === 'driver' ? (selfie_photo || null) : null,
        wallet_balance: 0.00,
        rating: 5.0,
        created_at: new Date().toISOString()
      });
    } else {
      user = db.update('users', user.id, {
        name: finalName,
        email: finalEmail,
        role: role,
        phone: formattedPhone,
        avatar: role === 'driver' ? (selfie_photo || user.avatar || null) : null
      });
    }

    let driverProfile = null;

    if (role === 'driver') {
      const isAutoKyc = db.data?.settings?.auto_kyc_enabled === true;
      const initialStatus = isAutoKyc ? 'approved' : 'pending';

      driverProfile = findDriverProfile(user.id, phone);
      const targetDriverId = driverProfile?.id || `drv_${uuidv4().slice(0, 8)}`;

      // Save base64 images to disk and get clean accessible URLs
      const savedDlPhoto = saveBase64Image(dl_photo, 'dl', targetDriverId);
      const savedRcPhoto = saveBase64Image(rc_photo, 'rc', targetDriverId);
      const savedAadhaarPhoto = saveBase64Image(aadhaar_photo, 'aadhaar', targetDriverId);
      const savedSelfiePhoto = saveBase64Image(selfie_photo, 'selfie', targetDriverId);

      const driverData = {
        name: finalName,
        phone: formattedPhone,
        avatar: savedSelfiePhoto || user.avatar,
        vehicle_id: vehicle_id || 'bike',
        vehicle_category: vehicle_category || 'BIKE',
        vehicle_type_name: vehicle_type_name || 'Bykneo Bike',
        vehicle_model: vehicle_model || 'Hero Splendor Plus',
        vehicle_number: (vehicle_number || '').toUpperCase(),
        license_number: (license_number || '').toUpperCase(),
        rc_number: (rc_number || '').toUpperCase(),
        aadhaar_number: aadhaar_number || '',
        payout_upi: payout_upi || '',
        dl_photo: savedDlPhoto || driverProfile?.dl_photo || '',
        rc_photo: savedRcPhoto || driverProfile?.rc_photo || '',
        aadhaar_photo: savedAadhaarPhoto || driverProfile?.aadhaar_photo || '',
        selfie_photo: savedSelfiePhoto || driverProfile?.selfie_photo || '',
        is_online: isAutoKyc, // Only online if auto-approved
        is_available: true,
        lat: 28.6139,
        lng: 77.2090,
        heading: 0,
        rating: 5.0,
        total_rides: 0,
        today_earnings: 0.00,
        kyc_status: initialStatus,
        kyc_submitted_at: new Date().toISOString()
      };

      if (savedSelfiePhoto && user?.id) {
        db.update('users', user.id, { avatar: savedSelfiePhoto });
      }

      if (!driverProfile) {
        driverProfile = db.insert('drivers', {
          id: targetDriverId,
          user_id: user.id,
          ...driverData
        });
      } else {
        driverProfile = db.update('drivers', driverProfile.id, {
          user_id: user.id,
          ...driverData
        });
      }

      // Real-time broadcast to Admin Dashboard
      const io = req.app.get('io');
      if (io) {
        if (!isAutoKyc) {
          console.log(`📢 [ADMIN ALERT] Emitting admin:kyc_submitted for Captain ${driverProfile.name}`);
          io.to('admins').emit('admin:kyc_submitted', {
            driverId: driverProfile.id,
            name: driverProfile.name,
            phone: driverProfile.phone,
            vehicle_id: driverProfile.vehicle_id,
            vehicle_category: driverProfile.vehicle_category,
            vehicle_type_name: driverProfile.vehicle_type_name,
            vehicle_model: driverProfile.vehicle_model,
            vehicle_number: driverProfile.vehicle_number,
            submitted_at: driverProfile.kyc_submitted_at
          });
        }
      }
    }

    console.log(`✅ [REGISTRATION SAVED] ${role.toUpperCase()}: ${user.name} (${user.phone}) saved.`);

    return res.json({
      success: true,
      user,
      driverProfile,
      token: `bykneo_token_${user.id}`,
      message: `${role === 'driver' ? 'Captain' : 'Rider'} registration saved successfully!`
    });
  } catch (err) {
    console.error("completeProfile error:", err);
    return res.status(500).json({ success: false, error: "Failed to save registration details" });
  }
};

/**
 * 1-Click Quick Demo Login (for Rahul & Vikram Demo buttons)
 */
export const quickDemoLogin = (req, res) => {
  const { phone, role = 'passenger' } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  let user = findUserByPhone(phone);

  if (!user) {
    user = db.insert('users', {
      id: `usr_${uuidv4().slice(0, 8)}`,
      phone: formatDisplayPhone(phone),
      name: role === 'driver' ? 'Vikram Singh (Demo)' : 'Rahul Sharma (Demo)',
      email: `${phone.replace(/\D/g, '')}@bykneo.com`,
      role,
      avatar: role === 'driver' ? 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150' : null,
      wallet_balance: 0.00,
      rating: 5.0,
      created_at: new Date().toISOString()
    });
  }

  let driverProfile = null;
  if (user.role === 'driver' || role === 'driver') {
    driverProfile = findDriverProfile(user.id, phone);
    if (!driverProfile) {
      driverProfile = db.insert('drivers', {
        id: `drv_${uuidv4().slice(0, 8)}`,
        user_id: user.id,
        name: user.name,
        phone: user.phone,
        vehicle_model: "Honda Shine (Black)",
        vehicle_number: "DL 03 AB 4589",
        license_number: "DL-1420180029341",
        is_online: true,
        is_available: true,
        lat: 28.6139,
        lng: 77.2090,
        heading: 0,
        rating: 4.85,
        total_rides: 342,
        today_earnings: 780.00,
        kyc_status: "approved"
      });
    }
  }

  return res.json({
    success: true,
    user,
    driverProfile,
    token: `bykneo_token_${user.id}`
  });
};

export const switchRole = (req, res) => {
  const { userId, newRole } = req.body;
  const user = db.find('users', u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const updatedUser = db.update('users', userId, { role: newRole });
  let driverProfile = null;
  if (newRole === 'driver') {
    driverProfile = db.find('drivers', d => d.user_id === userId);
    if (!driverProfile) {
      driverProfile = db.insert('drivers', {
        id: `drv_${uuidv4().slice(0, 8)}`,
        user_id: userId,
        name: user.name,
        phone: user.phone,
        vehicle_model: "Hero Splendor iSmart",
        vehicle_number: "DL 09 PQ 3456",
        license_number: "DL-SWITCH-01928",
        is_online: true,
        is_available: true,
        lat: 28.6139,
        lng: 77.2090,
        heading: 0,
        rating: 5.0,
        total_rides: 0,
        today_earnings: 0.00,
        kyc_status: "approved"
      });
    }
  }

  return res.json({
    success: true,
    user: updatedUser,
    driverProfile
  });
};

export const getDemoAccounts = (req, res) => {
  const passengers = db.filter('users', u => u.role === 'passenger');
  const drivers = db.get('drivers');
  const admins = db.filter('users', u => u.role === 'admin');

  return res.json({
    passengers,
    drivers,
    admins
  });
};
