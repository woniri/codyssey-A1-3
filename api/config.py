# api/config.py
import os
import json
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # 1. 안전하게 환경 변수 읽어오기
        config = {
            "SUPABASE_URL": os.environ.get("SUPABASE_URL", ""),
            "SUPABASE_ANON_KEY": os.environ.get("SUPABASE_ANON_KEY", "")
        }

        # 2. JSON 형태로 응답 반환
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(config).encode('utf-8'))