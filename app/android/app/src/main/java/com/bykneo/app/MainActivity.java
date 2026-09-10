package com.bykneo.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureWebViewTextZoom();
    }

    @Override
    public void onResume() {
        super.onResume();
        configureWebViewTextZoom();
    }

    private void configureWebViewTextZoom() {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            WebSettings settings = webView.getSettings();
            // Lock text zoom to exactly 100% so APK font size matches PWA / Chrome 1:1
            settings.setTextZoom(100);
        }
    }
}

