# Deployment Guide - Pokemon Card Marketplace

This guide will help you deploy the Pokemon Card Marketplace to Vercel with a MongoDB Atlas database.

## Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account** - For repository hosting
3. **MongoDB Atlas Account** - Sign up at [mongodb.com/atlas](https://mongodb.com/atlas)

## Step 1: Set Up MongoDB Atlas

1. **Create a Cluster**
   - Log in to MongoDB Atlas
   - Create a new project
   - Build a new cluster (choose the free M0 tier)
   - Select a cloud provider and region

2. **Configure Database Access**
   - Go to Database Access
   - Add a new database user
   - Choose "Password" authentication
   - Create a username and strong password
   - Grant "Atlas admin" privileges (or custom read/write to your database)

3. **Configure Network Access**
   - Go to Network Access
   - Add IP Address
   - Choose "Allow access from anywhere" (0.0.0.0/0) for Vercel deployment
   - Or add specific Vercel IP ranges if you prefer

4. **Get Connection String**
   - Go to Clusters
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `pokemon-marketplace`

   Example:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/pokemon-marketplace?retryWrites=true&w=majority
   ```

## Step 2: Prepare Your Repository

1. **Initialize Git Repository**
   ```bash
   cd pokemon-marketplace
   git init
   git add .
   git commit -m "Initial commit: Pokemon Card Marketplace"
   ```

2. **Create GitHub Repository**
   - Go to GitHub and create a new repository
   - Name it `pokemon-marketplace`
   - Don't initialize with README (we already have one)

3. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/yourusername/pokemon-marketplace.git
   git branch -M main
   git push -u origin main
   ```

## Step 3: Deploy to Vercel

1. **Connect Repository**
   - Log in to Vercel
   - Click "New Project"
   - Import your GitHub repository
   - Select the `pokemon-marketplace` repository

2. **Configure Build Settings**
   - Framework Preset: "Other"
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build`
   - Output Directory: `pokemon-frontend/dist`

3. **Set Environment Variables**
   In the Vercel dashboard, add these environment variables:
   
   ```
   MONGODB_URI = mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/pokemon-marketplace?retryWrites=true&w=majority
   NODE_ENV = production
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be available at `https://your-project-name.vercel.app`

## Step 4: Seed the Database

After deployment, you need to seed your database with initial data:

1. **Option A: Use Vercel CLI**
   ```bash
   npm install -g vercel
   vercel login
   vercel env pull .env.local
   cd api
   node seed.js
   ```

2. **Option B: Create a Seed Endpoint (Temporary)**
   - Add a temporary API endpoint for seeding
   - Call it once after deployment
   - Remove it for security

## Step 5: Configure Custom Domain (Optional)

1. **Add Domain**
   - Go to your project settings in Vercel
   - Click "Domains"
   - Add your custom domain
   - Follow DNS configuration instructions

2. **SSL Certificate**
   - Vercel automatically provides SSL certificates
   - Your site will be available over HTTPS

## Step 6: Test Your Deployment

1. **Frontend Testing**
   - Visit your deployed URL
   - Test card browsing and search
   - Verify responsive design on mobile

2. **Wallet Connection**
   - Install MetaMask if not already installed
   - Connect your wallet
   - Test authentication flow

3. **Admin Features**
   - Connect with the admin wallet address
   - Test card management
   - Verify analytics dashboard

4. **API Testing**
   - Test API endpoints directly
   - Verify CORS is working
   - Check database connections

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are listed in package.json
   - Verify Node.js version compatibility

2. **Database Connection Issues**
   - Verify MongoDB URI is correct
   - Check network access settings in Atlas
   - Ensure database user has proper permissions

3. **API Errors**
   - Check function logs in Vercel dashboard
   - Verify environment variables are set
   - Test API endpoints individually

4. **Frontend Issues**
   - Check browser console for errors
   - Verify API calls are using relative paths
   - Test on different devices and browsers

### Environment Variables

Make sure these are set in Vercel:

```
MONGODB_URI=mongodb+srv://...
NODE_ENV=production
```

### Performance Optimization

1. **Database Indexing**
   - Add indexes for frequently queried fields
   - Monitor query performance in Atlas

2. **Caching**
   - Implement Redis caching if needed
   - Use Vercel's edge caching features

3. **Image Optimization**
   - Use Vercel's image optimization
   - Implement lazy loading for card images

## Security Checklist

- [ ] Database user has minimal required permissions
- [ ] Network access is properly configured
- [ ] Environment variables are secure
- [ ] API endpoints have proper validation
- [ ] CORS is configured correctly
- [ ] No sensitive data in client-side code

## Monitoring

1. **Vercel Analytics**
   - Enable Vercel Analytics for performance monitoring
   - Monitor function execution times

2. **MongoDB Atlas Monitoring**
   - Monitor database performance
   - Set up alerts for high usage

3. **Error Tracking**
   - Implement error tracking (Sentry, LogRocket, etc.)
   - Monitor API error rates

## Scaling Considerations

1. **Database Scaling**
   - Monitor MongoDB Atlas usage
   - Upgrade cluster tier if needed

2. **Function Limits**
   - Be aware of Vercel function execution limits
   - Optimize long-running operations

3. **Traffic Scaling**
   - Vercel automatically scales with traffic
   - Monitor usage and costs

## Support

If you encounter issues:

1. Check Vercel documentation
2. Review MongoDB Atlas documentation
3. Check GitHub issues
4. Contact support teams

---

Your Pokemon Card Marketplace should now be live and ready for users! 🎉

