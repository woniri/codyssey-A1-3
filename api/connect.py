# api/connect.py
import os
import json
from http.server import BaseHTTPRequestHandler
import google.generativeai as genai

# 제미나이 초기화
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        req_body = json.loads(post_data.decode('utf-8'))
        
        text1 = req_body.get("text1", "").strip()
        text2 = req_body.get("text2", "").strip()

        # 실패 처리: 융합할 재료가 부족한 경우
        if not text1 or not text2:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "융합할 두 가닥의 생각이 모두 필요합니다."}).encode('utf-8'))
            return

        try:
            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                generation_config={"response_mime_type": "application/json"}
            )
            
            prompt = (
                "너는 완전히 분리되어 흩어져 있는 두 개의 아이디어를 부딪쳐서 "
                "제3의 독창적이고 매력적인 비즈니스/콘텐츠 기획안을 창조하는 '생각 연금술 엔진'이다.\n\n"
                f"첫 번째 생각: '{text1}'\n"
                f"두 번째 생각: '{text2}'\n\n"
                "이 두 생각의 핵심 맥락을 절묘하게 엮어서 무릎을 탁 칠 만한 '융합 아이디어 타이틀(fusion_title)'과 "
                "그 아이디어가 왜 가치 있고 어떻게 실행 가능한지 설명하는 '상세 제안서(fusion_result)'를 작성해라.\n"
                "출력은 반드시 코드 펜스 없이 순수 JSON 포맷이어야 한다.\n"
                "형식: { \"fusion_title\": \"타이틀\", \"fusion_result\": \"상세 제안 내용\" }"
            )

            response = model.generate_content(prompt)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(response.text.strip().encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"연금술 융합 중 실이 엉켰습니다: {str(e)}"}).encode('utf-8'))