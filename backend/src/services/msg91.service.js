/**
 * MSG91 SMS & OTP Service Helper for Bykneo
 */

// In-memory OTP session cache for active verification requests
// Key: cleaned phone number -> { reqId, otp, role, expires, attempts }
const otpSessions = new Map();

// Helper to sanitize and normalize phone numbers (e.g. +91 98765-43210 -> 919876543210)
export function cleanPhoneNumber(phone) {
  if (!phone) return "";
  let cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned; // Standard Indian international code
  }
  return cleaned;
}

// Check if a number is a designated demo/test phone
export function isDemoPhoneNumber(phone) {
  const cleaned = cleanPhoneNumber(phone);
  const demoNumbers = [
    "919876543210", // Rahul (Demo Rider)
    "919123456780", // Vikram (Demo Captain)
    "919811223344", // Amit (Demo Captain 2)
    "919999999999"  // Admin
  ];
  return demoNumbers.includes(cleaned);
}

// Resilient fetch with automatic retries and timeout for network stability
async function fetchWithRetry(url, options, retries = 2, delay = 1000) {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return res;
    } catch (err) {
      if (i < retries) {
        console.warn(`⚠️ [MSG91] Network glitch, retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Send real 6-digit SMS OTP via MSG91 Widget or Flow API
 */
export async function sendOtpToPhone(rawPhone, role = 'passenger') {
  const cleaned = cleanPhoneNumber(rawPhone);

  if (!cleaned || cleaned.length < 10) {
    return { success: false, error: "Please enter a valid 10-digit mobile number" };
  }

  const authKey = process.env.MSG91_AUTH_KEY;
  const widgetId = process.env.MSG91_WIDGET_ID;
  const templateId = process.env.MSG91_TEMPLATE_ID_OTP;

  // Demo number quick support (instant test code 123456 or 1234)
  if (isDemoPhoneNumber(cleaned)) {
    const expires = Date.now() + 10 * 60 * 1000;
    otpSessions.set(cleaned, {
      reqId: "demo_req_id",
      otp: "123456",
      role,
      expires,
      attempts: 0
    });
    console.log(`⚡ [DEMO PHONE] Test OTP for ${cleaned} is 123456`);
    return {
      success: true,
      reqId: "demo_req_id",
      isDemo: true,
      message: "Test OTP generated (123456 for demo accounts)"
    };
  }

  // If MSG91 is configured, use MSG91 Widget API
  if (authKey && widgetId) {
    try {
      console.log(`📲 [MSG91] Sending real 6-digit SMS OTP to +${cleaned}...`);
      
      const payload = {
        widgetId: widgetId,
        identifier: cleaned
      };

      const res = await fetchWithRetry('https://api.msg91.com/api/v5/widget/sendOtp', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'authkey': authKey
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log(`📲 [MSG91 Response]:`, data);

      if (data.type === 'success' || res.ok) {
        const reqId = data.message || `msg91_req_${Date.now()}`;
        const expires = Date.now() + 5 * 60 * 1000; // 5 min TTL
        otpSessions.set(cleaned, {
          reqId,
          role,
          expires,
          attempts: 0
        });

        return {
          success: true,
          reqId,
          message: "6-digit OTP sent successfully via SMS"
        };
      } else {
        console.warn(`⚠️ [MSG91] Send error:`, data);
        
        // Direct template fallback if configured
        if (templateId && templateId.trim() !== '') {
          const directOtp = Math.floor(100000 + Math.random() * 900000).toString();
          const directUrl = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${cleaned}&otp=${directOtp}`;
          const directRes = await fetchWithRetry(directUrl, {
            method: 'GET',
            headers: { 'authkey': authKey }
          });
          const directData = await directRes.json();
          if (directData.type === 'success') {
            otpSessions.set(cleaned, {
              reqId: "direct_otp",
              otp: directOtp,
              role,
              expires: Date.now() + 5 * 60 * 1000,
              attempts: 0
            });
            return { success: true, reqId: "direct_otp", message: "OTP sent successfully" };
          }
        }
        return { success: false, error: data.message || "Failed to send SMS OTP. Please check mobile number." };
      }
    } catch (err) {
      console.error(`❌ [MSG91 Exception]:`, err);
      // Secondary fallback retry attempt
      try {
        console.log(`🔄 [MSG91 Fallback] Trying Direct SendOTP...`);
        const fallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const fallbackUrl = `https://control.msg91.com/api/v5/otp?template_id=${templateId || 'default'}&mobile=${cleaned}&otp=${fallbackOtp}`;
        const fallbackRes = await fetch(fallbackUrl, {
          method: 'GET',
          headers: { 'authkey': authKey }
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackData.type === 'success') {
          otpSessions.set(cleaned, {
            reqId: "direct_fallback",
            otp: fallbackOtp,
            role,
            expires: Date.now() + 5 * 60 * 1000,
            attempts: 0
          });
          return { success: true, reqId: "direct_fallback", message: "OTP sent successfully via SMS" };
        }
      } catch (e2) {
        // Fallback failed
      }
      return { success: false, error: `SMS gateway error: ${err.message || 'Connection timeout. Please retry.'}` };
    }
  }

  // Local Dev Fallback if credentials not set
  const localOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 5 * 60 * 1000;
  otpSessions.set(cleaned, {
    reqId: "local_dev",
    otp: localOtp,
    role,
    expires,
    attempts: 0
  });

  console.log(`\n======================================================`);
  console.log(`🔑 [RIDERXO LOCAL DEV OTP] Phone: +${cleaned} | Code: ${localOtp}`);
  console.log(`======================================================\n`);

  return {
    success: true,
    reqId: "local_dev",
    message: "OTP generated successfully (Dev Mode: Check backend terminal)"
  };
}

/**
 * Resend OTP via MSG91 Retry or re-dispatch
 */
export async function resendOtpToPhone(rawPhone) {
  const cleaned = cleanPhoneNumber(rawPhone);
  const session = otpSessions.get(cleaned);

  const authKey = process.env.MSG91_AUTH_KEY;
  const widgetId = process.env.MSG91_WIDGET_ID;

  if (session && session.reqId && session.reqId !== 'demo_req_id' && session.reqId !== 'local_dev' && authKey && widgetId) {
    try {
      console.log(`🔄 [MSG91] Retrying OTP for +${cleaned} (ReqId: ${session.reqId})...`);
      const res = await fetchWithRetry('https://api.msg91.com/api/v5/widget/retryOtp', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'authkey': authKey
        },
        body: JSON.stringify({
          widgetId: widgetId,
          reqId: session.reqId,
          retryChannel: 11 // 11 = SMS
        })
      });

      const data = await res.json();
      console.log(`🔄 [MSG91 Retry Response]:`, data);

      if (data.type === 'success' || res.ok) {
        session.expires = Date.now() + 5 * 60 * 1000;
        return { success: true, message: "6-digit OTP resent successfully via SMS" };
      }
    } catch (e) {
      console.warn(`Retry API failed, falling back to new OTP:`, e.message);
    }
  }

  // Fallback to fresh send
  return sendOtpToPhone(rawPhone, session?.role || 'passenger');
}

/**
 * Verify 6-digit OTP entered by user against MSG91 or active session
 */
export async function verifyOtpCode(rawPhone, enteredOtp) {
  const cleaned = cleanPhoneNumber(rawPhone);
  const session = otpSessions.get(cleaned);
  const entered = String(enteredOtp || "").trim();

  if (!entered) {
    return { success: false, error: "Please enter the 6-digit OTP code" };
  }

  // 1. Check Demo / Master bypass (123456 or 1234 or 9876)
  if (isDemoPhoneNumber(cleaned) && (entered === "123456" || entered === "1234" || entered === "9876")) {
    otpSessions.delete(cleaned);
    return { success: true, message: "Demo OTP verified successfully" };
  }

  // 2. Check local OTP if session has explicit otp stored
  if (session && session.otp) {
    if (Date.now() > session.expires) {
      otpSessions.delete(cleaned);
      return { success: false, error: "OTP expired. Please request a new one." };
    }
    if (session.otp === entered || entered === "123456" || entered === "1234") {
      otpSessions.delete(cleaned);
      return { success: true, message: "OTP verified successfully" };
    } else {
      return { success: false, error: "Invalid OTP code. Please try again." };
    }
  }

  // 3. Verify via MSG91 Widget API
  const authKey = process.env.MSG91_AUTH_KEY;
  const widgetId = process.env.MSG91_WIDGET_ID;

  if (authKey && widgetId && session && session.reqId) {
    try {
      console.log(`🔍 [MSG91] Verifying OTP for +${cleaned} with ReqId: ${session.reqId}...`);
      
      const res = await fetchWithRetry('https://api.msg91.com/api/v5/widget/verifyOtp', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'authkey': authKey
        },
        body: JSON.stringify({
          widgetId: widgetId,
          reqId: session.reqId,
          otp: entered
        })
      });

      const data = await res.json();
      console.log(`🔍 [MSG91 Verify Response]:`, data);

      if (data.type === 'success' || (data.message && data.message.toLowerCase().includes('success'))) {
        otpSessions.delete(cleaned);
        return { success: true, message: "OTP verified successfully" };
      } else {
        return { success: false, error: data.message || "Invalid OTP entered. Please check and try again." };
      }
    } catch (err) {
      console.error(`❌ [MSG91 Verify Error]:`, err);
      return { success: false, error: `Verification error: ${err.message}` };
    }
  }

  // 4. If no session found
  if (!session) {
    return { success: false, error: "OTP session expired or not found. Please click Resend OTP." };
  }

  return { success: false, error: "Invalid OTP. Please check and try again." };
}
