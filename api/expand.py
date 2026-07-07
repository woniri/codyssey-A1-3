# api/expand.py
import os
import json
from http.server import BaseHTTPRequestHandler
import google.generativeai as genai

# 제미나이 키 로드
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        req_body = json.loads(post_data.decode('utf-8'))
        
        thought_content = req_body.get("content", "").strip()

        # 실패 처리: 빈 값 차단
        if not thought_content:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "확장할 생각의 맥락이 부족합니다."}).encode('utf-8'))
            return

        try:
            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                generation_config={"response_mime_type": "application/json"}
            )
            
            prompt = (
                "너는 사용자의 가벼운 아이디어를 실질적인 실행 계획으로 직조해 주는 '타래'의 프로젝트 매니저 AI다. "
                f"사용자의 생각 파편: '{thought_content}' "
                "이 내용을 바탕으로 멋진 프로젝트 제목(title)과, 바로 실행 가능한 구체적인 할 일(tasks) 3~4개를 도출해라. "
                "할 일의 초기 상태는 무조건 'strands'(가닥)로 설정해야 한다. "
                "또한 이 프로젝트의 장기적인 방향성을 한 줄 요약한 로드맵(roadmap)도 포함해라. "
                "출력은 markdown 코드 블록 없이 순수 JSON 포맷으로만 반환해야 한다. "
                "JSON 형식 예시:\n"
                "{\n"
                "  \"title\": \"제주 워케이션 북카페 기획\",\n"
                "  \"roadmap\": \"한 달 이내에 제주도 셰어하우스 연계 팝업 북카페 최소 기능 모델(MVP) 오픈\",\n"
                "  \"tasks\": [\n"
                "    { \"id\": \"t1\", \"text\": \"제주도 후보지 공간 조사 및 임대 비용 파악\", \"status\": \"strands\" },\n"
                "    { \"id\": \"t2\", \"text\": \"큐레이션할 메인 도서 목록 및 인테리어 무드보드 작성\", \"status\": \"strands\" }\n"
                "  ]\n"
                "}"
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
            self.wfile.write(json.dumps({"error": f"로드맵 확장 중 실이 엉켰습니다: {str(e)}"}).encode('utf-8'))