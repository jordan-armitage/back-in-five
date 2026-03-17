# Store Update PWA

A lightweight single-page Progressive Web App that lets a shop owner post an announcement banner that appears at the top of their website. The editor saves on this device and generates a QR notice link for customers.

## Features
- Mobile-first editor to write and publish announcements (saved on this device)
- Live preview of the banner on top of a real website iframe
- Clickable banner with underlined text + modal overlay
- Banner color picker and expiry timer
- QR code + printable storefront notice sign (editable text)
- Widget script (`/widget.js`) you can embed on any site
- PWA support with manifest + service worker

## Tech Stack
- Next.js (App Router, static export)
- React
- TailwindCSS

## Local Development
1. Install dependencies
   ```bash
   npm install
   ```
2. Run the app
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000`

## GitHub Pages Deployment (this repo)
This project is configured for GitHub Pages at:
`https://jordan-armitage.github.io/back-in-five/`

### Option A: Publish with GitHub Actions (recommended)
This repo includes `.github/workflows/deploy.yml`.

1. Upload the full repo to GitHub.
2. Go to **Settings > Pages**.
3. Under **Source**, choose **GitHub Actions**.
4. Push any change (or click **Run workflow** in Actions).
5. After the workflow finishes, the site will be live.

### Option B: Publish by Uploading the Static Build
1. On your machine, run:
   ```bash
   npm install
   npm run build
   ```
   This creates the static site in `out/`.

2. Upload the *contents* of `out/` to the repo root on GitHub.
3. In **Settings > Pages**, choose:
   - Source: **Deploy from a branch**
   - Branch: `main`
   - Folder: `/ (root)`
4. Wait for Pages to publish.

## Widget Embed
Copy the snippet from the app. It includes your latest message, color, mode, and expiry.

Example:
```html
<script src="https://jordan-armitage.github.io/back-in-five/widget.js"
  data-message="We are closed for a private event today."
  data-mode="scroll"
  data-color="#0f766e"
  data-expires=""
  async></script>
```

## Notice Link (QR Code)
The QR code points back to the same page with `?notice=1` and query params.
This keeps the app single-page for GitHub Pages.

Note: when you publish a new announcement, the QR code changes. Reprint the sign so customers see the latest message.

## Storage Notes
Announcements are saved in the browser's `localStorage` on the device where you publish.
To update from multiple devices, add a hosted API later.

## Customizing the repo name
If you change the GitHub repo name, update the `repo` value in `next.config.js`.
