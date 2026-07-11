# api/drive_upload.py
# 개인 관리자 계정 전용: 본인 구글 계정(OAuth Refresh Token)으로 지정된 드라이브 폴더에 마크다운 파일을 업로드
# (서비스 계정은 개인 무료 구글 계정에 저장공간이 없어 파일 생성이 막히므로, 본인 계정 인증 방식을 사용)
import os
import json
import requests
from http.server import BaseHTTPRequestHandler

ADMIN_USER_ID = os.environ.get("ADMIN_USER_ID", "")
GOOGLE_DRIVE_FOLDER_ID = os.environ.get("GOOGLE_DRIVE_FOLDER_ID", "")
GOOGLE_OAUTH_CLIENT_ID = os.environ.get("GOOGLE_OAUTH_CLIENT_ID", "")
GOOGLE_OAUTH_CLIENT_SECRET = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET", "")
GOOGLE_OAUTH_REFRESH_TOKEN = os.environ.get("GOOGLE_OAUTH_REFRESH_TOKEN", "")


def get_drive_access_token():
    # 리프레시 토큰으로 매번 새 액세스 토큰을 발급받음 (액세스 토큰은 보통 1시간만 유효해서 매 요청마다 갱신)
    res = requests.post("https://oauth2.googleapis.com/token", data={
        "client_id": GOOGLE_OAUTH_CLIENT_ID,
        "client_secret": GOOGLE_OAUTH_CLIENT_SECRET,
        "refresh_token": GOOGLE_OAUTH_REFRESH_TOKEN,
        "grant_type": "refresh_token"
    }, timeout=10)

    if res.status_code >= 400:
        raise Exception(f"토큰 갱신 실패 (상태코드 {res.status_code}): {res.text[:200]}")

    return res.json()["access_token"]


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

            if not GOOGLE_OAUTH_REFRESH_TOKEN or not GOOGLE_DRIVE_FOLDER_ID:
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
