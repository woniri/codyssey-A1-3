# api/classify.py
import os
import json
from http.server import BaseHTTPRequestHandler
import google.generativeai as genai

# Vercel 또는 로컬 .env에서 제미나이 키 추출 및 초기화
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        req_body = json.loads(post_data.decode('utf-8'))
        
        user_thought = req_body.get("thought", "").strip()

        # 실패 처리: 빈 입력값 검증
        if not user_thought:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "생각 내용이 비어 있습니다."}).encode('utf-8'))
            return

        try:
            # 제미나이 모델 로드 (가장 빠르고 가벼운 flash 모델 사용)
            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                generation_config={"response_mime_type": "application/json"} # 순수 JSON 반환 강제
            )
            
            prompt = (
                "너는 사용자가 낙서하듯 던진 날것의 생각 파편을 연결하는 조력자 시스템 '타래'의 AI 엔진이다. "
                f"사용자의 입력문: '{user_thought}' "
                "이 입력문에서 핵심 키워드 3~4개를 유연한 미세 태그(Micro-tags)로 추출하고, "
                "그 생각의 감정이나 의도를 읽어 따뜻하게 말을 건네는 마이크로 프롬프트(공감과 화두)를 작성해라. "
                "만약 너무 짧거나 모호한 단어라면 '#미완성' 태그를 포함하고 나중에 다른 생각과 엮어보라는 메시지를 줘라. "
                "출력은 반드시 markdown 코드 펜스(```json) 없이 순수 JSON 포맷으로만 반환해야 한다. "
                "JSON 형식 예시: { \"tags\": [\"태그1\", \"태그2\"], \"prompt\": \"AI가 건네는 메시지\" }"
            )

            response = model.generate_content(prompt)
            result_content = response.text.strip()

            # 정상 응답 반환
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(result_content.encode('utf-8'))

        except Exception as e:
            # 실패 처리: 에러 발생 시 500 에러 핸들링
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            error_response = {"error": f"AI가 생각을 잣는 도중 실이 엉켰습니다: {str(e)}"}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))