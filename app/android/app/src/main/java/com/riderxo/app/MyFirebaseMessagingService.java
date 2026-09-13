package com.riderxo.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;
import androidx.annotation.NonNull;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "RiderXO_FCM";
    public static final String PREFS_NAME = "RiderXOPrefs";
    public static final String KEY_FCM_TOKEN = "fcm_token";

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "🔥 New FCM Device Token received: " + token);
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_FCM_TOKEN, token).apply();
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Log.d(TAG, "📩 FCM Message received from: " + remoteMessage.getFrom());

        String rideId = "";
        String title = "🚨 NEW RIDE REQUEST!";
        String body = "A rider is waiting nearby. Tap to view and accept.";

        // 1. Extract from Data payload
        Map<String, String> data = remoteMessage.getData();
        if (data != null && !data.isEmpty()) {
            if (data.containsKey("rideId")) {
                rideId = data.get("rideId");
            }
            if (data.containsKey("title") && data.get("title") != null) {
                title = data.get("title");
            }
            if (data.containsKey("body") && data.get("body") != null) {
                body = data.get("body");
            }
        }

        // 2. Fallback to notification payload if present
        if (remoteMessage.getNotification() != null) {
            if (remoteMessage.getNotification().getTitle() != null) {
                title = remoteMessage.getNotification().getTitle();
            }
            if (remoteMessage.getNotification().getBody() != null) {
                body = remoteMessage.getNotification().getBody();
            }
        }

        // 3. Immediately trigger OS-Level Wakeup, Siren, Ringtone & Heads-Up Notification
        try {
            DriverKeepAliveService service = DriverKeepAliveService.getInstance();
            if (service != null) {
                service.triggerRideAlert(rideId, title, body);
            } else {
                Intent serviceIntent = new Intent(this, DriverKeepAliveService.class);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(serviceIntent);
                } else {
                    startService(serviceIntent);
                }

                // Small delay to allow service onCreate to complete before triggering alert
                final String finalRideId = rideId;
                final String finalTitle = title;
                final String finalBody = body;
                new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        DriverKeepAliveService runningService = DriverKeepAliveService.getInstance();
                        if (runningService != null) {
                            runningService.triggerRideAlert(finalRideId, finalTitle, finalBody);
                        }
                    }
                }, 400);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error triggering ride alert from FCM: " + e.getMessage(), e);
        }
    }
}
