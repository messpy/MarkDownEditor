#サーバーを立てないと一部の機能が使えない為ローカルサーバーを立てる為のスクリプト。
#ファイル上書き保存もブラウザから出来ない為そちらも実装する

import http.server
import socketserver
import json
import os

PORT = 8000
SAVE_DIR = "saved_notes"

# 保存フォルダを作成（なければ）
if not os.path.exists(SAVE_DIR):
    try:
        os.makedirs(SAVE_DIR)
        print(f"📁 フォルダ '{SAVE_DIR}' を作成しました。")
    except Exception as e:
        print(f"❌ フォルダ作成失敗: {e}")

class MarkdownServer(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/save":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                if content_length == 0:
                    raise ValueError("受信データが空です")

                post_data = self.rfile.read(content_length).decode("utf-8")
                print(f"📥 受信データの長さ: {content_length}")
                print(f"📥 受信データの中身: {post_data}")

                try:
                    data = json.loads(post_data)
                except json.JSONDecodeError as json_error:
                    print(f"❌ JSON パースエラー: {json_error}")
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(f"❌ JSON パースエラー: {json_error}".encode("utf-8"))
                    return

                # ファイル名のバリデーション
                filename = data.get("filename", "").strip()
                content = data.get("content", "")

                if not filename:
                    raise ValueError("❌ ファイル名が空です")

                filename = os.path.basename(filename)  # ディレクトリ名を除外
                if not filename.endswith(".md"):
                    filename += ".md"

                filepath = os.path.join(SAVE_DIR, filename)
                print(f"📂 保存先: {filepath}")

                # 書き込み時のエラーハンドリング
                try:
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(content)
                    self.send_response(200)
                    self.end_headers()
                    self.wfile.write(f"✅ {filename} に保存しました！".encode("utf-8"))
                    print(f"✅ {filename} に保存成功！")
                except OSError as write_error:
                    print(f"❌ 書き込みエラー: {write_error}")
                    self.send_response(500)
                    self.end_headers()
                    self.wfile.write(f"❌ 書き込みエラー: {write_error}".encode("utf-8"))

            except ValueError as value_error:
                print(f"❌ 値エラー: {value_error}")
                self.send_response(400)
                self.end_headers()
                self.wfile.write(f"❌ 値エラー: {value_error}".encode("utf-8"))
            except Exception as e:
                print(f"❌ その他のエラー: {e}")
                self.send_response(500)
                self.end_headers()
                self.wfile.write(f"❌ その他のエラー: {e}".encode("utf-8"))

# サーバー起動
try:
    with socketserver.TCPServer(("", PORT), MarkdownServer) as httpd:
        print(f"✅ サーバーが起動しました: http://localhost:{PORT}")
except Exception as e:
    print(f"❌ サーバー起動エラー: {e}")
