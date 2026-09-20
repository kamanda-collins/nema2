#!/bin/bash

# NEMA Compliance Web - GitHub Setup Script
# This script helps you create and push the web interface to GitHub

echo "🌿 NEMA Compliance Checker - Web Interface Setup"
echo "=================================================="

# Get repository details
read -p "Enter your GitHub username: " GITHUB_USERNAME
read -p "Enter repository name (default: nema-compliance-web): " REPO_NAME
REPO_NAME=${REPO_NAME:-nema-compliance-web}

echo ""
echo "📋 Setup Summary:"
echo "GitHub Username: $GITHUB_USERNAME"
echo "Repository Name: $REPO_NAME"
echo "Repository URL: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""

read -p "Continue with setup? (y/n): " CONFIRM
if [[ $CONFIRM != [yY] ]]; then
    echo "Setup cancelled."
    exit 1
fi

# Create necessary directories if they don't exist
echo "📁 Creating directory structure..."
mkdir -p public

# Initialize git repository
echo "🔧 Initializing git repository..."
git init

# Add all files
echo "📦 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit - NEMA Compliance Checker web interface

- Landing page with embedded Streamlit app
- Responsive design for mobile and desktop
- Vercel deployment configuration
- SEO optimization and meta tags
- Professional styling and branding"

# Set main branch
git branch -M main

# Add remote origin
echo "🔗 Adding GitHub remote..."
git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git

echo ""
echo "✅ Local setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Create repository on GitHub:"
echo "   https://github.com/new"
echo "   Repository name: $REPO_NAME"
echo "   Make it public (recommended)"
echo ""
echo "2. Push to GitHub:"
echo "   git push -u origin main"
echo ""
echo "3. Deploy to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Import your GitHub repository: $GITHUB_USERNAME/$REPO_NAME"
echo "   - Set custom domain: nema.kamandalabs.me"
echo "   - Deploy!"
echo ""
echo "4. Configure DNS:"
echo "   Add CNAME record: nema.kamandalabs.me → cname.vercel-dns.com"
echo ""
echo "🚀 Your app will be live at: https://nema.kamandalabs.me"

# Offer to open GitHub
read -p "Open GitHub to create repository? (y/n): " OPEN_GITHUB
if [[ $OPEN_GITHUB == [yY] ]]; then
    if command -v open &> /dev/null; then
        open "https://github.com/new"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "https://github.com/new"
    else
        echo "Please open: https://github.com/new"
    fi
fi

echo ""
echo "🎉 Setup complete! Ready for deployment."
