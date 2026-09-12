package com.bykneo.app;

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DriverKeepAlivePlugin.class);
        super.onCreate(savedInstanceState);
        configureScreenWakeFlags();
        optimizeWebViewPerformance();
    }

    @Override
    public void onResume() {
        super.onResume();
        configureScreenWakeFlags();
        optimizeWebViewPerformance();
    }

    private void configureScreenWakeFlags() {
        // Enable hardware accelerated rendering
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        }
    }

    private void optimizeWebViewPerformance() {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            
            // Set dark background color immediately to avoid white screen flashes
            webView.setBackgroundColor(0xFF030712);
            
            WebSettings settings = webView.getSettings();
            // Lock text zoom to exactly 100% so APK font size matches PWA / Chrome 1:1
            settings.setTextZoom(100);
            
            // High performance WebView settings
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
        }
    }
}

