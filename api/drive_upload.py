# api/drive_upload.py
# 개인 관리자 계정 전용: 구글 서비스 계정으로 지정된 드라이브 폴더에 마크다운 파일을 업로드
# (드라이브 폴더가 옵시디언 볼트와 동기화되어 있다면, 이 파일이 곧 옵시디언에도 나타남)
import os
import json
import requests
from http.server import BaseHTTPRequestHandler
from google.oauth2 import service_account
import google.auth.transport.requests

ADMIN_USER_ID = os.environ.get("ADMIN_USER_ID", "")
GOOGLE_DRIVE_FOLDER_ID = os.environ.get("GOOGLE_DRIVE_FOLDER_ID", "")
GOOGLE_SERVICE_ACCOUNT_JSON = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "")

SCOPES = ["https://www.googleapis.com/auth/drive.file"]

def get_drive_access_token():
    info = json.loads(GOOGLE_SERVICE_ACCOUNT_JSON)
    credentials = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    request = google.auth.transport.requests.Request()
    credentials.refresh(request)
    return credentials.token

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            req_body = json.loads(post_data.decode('utf-8'))

            requester_uid = req_body.get("user_id", "")
            filename = req_body.get("filename", "tarae-report.md")
            content = req_body.get("content", "")

            # 🔒 개인 관리자 계정만 사용 가능 (다른 일반 회원에게는 노출되지 않는 기능)
            if not ADMIN_USER_ID or requester_uid != ADMIN_USER_ID:
                self.send_response(403)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "이 기능은 관리자 계정 전용입니다."}).encode('utf-8'))
                return

            if not GOOGLE_SERVICE_ACCOUNT_JSON or not GOOGLE_DRIVE_FOLDER_ID:
                raise Exception("구글 드라이브 연동 환경 변수가 설정되지 않았습니다.")

            access_token = get_drive_access_token()

            metadata = {
                "name": filename,
                "parents": [GOOGLE_DRIVE_FOLDER_ID],
                "mimeType": "text/markdown"
            }

            boundary = "tarae_upload_boundary"
            body = (
                f"--{boundary}\r\n"
                f"Content-Type: application/json; charset=UTF-8\r\n\r\n"
                f"{json.dumps(metadata)}\r\n"
                f"--{boundary}\r\n"
                f"Content-Type: text/markdown; charset=UTF-8\r\n\r\n"
                f"{content}\r\n"
                f"--{boundary}--"
            )

            res = requests.post(
                "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": f"multipart/related; boundary={boundary}"
                },
                data=body.encode('utf-8'),
                timeout=15
            )

            if res.status_code >= 400:
                raise Exception(f"드라이브 업로드 실패 (상태코드 {res.status_code}): {res.text[:200]}")

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "file": res.json()}).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
