# api/config.py
import os
import json
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        # Vercel 환경 변수 시스템에서 값을 읽어옵니다.
        config_data = {
            "SUPABASE_URL": os.environ.get("SUPABASE_URL", ""),
            "SUPABASE_ANON_KEY": os.environ.get("SUPABASE_ANON_KEY", "")
        }
        
        self.wfile.write(json.dumps(config_data).encode('utf-8'))