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
                "서로 다른 두 개의 생각 파편 사이에서 사용자가 미처 못 봤을 연결점이나 새로운 관점을 찾아줘. "
                "두 생각이 실제로 사업/기획으로 이어질 만한 내용이면 새로운 기획 아이디어로 제안하고, "
                "그렇지 않다면 억지로 사업화하지 말고 그냥 '이런 식으로 연결해볼 수 있겠다'는 관점이나 질문을 제안해도 괜찮아. "
                "그리고 마지막에는 지금 당장 해볼 수 있는 아주 작은 행동 한 가지도 한 문장으로 제안해줘.\n"
                "지켜야 할 것: "
                "1) 과장되거나 문학적인 수사(예: '카타르시스', '인과율', '우주', '영혼', '연금술', '패널' 같은 표현)를 쓰지 말고 쉬운 일상어로 쓸 것. "
                "2) merged_content는 4~6문장 이내로 간결하게 쓸 것.\n"
                "반드시 다음 JSON 포맷으로만 응답해: "
                "{\"merged_title\": \"짧은 제목\", \"merged_content\": \"연결점 설명\", \"next_step\": \"지금 해볼 수 있는 작은 행동\"}"
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