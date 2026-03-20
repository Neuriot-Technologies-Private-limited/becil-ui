# WEBAPP FOR BECIL BROADCAST PROCESSING APPLICATION

React webapp for the BECIL project.

## Install packages:

```
npm i
```

If you get dependency clashes, use:
```
npm i --force
```

## To run:
```
npm run dev
```

Create `.env` from the template (only one variable is required):

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend base URL **including** `/api` (no trailing slash), e.g. `http://localhost:8000/api` |

Used across views and upload/waveform components. Vite only loads names prefixed with `VITE_`.

## Check backend + uploads

With the API running (e.g. `http://localhost:8000`):

```bash
curl -s http://localhost:8000/api/health | python3 -m json.tool
```

- `ok: true` — database OK.
- `uploads_ready: true` — S3 is configured; **upload** from the app should work. If false, fix backend `.env` (see `becil-audio-bkend/README.md`).

## Deploy to AWS Amplify

1. Connect your repo to Amplify and set the app root to `becil-audio` (or where this project lives).
2. **Required:** Add `VITE_API_URL` in Amplify Console → App settings → Environment variables:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-api.com/api` (your real backend URL, no trailing slash)
3. Redeploy. Without this variable, API calls go to `/undefined/...` and fail.
