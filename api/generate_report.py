# api/generate_report.py
# 선택한 기간/필터에 해당하는 생각들을 모아 AI가 여러 문단짜리 리포트를 생성
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

            thoughts = req_body.get("thoughts", [])  # [{content, created_at}, ...] 프론트에서 이미 필터링해서 전달
            scope_label = req_body.get("scope_label", "선택한 기간")

            if not thoughts:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "report_markdown": f"# {scope_label} 리포트\n\n해당 기간에 저장된 생각이 없어요."
                }).encode('utf-8'))
                return

            thought_lines = "\n".join([f"- ({t.get('created_at', '')[:10]}) {t.get('content', '')}" for t in thoughts])

            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = (
                "너는 개인 생각 정리 도구 '타래'의 리포트 작성 담당이다. "
                f"아래는 사용자가 '{scope_label}' 동안 저장한 생각 목록이다:\n{thought_lines}\n\n"
                "이 생각들을 바탕으로 마크다운 리포트를 작성해라. 다음 섹션을 순서대로 포함해라: "
                "## 요약 (전체적으로 어떤 생각을 많이 했는지 3~4문장), "
                "## 눈에 띄는 패턴 (반복되거나 연결되는 주제가 있다면, 없으면 '특별히 반복되는 패턴은 안 보여요'라고 쓸 것), "
                "## 코멘트 (담백하고 따뜻한 톤으로 2~3문장), "
                "## 발전시켜볼 만한 인사이트 (작게라도 시도해볼 수 있는 것 1~2가지, 실행 가능한 형태로). "
                "지켜야 할 것: "
                "1) 사용자의 심리 상태나 감정을 함부로 진단하거나 단정하지 말 것. "
                "2) 과장되거나 문학적인 수사(카타르시스, 우주, 영혼 등)를 쓰지 말고 쉬운 일상어로 쓸 것. "
                "3) 전체 리포트는 500자 내외로 간결하게 쓸 것. "
                "4) 마크다운 헤더(##)와 문단만 사용하고, 서두 인사말이나 맺음말은 넣지 말 것."
            )

            response = model.generate_content(prompt)
            report_markdown = response.text.strip()

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"report_markdown": report_markdown}).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
