import http.server
import socketserver
import json
import os
import webbrowser

PORT = 8000
SAVE_DIR = "saved_notes"

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/":
            self.path = "/index.html"
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        if self.path == "/save":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                post_data = self.rfile.read(content_length).decode("utf-8")
                print("受信データ: ", post_data)

                data = json.loads(post_data)
                filename = data.get("filename", "").strip()
                content = data.get("content", "")

                if not filename:
                    raise ValueError("ファイル名が空です")

                filename = os.path.basename(filename)
                if not filename.endswith(".md"):
                    filename += ".md"

                os.makedirs(SAVE_DIR, exist_ok=True)
                filepath = os.path.join(SAVE_DIR, filename)

                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)

                print(f"保存成功: {filepath}")
                self.send_response(200)
                self.end_headers()
                self.wfile.write(f"{filename} に保存しました。".encode("utf-8"))

            except Exception as e:
                print("エラー発生: ", e)
                self.send_response(500)
                self.end_headers()
                self.wfile.write(f"エラー: {e}".encode("utf-8"))

def run_server():
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"サーバーが起動しました: http://localhost:{PORT}")
        webbrowser.open(f"http://localhost:{PORT}")  
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()
