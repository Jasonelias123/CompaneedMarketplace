#!/usr/bin/env python3
import http.server
import socketserver
import os
import urllib.parse

class ConfigurableHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Handle env-config.js specially to inject environment variables
        if self.path == '/env-config.js':
            self.send_response(200)
            self.send_header('Content-type', 'application/javascript')
            self.end_headers()
            
            config_js = f"""// Environment configuration - inject Replit secrets into window object
window.VITE_FIREBASE_API_KEY = "{os.getenv('VITE_FIREBASE_API_KEY', '')}";
window.VITE_FIREBASE_PROJECT_ID = "{os.getenv('VITE_FIREBASE_PROJECT_ID', '')}";
window.VITE_FIREBASE_APP_ID = "{os.getenv('VITE_FIREBASE_APP_ID', '')}";
"""
            self.wfile.write(config_js.encode())
            return
        
        # For all other requests, use the default handler
        return super().do_GET()

PORT = 5000
Handler = ConfigurableHTTPRequestHandler

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"Serving at http://0.0.0.0:{PORT}")
    httpd.serve_forever()