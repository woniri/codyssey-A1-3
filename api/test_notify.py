# api/test_notify.py
# 브라우저에서 디스코드/슬랙 웹훅으로 직접 fetch하면 CORS 정책에 막혀 "Load failed"가 나는 경우가 많아,
# 서버(Python)를 한 단계 거쳐서 발송하도록 하는 프록시 엔드포인트입니다.
import json
import requests
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            req_body = json.loads(post_data.decode('utf-8'))

            channel = req_body.get("channel")       # "discord" | "slack"
            webhook_url = req_body.get("webhook_url", "")
            message = req_body.get("message", "🧵 타래 테스트 발송입니다.")

            if channel not in ("discord", "slack"):
                raise ValueError("지원하지 않는 채널입니다.")
            if not webhook_url:
                raise ValueError("웹훅 주소가 비어있습니다.")

            payload = {"content": message} if channel == "discord" else {"text": message}
            res = requests.post(webhook_url, json=payload, timeout=8)

            if res.status_code >= 400:
                raise Exception(f"외부 서버 응답 거부 (상태코드 {res.status_code})")

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
