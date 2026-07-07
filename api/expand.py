# api/expand.py
import os
import json
from http.server import BaseHTTPRequestHandler
import google.generativeai as genai

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            req_body = json.loads(post_data.decode('utf-8'))
            idea_text = req_body.get("content", "")

            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = (
                "사용자가 던진 아이디어를 실행 가능한 구체적인 할 일 목록 3가지로 쪼개줘. "
                "반드시 다음 JSON 배열 포맷으로만 응답해: [{\"title\": \"할일1\"}, {\"title\": \"할일2\"}, {\"title\": \"할일3\"}]"
            )
            
            response = model.generate_content(f"{prompt}\n\n아이디어: {idea_text}")
            raw_text = response.text.strip().replace("```json", "").replace("```", "")
            ai_data = json.loads(raw_text)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(ai_data).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))