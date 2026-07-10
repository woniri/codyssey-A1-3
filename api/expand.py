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
                "너는 4명의 서로 다른 관점을 가진 조언자다. 아래 사용자의 생각 하나를 각자의 관점에서 "
                "2~3문장으로 짧고 구체적으로 분석해라.\n"
                "1) disruptor (새로운 시각): 기존과 다르게 볼 수 있는 참신한 관점을 제안\n"
                "2) architect (구조화 관점): 이 생각을 현실적으로 진행한다면 어떤 구조나 순서가 필요한지\n"
                "3) analyst (본질 분석): 이 생각의 핵심이 무엇인지 논리적으로 짚어줌\n"
                "4) connector (연결 관점): 다른 생각이나 관심사와 어떻게 연결될 수 있는지 제안\n"
                "그리고 마지막으로 next_step에는 사용자가 '지금 당장' 해볼 수 있는 아주 작고 구체적인 "
                "행동 한 가지를 한 문장으로 제안해라 (예: '5분만 검색해보기', '메모 한 줄 더 적어보기').\n"
                "지켜야 할 것: "
                "1) 모든 생각을 억지로 사업/수익화 관점으로 몰아가지 말 것 — 사용자가 실제로 사업 관련 생각을 한 경우에만 architect에서 그렇게 다뤄라. "
                "2) 과장되거나 문학적인 수사(예: '카타르시스', '인과율', '우주', '영혼', '패널 소집' 같은 표현)를 쓰지 말고 쉬운 일상어로 쓸 것. "
                "3) 각 항목은 2~3문장을 넘기지 말 것.\n"
                "반드시 다음 JSON 포맷으로만 응답해: "
                "{\"disruptor\": \"...\", \"architect\": \"...\", \"analyst\": \"...\", \"connector\": \"...\", \"next_step\": \"...\"}"
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
