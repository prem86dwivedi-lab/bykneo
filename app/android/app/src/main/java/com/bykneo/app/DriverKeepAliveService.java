package com.bykneo.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.core.app.NotificationCompat;

public class DriverKeepAliveService extends Service {
    public static final String CHANNEL_SERVICE_ID = "bykneo_driver_service_v1";
    public static final String CHANNEL_ALERT_ID = "bykneo-ride-urgent-v3";
    private static final int SERVICE_NOTIFICATION_ID = 8801;
    private static final int ALERT_NOTIFICATION_ID = 8802;

    private static DriverKeepAliveService instance = null;
    private PowerManager.WakeLock partialWakeLock = null;
    private WifiManager.WifiLock wifiLock = null;
    private Ringtone alarmRingtone = null;
    private Vibrator vibrator = null;

    public static DriverKeepAliveService getInstance() {
        return instance;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        createNotificationChannels();
        acquireLocks();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Notification notification = buildForegroundNotification();
        try {
            startForeground(SERVICE_NOTIFICATION_ID, notification);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        releaseLocks();
        stopRideAlert();
        instance = null;
        super.onDestroy();
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;

            // 1. Silent Ongoing Service Channel
            NotificationChannel serviceChannel = new NotificationChannel(
                CHANNEL_SERVICE_ID,
                "Driver Online Background Service",
                NotificationManager.IMPORTANCE_LOW
            );
            serviceChannel.setDescription("Keeps RiderXO driver online and ready for incoming bookings in background");
            serviceChannel.setShowBadge(false);
            manager.createNotificationChannel(serviceChannel);

            // 2. High Priority Alert Channel with Sound & Vibration
            NotificationChannel alertChannel = new NotificationChannel(
                CHANNEL_ALERT_ID,
                "Incoming Ride Booking Alerts",
                NotificationManager.IMPORTANCE_HIGH
            );
            alertChannel.setDescription("Loud siren and heads-up banner when rider books a ride");
            alertChannel.enableVibration(true);
            alertChannel.setVibrationPattern(new long[]{0, 800, 300, 800, 300, 800});
            alertChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            alertChannel.setBypassDnd(true);
            manager.createNotificationChannel(alertChannel);
        }
    }

    private Notification buildForegroundNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        return new NotificationCompat.Builder(this, CHANNEL_SERVICE_ID)
            .setContentTitle("🟢 RIDERXO Captain Online")
            .setContentText("Active & searching for nearby passenger ride requests...")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build();
    }

    private void acquireLocks() {
        try {
            PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (powerManager != null && partialWakeLock == null) {
                partialWakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "RIDERXO::DriverPartialWakeLock");
                partialWakeLock.acquire();
            }

            WifiManager wifiManager = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wifiManager != null && wifiLock == null) {
                wifiLock = wifiManager.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "RIDERXO::DriverWifiLock");
                wifiLock.acquire();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void releaseLocks() {
        try {
            if (partialWakeLock != null && partialWakeLock.isHeld()) {
                partialWakeLock.release();
                partialWakeLock = null;
            }
            if (wifiLock != null && wifiLock.isHeld()) {
                wifiLock.release();
                wifiLock = null;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void triggerRideAlert(String rideId, String title, String body) {
        // 1. Wake the screen up (even from pocket / black screen)
        try {
            PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (powerManager != null) {
                @SuppressWarnings("deprecation")
                PowerManager.WakeLock screenWakeLock = powerManager.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK |
                    PowerManager.ACQUIRE_CAUSES_WAKEUP |
                    PowerManager.ON_AFTER_RELEASE,
                    "BYKNEO::IncomingRideScreenWake"
                );
                screenWakeLock.acquire(30000); // 30 seconds max
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 2. Play Loud Alarm Audio Stream
        try {
            stopRideAlert();
            Uri alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            if (alertUri == null) {
                alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            }
            if (alertUri == null) {
                alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
            alarmRingtone = RingtoneManager.getRingtone(getApplicationContext(), alertUri);
            if (alarmRingtone != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build();
                    alarmRingtone.setAudioAttributes(audioAttributes);
                } else {
                    alarmRingtone.setStreamType(AudioManager.STREAM_ALARM);
                }
                alarmRingtone.play();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 3. Trigger Strong Repeating Vibration
        try {
            vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = new long[]{0, 800, 300, 800, 300, 800, 300, 800};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1));
                } else {
                    vibrator.vibrate(pattern, -1);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 4. Create FullScreen Intent & Heads-up Notification
        try {
            Intent fullScreenIntent = new Intent(this, MainActivity.class);
            fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            fullScreenIntent.putExtra("RIDE_ID", rideId);
            fullScreenIntent.putExtra("ACTION", "INCOMING_RIDE");

            PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
                this,
                ALERT_NOTIFICATION_ID,
                fullScreenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ALERT_ID)
                .setContentTitle(title != null && !title.isEmpty() ? title : "🚨 NEW RIDE REQUEST!")
                .setContentText(body != null && !body.isEmpty() ? body : "Tap immediately to view details and accept booking.")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setFullScreenIntent(fullScreenPendingIntent, true)
                .setContentIntent(fullScreenPendingIntent)
                .setAutoCancel(true);

            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.notify(ALERT_NOTIFICATION_ID, builder.build());
            }

            // Launch Activity directly to foreground
            startActivity(fullScreenIntent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void stopRideAlert() {
        try {
            if (alarmRingtone != null && alarmRingtone.isPlaying()) {
                alarmRingtone.stop();
                alarmRingtone = null;
            }
            if (vibrator != null) {
                vibrator.cancel();
            }
            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.cancel(ALERT_NOTIFICATION_ID);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
