package com.riderxo.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.messaging.FirebaseMessaging;

@CapacitorPlugin(name = "DriverKeepAlive")
public class DriverKeepAlivePlugin extends Plugin {

    @PluginMethod
    public void startService(PluginCall call) {
        try {
            Intent serviceIntent = new Intent(getContext(), DriverKeepAliveService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "Driver foreground keep-alive service started");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to start DriverKeepAliveService: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopService(PluginCall call) {
        try {
            Intent serviceIntent = new Intent(getContext(), DriverKeepAliveService.class);
            getContext().stopService(serviceIntent);
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "Driver foreground keep-alive service stopped");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to stop DriverKeepAliveService: " + e.getMessage());
        }
    }

    @PluginMethod
    public void triggerRideAlert(PluginCall call) {
        try {
            String rideId = call.getString("rideId", "");
            String title = call.getString("title", "🚨 NEW RIDE REQUEST!");
            String body = call.getString("body", "Incoming ride request nearby.");

            DriverKeepAliveService service = DriverKeepAliveService.getInstance();
            if (service != null) {
                service.triggerRideAlert(rideId, title, body);
            } else {
                Intent serviceIntent = new Intent(getContext(), DriverKeepAliveService.class);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    getContext().startForegroundService(serviceIntent);
                } else {
                    getContext().startService(serviceIntent);
                }
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to trigger ride alert: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopRideAlert(PluginCall call) {
        try {
            DriverKeepAliveService service = DriverKeepAliveService.getInstance();
            if (service != null) {
                service.stopRideAlert();
            }
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to stop ride alert: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getFcmToken(PluginCall call) {
        try {
            FirebaseMessaging.getInstance().getToken()
                .addOnCompleteListener(new OnCompleteListener<String>() {
                    @Override
                    public void onComplete(Task<String> task) {
                        if (!task.isSuccessful()) {
                            // Fallback to SharedPreferences
                            SharedPreferences prefs = getContext().getSharedPreferences(
                                MyFirebaseMessagingService.PREFS_NAME,
                                Context.MODE_PRIVATE
                            );
                            String cached = prefs.getString(MyFirebaseMessagingService.KEY_FCM_TOKEN, "");
                            JSObject ret = new JSObject();
                            ret.put("token", cached);
                            call.resolve(ret);
                            return;
                        }

                        String token = task.getResult();
                        SharedPreferences prefs = getContext().getSharedPreferences(
                            MyFirebaseMessagingService.PREFS_NAME,
                            Context.MODE_PRIVATE
                        );
                        prefs.edit().putString(MyFirebaseMessagingService.KEY_FCM_TOKEN, token).apply();

                        JSObject ret = new JSObject();
                        ret.put("token", token);
                        call.resolve(ret);
                    }
                });
        } catch (Exception e) {
            call.reject("Failed to retrieve FCM token: " + e.getMessage());
        }
    }
}
