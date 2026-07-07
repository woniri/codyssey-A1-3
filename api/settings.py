# api/settings.py
import os
import json
from http.server import BaseHTTPRequestHandler
from supabase import create_client, Client

# 서비스 롤 마스터키를 활용해 백엔드 인프라 제어
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # 1. 쿼리 스트링에서 user_id 추출
        from urlparse import urlparse, parse_qs
        query_components = parse_qs(urlparse(self.path).query)
        user_id = query_components.get("user_id", [""])[0]

        if not user_id:
            self.send_response(400)
            self.end_headers()
            return

        # 2. 유저 설정 정보 단건 조회
        response = supabase.table("user_settings").select("*").eq("user_id", user_id).execute()
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        result_data = response.data[0] if response.data else {"notify_channel": "discord", "webhook_url": ""}
        self.wfile.write(json.dumps(result_data).encode('utf-8'))

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        req_body = json.loads(post_data.decode('utf-8'))
        
        user_id = req_body.get("user_id")
        channel = req_body.get("channel", "discord")
        webhook_url = req_body.get("url", "").strip()

        try:
            # 3. 데이터가 존재하면 업데이트, 없으면 신규 인서트 (Upsert)
            response = supabase.table("user_settings").upsert({
                "user_id": user_id,
                "notify_channel": channel,
                "webhook_url": webhook_url,
                "updated_at": "now()"
            }).execute()

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))