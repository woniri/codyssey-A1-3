# api/classify.py
import os
import json
from http.server import BaseHTTPRequestHandler
from openai import OpenAI

# OpenAI 클라이언트 초기화 (Vercel 환경 변수에서 키 추출)
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # 1. 포스트 데이터 길이 파악 및 파싱
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        req_body = json.loads(post_data.decode('utf-8'))
        
        user_thought = req_body.get("thought", "").strip()

        # 실패 처리 ②: 서버 측 빈 입력값 검증
        if not user_thought:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "생각 내용이 비어 있습니다."}).encode('utf-8'))
            return

        try:
            # 2. OpenAI API 호출 (구조화된 JSON 출력을 프롬프트로 강제)
            response = client.chat.completions.create(
                model="gpt-4o-mini", # 가성비와 속도가 우수한 모델 채택
                response_format={ "type": "json_object" },
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "너는 사용자가 낙서하듯 던진 날것의 생각 파편을 연결하는 조력자 시스템 '타래'의 AI 엔진이다. "
                            "사용자의 입력문에서 핵심 키워드 3~4개를 유연한 미세 태그(Micro-tags)로 추출하고, "
                            "그 생각의 감정이나 의도를 읽어 따뜻하게 말을 건네는 마이크로 프롬프트(공감과 화두)를 작성해라. "
                            "만약 너무 짧거나 모호한 단어라면 '#미완성' 태그를 포함하고 나중에 다른 생각과 엮어보라는 메시지를 줘라. "
                            "출력은 반드시 markdown 코드 펜스 없이 순수 JSON 포맷으로만 반환해야 한다. "
                            "JSON 스키마: { 'tags': ['태그1', '태그2'], 'prompt': 'AI가 건네는 공감 및 질문 메시지' }"
                        )
                    },
                    {"role": "user", "content": user_thought}
                ],
                temperature=0.7,
                timeout=10 # 실패 처리 ③: 지연/타임아웃 한계 설정
            )

            result_content = response.choices[0].message.content

            # 3. 정상 응답 반환
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(result_content.encode('utf-8'))

        except Exception as e:
            # 실패 처리 ④: API 에러 혹은 타임아웃 발생 시 500 에러 핸들링
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            error_response = {"error": "AI가 생각을 잣는 도중 실이 엉켰습니다. 잠시 후 다시 시도해 주세요."}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))