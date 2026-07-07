# api/connect.py
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
            text_a = req_body.get("text_a", "")
            text_b = req_body.get("text_b", "")

            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = (
                "전혀 다른 두 개의 생각 파편을 융합하여 완전히 새로운 제3의 창의적인 기획안을 도출해줘. "
                "반드시 다음 JSON 포맷으로만 응답해: {\"merged_title\": \"기획안 제목\", \"merged_content\": \"상세 내용 설명\"}"
            )
            
            response = model.generate_content(f"{prompt}\n\n생각 A: {text_a}\n생각 B: {text_b}")
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