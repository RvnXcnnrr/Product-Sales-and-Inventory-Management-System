# Netlify Deployment Guide

## Quick Deploy to Netlify

### Option 1: Deploy from Git Repository

1. **Push your code to GitHub/GitLab**
   ```bash
   git init
   git add .
   git commit -m "Initial POS system commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/pos-system.git
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git provider and select your repository

3. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

4. **Add Environment Variables**
   In Netlify dashboard → Site settings → Environment variables ("Add variable"):
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   VITE_APP_NAME=POS & Inventory Management
   VITE_DEV_MODE=false
   # Optional:
   # VITE_DEBUG_MODE=false
   # VITE_SESSION_TIMEOUT=3600000
   # VITE_DEFAULT_CURRENCY=PHP
   ```

### Option 2: Manual Deploy

1. **Build the project locally**
   ```bash
   npm run build
   ```

2. **Deploy via Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod --dir=dist
   ```

3. **Or drag & drop**
   - Build locally: `npm run build`
   - Go to [netlify.com/drop](https://netlify.com/drop)
   - Drag the `dist` folder to deploy

## Environment Variables Setup

The app is built with Vite; ONLY variables prefixed with `VITE_` are exposed to the client.

### Required
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Recommended / Optional
```env
VITE_APP_NAME="POS & Inventory Management"
VITE_DEV_MODE=false
VITE_DEBUG_MODE=false
VITE_DEFAULT_CURRENCY=PHP
VITE_SESSION_TIMEOUT=3600000
```
> Never commit actual keys to the repo; set them in Netlify UI.

## Custom Domain Setup

1. **Add custom domain in Netlify**
   - Site settings → Domain management → Add custom domain
   - Update your DNS records as instructed

2. **Enable HTTPS**
   - Netlify automatically provides SSL certificates
   - Force HTTPS redirect is enabled by default

## Performance Optimization

The `netlify.toml` file includes:
- ✅ Static asset caching
- ✅ Gzip compression
- ✅ Security headers
- ✅ SPA redirects
- ✅ PWA support

## Troubleshooting

### Build Errors
- Ensure Node.js version in Netlify is 18 (netlify.toml already sets this)
- Verify dependencies installed / lockfile present
- Confirm required `VITE_` env vars defined

### Runtime Errors
- Open browser console & Network tab
- Verify `VITE_SUPABASE_URL` matches your project ref
- Check that auth requests (auth/v1/token, rest/v1) return 200/2xx

### PWA Issues
- Ensure manifest.json is accessible
- Check service worker registration
- Verify icon files exist

## Monitoring

- **Analytics**: Enable in Netlify dashboard
- **Forms**: Built-in form handling available
- **Functions**: Serverless functions supported
- **Error tracking**: Integrate with Sentry or similar

## Post-Deployment Checklist

- [ ] Auth: register → email verify (if enabled) → login
- [ ] Initial setup modals (store + profile) appear for new user
- [ ] Products CRUD works (network calls succeed)
- [ ] Inventory adjustments reflect correctly
- [ ] Sales flow completes (transaction + items)
- [ ] Reports load without 401/403
- [ ] Responsive layout on mobile
- [ ] PWA manifest & service worker (if ENABLE_PWA later enabled)
- [ ] Custom domain & HTTPS (optional)
- [ ] Analytics / monitoring (optional)

## Continuous Deployment

Once connected to Git:
- Automatic deploys on push to main branch
- Deploy previews for pull requests
- Branch deploys for feature testing

## Support

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Community](https://community.netlify.com/)
- [Status Page](https://www.netlifystatus.com/)
