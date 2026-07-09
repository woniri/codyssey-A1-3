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
                "너는 4명의 서로 다른 전문가 패널이다. 아래 사용자의 생각 하나를 각자의 관점에서 "
                "2~3문장으로 짧고 구체적으로 분석해라.\n"
                "1) disruptor (창의적 파괴자): 기존 고정관념을 깨는 대담하고 파격적인 시각\n"
                "2) architect (비즈니스 아키텍트): 사업/수익화 구조 관점\n"
                "3) analyst (제1원리 분석가): 본질을 파고드는 논리적 분해\n"
                "4) connector (실타래 연결자): 다른 생각이나 프로젝트와의 연결 가능성 제안\n"
                "반드시 다음 JSON 포맷으로만 응답해: "
                "{\"disruptor\": \"...\", \"architect\": \"...\", \"analyst\": \"...\", \"connector\": \"...\"}"
            )

            response = model.generate_content(f"{prompt}\n\n사용자의 생각: {idea_text}")
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
