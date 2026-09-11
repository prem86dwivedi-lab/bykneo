package com.bykneo.app;

import android.content.Intent;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

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
                // If service instance is null, start service first then trigger
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
}
