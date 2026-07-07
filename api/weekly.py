# api/weekly.py
import os
import json
import requests
from http.server import BaseHTTPRequestHandler
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        req_body = json.loads(post_data.decode('utf-8'))
        
        user_id = req_body.get("user_id")

        if not user_id:
            self.send_response(400)
            self.end_headers()
            return

        try:
            # 1. 알림 주소 바인딩
            settings_res = supabase.table("user_settings").select("*").eq("user_id", user_id).execute()
            if not settings_res.data or not settings_res.data[0].get("webhook_url"):
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "설정된 웹훅 URL이 없습니다."}).encode('utf-8'))
                return

            settings = settings_res.data[0]
            webhook_url = settings["webhook_url"]
            channel_type = settings["notify_channel"]

            # 2. 통계 데이터 데이터베이스 집계 연산 (순수 SQL 가공 최소화)
            thoughts_res = supabase.table("thoughts").select("id").eq("user_id", user_id).execute()
            projects_res = supabase.table("projects").select("id", "status").eq("user_id", user_id).execute()

            total_thoughts = len(thoughts_res.data) if thoughts_res.data else 0
            total_projects = len(projects_res.data) if projects_res.data else 0
            
            # 3. 타래의 톤앤매너를 입힌 인간적 감성의 텍스트 리포트 가공
            report_message = (
                f"🧵 **이번 주 머릿속 타래 리포트가 배달되었습니다**\n\n"
                f"• 이번 주에는 머릿속에서 총 **{total_thoughts}가닥**의 자유로운 생각이 흘러나왔습니다.\n"
                f"• 그 중 **{total_projects}개**의 생각이 단단한 실행 계획의 실타래로 엮였습니다.\n"
                f"• 잠시 숨을 고르며 방치된 가닥이 있다면 주말에 가볍게 베틀 위에서 털어보는 건 어떨까요?\n\n"
                f"*💡 '잊힌 생각을 연결하는 창의적 파트너' - 타래 배달부 올림*"
            )

            # 4. 페이로드 전송 포맷팅 분기 처리
            if channel_type == "discord":
                payload = {"content": report_message}
            else: # slack 포맷팅
                payload = {"text": report_message}

            # 5. 실제 웹훅 발송 및 통신 응답 핸들링
            res = requests.post(webhook_url, json=payload, timeout=5)
            
            if res.status_code >= 400:
                raise Exception("외부 메신저 서버 응답 거부(4xx/5xx)")

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"발송 실패: {str(e)}"}).encode('utf-8'))