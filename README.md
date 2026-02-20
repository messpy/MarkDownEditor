# Markdown Editor (static)

ブラウザだけで動く Markdown エディタ（HTML/JS/CSS分離版）。
- Open: ローカルの .md を読み込み（File API）
- Save / Save As: ダウンロードとして保存（サーバ不要、GitHub Pages対応）
- Autosave: localStorage に自動保存
- Preview: marked + DOMPurify で安全にレンダリング

## Run
- そのまま index.html を開く
- もしくは簡易サーバ

```bash
python3 -m http.server 8080
```

http://localhost:8080/ を開く
