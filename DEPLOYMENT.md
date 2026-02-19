
# 🚀 Deploying SignToWords AI to the Web

I have built a modern, high-performance web version of your Sign Language AI. You can now deploy this to the internet following these simple steps.

## Option 1: Vercel (Recommended)
Vercel is the easiest way to deploy Vite applications.

1. Create a GitHub repository and push your code:
   ```bash
   git add .
   git commit -m "Add web version"
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
3. Click **"New Project"** and import the `SignToWords` repository.
4. Set the **Root Directory** to `frontend`.
5. Click **Deploy**.

## 🌐 Deploying to Netlify (Recommended)

I've already configured a `netlify.toml` file in the `frontend` directory. You have two ways to deploy:

### Method A: GitHub Continuous Deployment (Easiest)
1.  **Push your code to GitHub**:
    ```bash
    git add .
    git commit -m "Configure Netlify deployment"
    git push origin main
    ```
2.  Login to [Netlify](https://app.netlify.com).
3.  Click **"Add new site"** -> **"Import an existing project"**.
4.  Select **GitHub** and pick the `SignToWords` repository.
5.  Netlify will automatically detect the settings from `netlify.toml`:
    *   **Base directory**: `frontend`
    *   **Build command**: `npm run build`
    *   **Publish directory**: `dist`
6.  Click **Deploy SignToWords**.

### Method B: Netlify CLI (Fastest)
If you have the Netlify CLI installed:
```bash
cd frontend
npm run build
npx netlify-cli deploy --prod --dir=dist
```

## Features in the Web Version:
- **⚡ Zero Server Latency**: Processing happens entirely in your browser using MediaPipe JS.
- **🔊 Web Speech API**: Automatically speaks detected words using your system's native voice.
- **✨ Premium UI**: Responsive design with glassmorphism effects and smooth animations.
- **🔒 Privacy First**: Video frames are processed locally; nothing is sent to a server.

## Local Testing:
If you want to run it locally again:
1. `cd frontend`
2. `npm run dev`
3. Open `http://localhost:5173`
