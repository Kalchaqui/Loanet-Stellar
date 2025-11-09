# 🚀 Deploy to Vercel

This guide will help you deploy Loanet to Vercel.

## Prerequisites

1. **GitHub Account** - Your code should be pushed to GitHub
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Environment Variables** - You'll need your contract IDs

## Step 1: Push to GitHub

Make sure your code is pushed to GitHub:

```bash
git push origin main
```

## Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository (Loanet)
4. Vercel will auto-detect it's a Vite project

## Step 3: Configure Build Settings

Vercel should auto-detect these settings:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

If not, manually set:
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## Step 4: Add Environment Variables

In Vercel project settings, add these environment variables:

### Required Variables:

```
VITE_STELLAR_NETWORK=testnet
VITE_IDENTITY_REGISTRY_CONTRACT=CCJQROO6XTCHGN6CM5GDQS3G6RRWNCHO6BVO5ZKXN4FVV7BYCFVKIXZK
VITE_CREDIT_SCORING_CONTRACT=CABUC5EJGNT3QJVZPVX3QU5JPKCOBPUO6KXLGLQNCK3HZSY4YKJG7EDN
VITE_MOCK_USDC_CONTRACT=CBUXR4XUKUDH5TBVLXU7ACVNSZBJL4MQDAPG2TVFCEOG3Q7BB4GPJM77
VITE_LOAN_MANAGER_CONTRACT=CCHGOWY6DLTS3VDALNIYAVV7GZYCNECPDYVLDGGQLIMIRMD7A6KG7EG5
```

### How to Add:

1. Go to your project in Vercel
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: `VITE_STELLAR_NETWORK`
   - **Value**: `testnet`
   - **Environment**: Production, Preview, Development (select all)
4. Repeat for all variables

## Step 5: Deploy

1. Click **"Deploy"** button
2. Wait for the build to complete
3. Your app will be live at `https://your-project.vercel.app`

## Step 6: Verify Deployment

1. Open your deployed URL
2. Test wallet connection
3. Verify all contract interactions work

## Troubleshooting

### Build Fails

- Check that all environment variables are set
- Verify `package.json` has correct build script
- Check Vercel build logs for errors

### Environment Variables Not Working

- Make sure variables start with `VITE_` prefix
- Redeploy after adding new variables
- Check that variables are set for the correct environment (Production/Preview/Development)

### Contract Calls Fail

- Verify contract IDs are correct
- Check that contracts are deployed on testnet
- Ensure wallet is connected to testnet

## Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Every push to `main` branch
- **Preview**: Every push to other branches
- **Development**: Local development with `vercel dev`

## Support

For issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

