# 首爾旅遊 2026 — v1

手機優先的私人旅遊 PWA。

## 安全設計
- 公開網站程式碼不包含旅客姓名、電子機票號碼、預訂編號等私人資料。
- 私人資料透過登入後的「更多 → 匯入私人行程資料」從本機 JSON 寫入 Firestore。
- `seoul-private-data.json` 已被 `.gitignore` 與 `firebase.json` 排除，請勿手動加入 Git。

## Firebase
Project: `seoul-travel-2026`

Firestore Rules 應限制只有已核准 Google 帳戶可存取 `/trips/**`。

## 本機測試
Firebase Hosting / 一般 HTTP server 均可。由於使用 ES modules，不建議直接雙擊 `index.html` 以 `file://` 開啟。

## 部署
安裝 Firebase CLI 後：

```bash
firebase login
firebase deploy --only hosting
```

第一次登入後，進入「更多」，匯入本機 `seoul-private-data.json`。
