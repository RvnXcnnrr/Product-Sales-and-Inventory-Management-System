# Deployment Guide

This guide covers deploying your POS & Inventory Management System to production.

## Overview

The application consists of:
- **Frontend**: React.js application (deployed to Vercel/Netlify)
- **Backend**: Supabase (managed service)
- **Database**: PostgreSQL (via Supabase)

## Prerequisites

- Completed development setup
- Supabase project configured
- Git repository set up
- Domain name (optional but recommended)

## Frontend Deployment Options

### Option 1: Vercel (Recommended)

#### Step 1: Prepare for Deployment

1. Ensure your project is pushed to GitHub/GitLab/Bitbucket
2. Test production build locally:
```bash
npm run build
npm run preview
```

#### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your repository
4. Configure project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (if monorepo, adjust accordingly)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### Step 3: Environment Variables

Add these in Vercel dashboard under Settings > Environment Variables:

```
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_APP_NAME=POS & Inventory Management
VITE_APP_VERSION=1.0.0
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_MULTI_STORE=true
VITE_ENABLE_ANALYTICS=true
VITE_DEV_MODE=false
```

#### Step 4: Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Test your live application

### Option 2: Netlify

#### Step 1: Prepare Build

1. Create `netlify.toml` in project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

#### Step 2: Deploy to Netlify

1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click "New site from Git"
3. Choose your repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

#### Step 3: Environment Variables

Add in Netlify dashboard under Site settings > Environment variables

#### Step 4: Deploy

1. Click "Deploy site"
2. Wait for deployment
3. Test your application

### Option 3: Self-Hosted (VPS/Dedicated Server)

#### Prerequisites

- Ubuntu/CentOS server
- Node.js 18+ installed
- Nginx installed
- SSL certificate (Let's Encrypt recommended)

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt install nginx -y

# Install PM2 for process management
sudo npm install -g pm2
```

#### Step 2: Deploy Application

```bash
# Clone repository
git clone your-repository-url
cd pos-inventory-system

# Install dependencies
npm install

# Create environment file
cp .env.template .env
# Edit .env with production values

# Build application
npm run build

# Install serve globally
sudo npm install -g serve

# Create PM2 ecosystem file
```

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'pos-system',
    script: 'serve',
    args: '-s dist -l 3000',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

```bash
# Start with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

#### Step 3: Nginx Configuration

Create `/etc/nginx/sites-available/pos-system`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Static files caching
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/pos-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 4: SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Supabase Production Setup

### Step 1: Production Database

1. In Supabase dashboard, go to Settings > Database
2. Review connection pooling settings
3. Set up database backups
4. Configure point-in-time recovery

### Step 2: Authentication Configuration

1. Go to Authentication > Settings
2. Update Site URL to your production domain
3. Add production domain to Redirect URLs
4. Configure email templates
5. Set up SMTP for email sending (optional)

### Step 3: API Configuration

1. Review and test all RLS policies
2. Set up database webhooks if needed
3. Configure rate limiting
4. Review API usage and limits

### Step 4: Security Hardening

1. Rotate API keys if needed
2. Review user roles and permissions
3. Enable audit logging
4. Set up monitoring and alerts

## Performance Optimization

### Frontend Optimizations

1. **Code Splitting**: Already implemented with React.lazy()
2. **Asset Optimization**: 
   ```bash
   # Optimize images before deployment
   npm install -g imagemin-cli
   imagemin src/assets/* --out-dir=src/assets/optimized
   ```

3. **Bundle Analysis**:
   ```bash
   npm install --save-dev @rollup/plugin-analyzer
   npm run build -- --analyze
   ```

### CDN Setup (Optional)

1. Configure Cloudflare or AWS CloudFront
2. Set up static asset caching
3. Enable compression
4. Implement image optimization

### Database Optimizations

1. **Indexing**: Already included in schema
2. **Connection Pooling**: Configure in Supabase
3. **Query Optimization**: Use EXPLAIN ANALYZE for slow queries
4. **Caching**: Implement Redis for frequently accessed data

## Monitoring and Analytics

### Application Monitoring

1. **Error Tracking**: Integrate Sentry
   ```bash
   npm install @sentry/react @sentry/tracing
   ```

2. **Performance Monitoring**: Use Vercel Analytics or Google Analytics

3. **Uptime Monitoring**: Set up UptimeRobot or Pingdom

### Database Monitoring

1. Use Supabase built-in monitoring
2. Set up alerts for high usage
3. Monitor slow queries
4. Track database size growth

## Backup Strategy

### Database Backups

1. **Automatic Backups**: Enabled by default in Supabase
2. **Manual Backups**: 
   ```bash
   # Export via Supabase CLI
   supabase db dump -f backup.sql
   ```

### Code Backups

1. **Git Repository**: Primary backup
2. **Multiple Remotes**: GitHub + GitLab/Bitbucket
3. **Release Tags**: Tag production releases

## Security Checklist

### Pre-Deployment Security

- [ ] Environment variables secured
- [ ] No sensitive data in code
- [ ] RLS policies tested
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection enabled

### Post-Deployment Security

- [ ] Security scan performed
- [ ] Penetration testing completed
- [ ] Access logs reviewed
- [ ] User permissions audited
- [ ] Backup restoration tested
- [ ] Incident response plan ready

## Maintenance

### Regular Tasks

1. **Weekly**:
   - Review error logs
   - Check performance metrics
   - Monitor database usage

2. **Monthly**:
   - Update dependencies
   - Review security logs
   - Backup verification
   - Performance optimization

3. **Quarterly**:
   - Security audit
   - Disaster recovery test
   - User access review
   - Documentation updates

### Updates and Rollbacks

1. **Deployment Pipeline**:
   ```bash
   # Example deployment script
   git pull origin main
   npm install
   npm run build
   pm2 reload pos-system
   ```

2. **Rollback Strategy**:
   ```bash
   # Quick rollback
   git checkout previous-stable-tag
   npm run build
   pm2 reload pos-system
   ```

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version
   - Clear npm cache
   - Verify environment variables

2. **Database Connection Issues**:
   - Check Supabase status
   - Verify connection strings
   - Review RLS policies

3. **Performance Issues**:
   - Check database queries
   - Review bundle size
   - Monitor memory usage

### Helpful Commands

```bash
# Check application logs
pm2 logs pos-system

# Monitor system resources
htop

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Database connection test
psql -h your-db-host -U postgres -d your-database
```

## Support and Maintenance

### Documentation

- Keep deployment documentation updated
- Document configuration changes
- Maintain runbooks for common tasks

### Team Access

- Set up shared credentials securely
- Document access procedures
- Regular access reviews

---

**Congratulations!** Your POS & Inventory Management System is now deployed and ready for production use. Remember to monitor regularly and keep everything updated for optimal security and performance.
