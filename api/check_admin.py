# api/check_admin.py
# 프론트에 관리자 UUID 자체를 노출하지 않고, "이 사용자가 관리자인지"만 true/false로 알려줌
import os
import json
from http.server import BaseHTTPRequestHandler

ADMIN_USER_ID = os.environ.get("ADMIN_USER_ID", "")

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            req_body = json.loads(post_data.decode('utf-8'))
            requester_uid = req_body.get("user_id", "")

            is_admin = bool(ADMIN_USER_ID) and requester_uid == ADMIN_USER_ID

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"is_admin": is_admin}).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e), "is_admin": False}).encode('utf-8'))
