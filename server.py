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
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            
            api_key = os.getenv('VITE_FIREBASE_API_KEY', '')
            project_id = os.getenv('VITE_FIREBASE_PROJECT_ID', '')
            app_id = os.getenv('VITE_FIREBASE_APP_ID', '')
            
            config_js = f"""// Environment configuration - inject Replit secrets into window object
window.VITE_FIREBASE_API_KEY = "{api_key}";
window.VITE_FIREBASE_PROJECT_ID = "{project_id}";
window.VITE_FIREBASE_APP_ID = "{app_id}";

console.log('Firebase config loaded:', {{
    apiKey: window.VITE_FIREBASE_API_KEY ? 'present' : 'missing',
    projectId: window.VITE_FIREBASE_PROJECT_ID ? 'present' : 'missing',
    appId: window.VITE_FIREBASE_APP_ID ? 'present' : 'missing'
}});
"""
            self.wfile.write(config_js.encode())
            return
        
        # For all other requests, use the default handler
        return super().do_GET()
    
    def end_headers(self):
        # Add aggressive no-cache headers for HTML and CSS files
        if self.path == '/' or self.path.endswith('.html') or self.path.endswith('.css'):
            import time
            current_time = time.strftime('%a, %d %b %Y %H:%M:%S GMT', time.gmtime())
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, private')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.send_header('Last-Modified', current_time)
            self.send_header('ETag', f'"{int(time.time())}"')
            self.send_header('Vary', 'Cache-Control')
        super().end_headers()

PORT = 5000
Handler = ConfigurableHTTPRequestHandler

try:
    with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
        httpd.allow_reuse_address = True
        print(f"Serving at http://0.0.0.0:{PORT}")
        httpd.serve_forever()
except OSError as e:
    if e.errno == 98:  # Address already in use
        print(f"Port {PORT} is already in use, trying port {PORT+1}")
        PORT = PORT + 1
        with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
            httpd.allow_reuse_address = True
            print(f"Serving at http://0.0.0.0:{PORT}")
            httpd.serve_forever()
    else:
        raise