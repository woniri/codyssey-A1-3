# api/generate_insight.py
import os
import json
from datetime import date
from http.server import BaseHTTPRequestHandler
from supabase import create_client, Client
import google.generativeai as genai

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # 1. 활성화된 모든 유저 목록 추출
            users_res = supabase.table("thoughts").select("user_id").execute()
            user_ids = list(set([t["user_id"] for t in users_res.data])) if users_res.data else []

            model = genai.GenerativeModel("gemini-2.5-flash")

            # 2. 유저별 최근 생각을 기반으로 일일 인사이트 리포트 생성 및 캐싱
            for uid in user_ids:
                # 🔧 실제로 "최근" 것을 가져오도록 정렬 추가 (기존엔 정렬이 없어서 임의의 10개였음)
                thoughts = supabase.table("thoughts").select("content").eq("user_id", uid).order("created_at", desc=True).limit(10).execute()
                if not thoughts.data:
                    continue
                
                context = "\n".join([f"- {t['content']}" for t in thoughts.data])
                
                prompt = (
                    "너는 개인 생각 정리 도구 '타래'의 요약 담당이다. "
                    f"사용자의 최근 생각 파편들:\n{context}\n\n"
                    "위 생각들에서 반복되거나 눈에 띄는 주제·관심사를 한 가지 골라, 담백하고 따뜻한 한 문장으로 짚어줘. "
                    "지켜야 할 것: "
                    "1) 사용자의 심리 상태나 감정을 함부로 진단하거나 단정하지 말 것(예: '번아웃이시군요' 같은 표현 금지). "
                    "2) 과장되거나 문학적인 수사(예: '카타르시스', '인과율', '우주', '영혼' 등)를 쓰지 말고 쉬운 일상어로 쓸 것. "
                    "3) 40자 이내의 한 문장으로만 답할 것."
                )
                
                response = model.generate_content(prompt)
                insight_text = response.text.strip()

                # 오늘 날짜로 데이터 캐싱 (Upsert)
                supabase.table("daily_insights").upsert({
                    "user_id": uid,
                    "insight_text": insight_text,
                    "generated_at": str(date.today())
                }).execute()

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))