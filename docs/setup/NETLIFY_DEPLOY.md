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
   In Netlify dashboard → Site settings → Environment variables:
   ```
   REACT_APP_SUPABASE_URL=your_actual_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_actual_anon_key
   REACT_APP_ENV=production
   REACT_APP_DEV_MODE=false
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

### Required Variables
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### Optional Variables
```env
REACT_APP_ENV=production
REACT_APP_DEV_MODE=false
REACT_APP_DEBUG_MODE=false
REACT_APP_DEFAULT_CURRENCY=USD
REACT_APP_DEFAULT_TAX_RATE=0.10
```

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
- Check Node.js version (should be 18+)
- Verify all dependencies are installed
- Check environment variables are set

### Runtime Errors
- Check browser console for errors
- Verify Supabase configuration
- Check network requests in dev tools

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

- [ ] Test authentication flow
- [ ] Verify database connection
- [ ] Test offline functionality
- [ ] Check mobile responsiveness
- [ ] Validate PWA installation
- [ ] Test all major features
- [ ] Setup custom domain (optional)
- [ ] Configure analytics (optional)

## Continuous Deployment

Once connected to Git:
- Automatic deploys on push to main branch
- Deploy previews for pull requests
- Branch deploys for feature testing

## Support

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Community](https://community.netlify.com/)
- [Status Page](https://www.netlifystatus.com/)
