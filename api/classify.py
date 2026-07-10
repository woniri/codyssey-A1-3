# api/classify.py
import os
import json
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # ✨ 픽스: 제미나이 SDK 로드와 설정을 try 안전망 내부로 격리하여 즉사 방지
            import google.generativeai as genai
            
            GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
            if not GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY가 Vercel Production 환경 변수에 설정되지 않았습니다.")
                
            genai.configure(api_key=GEMINI_API_KEY)

            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            req_body = json.loads(post_data.decode('utf-8'))
            thought_text = req_body.get("content", "")

            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = (
                "너는 생각을 정리해주는 조력자야. 다음 문장을 분석해서 연관된 미세 태그들을 "
                "배열 형태로 추출하고, 따뜻한 한 줄 공감 멘트를 작성해줘. "
                "지켜야 할 것: "
                "1) 태그는 2~4개, 각 태그는 1~2단어의 짧은 명사로 쓸 것. "
                "2) 공감 멘트는 과장되거나 문학적인 수사(예: '카타르시스', '우주', '영혼' 등) 없이, "
                "일상적이고 담백한 말투로 20자 내외로 쓸 것. "
                "반드시 다음 JSON 포맷으로만 응답해: {\"tags\": [\"태그1\", \"태그2\"], \"comfort\": \"공감문장\"}"
            )
            
            response = model.generate_content(f"{prompt}\n\n사용자 문장: {thought_text}")
            raw_text = response.text.strip().replace("```json", "").replace("```", "")
            ai_data = json.loads(raw_text)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(ai_data).encode('utf-8'))

        except Exception as e:
            # 이제 글로벌 즉사가 안 일어나므로, 에러가 나도 이 안전망이 JSON으로 예쁘게 응답합니다.
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))