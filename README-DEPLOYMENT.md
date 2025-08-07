# Deployment Guide for EmailCraft AI on Netlify

## Prerequisites
1. A Netlify account
2. Your backend API deployed and accessible
3. Domain name (optional)

## Deployment Steps

### 1. Prepare Environment Variables
Copy `.env.example` to `.env` and update:
```bash
VITE_API_URL=https://your-backend-api.com/api
```

### 2. Update Backend URL in netlify.toml
Edit `netlify.toml` and update the API redirect:
```toml
[[redirects]]
  from = "/api/*"
  to = "https://your-actual-backend-url.com/api/:splat"
  status = 200
  force = false
```

### 3. Deploy to Netlify

#### Option A: Git-based Deployment (Recommended)
1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Netlify](https://netlify.com) and connect your repository
3. Set build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

#### Option B: Manual Deployment
1. Run `npm run build` locally
2. Drag and drop the `dist` folder to Netlify

### 4. Configure Environment Variables in Netlify
In your Netlify site settings → Environment variables, add:
- `VITE_API_URL`: Your backend API URL
- Any other environment variables from `.env.example`

### 5. Set up Custom Domain (Optional)
1. Go to Site settings → Domain management
2. Add your custom domain
3. Configure DNS records as instructed

## Build Configuration
The project is configured with:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 18
- **Redirects**: All routes redirect to `index.html` for SPA functionality

## Security Headers
The deployment includes security headers:
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

## Performance Optimization
- Static assets are cached for 1 year
- Gzip compression is enabled
- Bundle size is optimized for production

## Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Verify all dependencies are listed in `package.json`
- Check for TypeScript errors with `npm run lint`

### API Calls Fail
- Verify `VITE_API_URL` environment variable
- Check CORS configuration on your backend
- Update API redirect in `netlify.toml`

### Routing Issues
- Ensure `netlify.toml` has the SPA redirect configuration
- Check that all routes are properly configured in React Router

## Post-Deployment Checklist
- [ ] Site loads without errors
- [ ] All routes work correctly
- [ ] API calls to backend succeed
- [ ] Authentication flow works
- [ ] Template generation functionality works
- [ ] Mobile responsiveness is intact
- [ ] Performance is acceptable

## Monitoring
Consider adding:
- Error tracking (Sentry, Bugsnag)
- Analytics (Google Analytics, Plausible)
- Performance monitoring (Web Vitals)
- Uptime monitoring

## Scaling Considerations
- Enable Netlify's CDN and edge functions if needed
- Consider implementing service workers for offline functionality
- Monitor bundle size and optimize for performance
- Set up proper CI/CD pipeline with automated testing