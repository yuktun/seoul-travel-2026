# 首爾旅遊 2026

手機優先的私人旅遊 PWA。

## 架構
- 無需建置步驟的靜態 HTML、CSS 及 JavaScript，部署於 GitHub Pages 的 `/seoul-travel-2026/` 子路徑。
- Firebase Authentication 提供 Google 登入；Cloud Firestore 儲存私人行程及預訂資料。
- Service Worker、Web App Manifest 及相對路徑提供安裝與基本離線瀏覽支援。

## 安全設計
- 公開網站程式碼不包含旅客姓名、電子機票號碼、預訂編號等私人資料。
- 私人資料透過登入後的「更多 → 匯入私人行程資料」從本機 JSON 寫入 Firestore。
- `seoul-private-data.json` 已被 `.gitignore` 與 `firebase.json` 排除，請勿手動加入 Git。

## Firebase
Project: `seoul-travel-2026`

Firestore Rules 應限制只有已核准 Google 帳戶可存取 `/trips/**`。

## 本機測試
以一般 HTTP server 在此目錄提供檔案，例如 `python -m http.server 8000`。由於使用 ES modules，不建議以 `file://` 開啟。

## 部署
GitHub Pages 直接發布此倉庫的靜態檔案；所有應用程式資源均使用相對路徑，切勿改成只適用於網域根目錄的 `/...` 路徑。更新前端檔案時亦須更新 `service-worker.js` 的快取版本。

第一次登入後，可進入「更多」匯入本機 `seoul-private-data.json`。切勿把該檔案、服務帳戶金鑰、乘客資料或任何預訂編號加入 Git；Firebase 用戶端設定並不取代 Authentication 與 Firestore Rules 的存取控制。

## 外觀模式
- 「更多 → 外觀」提供：自動 / 日間 / 夜間。
- 預設為「自動」，跟隨裝置的淺色 / 深色模式。
- 手動選擇會儲存在本機瀏覽器 `localStorage`，不會寫入 Firestore。
