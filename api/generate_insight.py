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
                thoughts = supabase.table("thoughts").select("content").eq("user_id", uid).limit(10).execute()
                if not thoughts.data:
                    continue
                
                context = "\n".join([f"- {t['content']}" for t in thoughts.data])
                
                prompt = (
                    "너는 개인 생각 오케스트레이터 '타래'의 메인 분석가다. "
                    f"사용자의 최근 생각 파편들:\n{context}\n\n"
                    "위 생각을 종합적으로 분석하여 사용자가 현재 어떤 맥락이나 주제에 몰두해 있는지, "
                    "혹은 어떤 심리 상태(번아웃, 열망 등)인지 간결하고 따뜻하게 한 줄로 요약해라."
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