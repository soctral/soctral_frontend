# Reset Chat Scripts

Delete all Stream Chat channels and clear local storage to start fresh.

## 1. Delete channels from Stream (Node.js)

Requires your Stream **Secret** from [Dashboard → API Keys](https://dashboard.getstream.io).

```bash
STREAM_SECRET=your_secret_here node scripts/delete-all-channels.js
```

Optional: override API key (defaults to the one in chatService.js):

```bash
STREAM_API_KEY=your_key STREAM_SECRET=your_secret node scripts/delete-all-channels.js
```

## 2. Clear chat-related localStorage (Browser)

1. Start your app: `npm run dev`
2. Open: **http://localhost:5173/scripts/clear-chat-storage.html** (same origin as the app)

3. Click **"Clear All Chat Storage"** to remove:

- `deletedChannels`, `deletedChannel_*`
- `selectedChatUser`
- `soctra_cred_*` (per-channel credentials)
- `trade_state`, `activeTransaction`, `pendingTransaction`, `trade_state_completed_*`
- `walletInfo`

---

**Full reset:** Run step 1 (Stream), then step 2 (localStorage), then refresh your app.
