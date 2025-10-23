#!/bin/bash

# GitHub Push Script for Vajangu Orders
# This script helps you push your code to GitHub

echo "🚀 Vajangu Orders - GitHub Push Script"
echo "======================================"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not initialized"
    echo "Run: git init"
    exit 1
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  There are uncommitted changes:"
    git status --short
    echo ""
    read -p "Do you want to commit these changes? (y/n): " commit_changes
    
    if [ "$commit_changes" = "y" ]; then
        echo "📝 Committing changes..."
        git add .
        git commit -m "Update: $(date '+%Y-%m-%d %H:%M:%S')"
    else
        echo "❌ Please commit or stash your changes first"
        exit 1
    fi
fi

# Check if remote is configured
if ! git remote get-url origin >/dev/null 2>&1; then
    echo "🔗 No remote repository configured"
    echo ""
    echo "Please create a GitHub repository first:"
    echo "1. Go to https://github.com/new"
    echo "2. Create repository: vajangu-orders"
    echo "3. Don't initialize with README (we already have files)"
    echo ""
    read -p "Enter your GitHub username: " github_username
    
    if [ -z "$github_username" ]; then
        echo "❌ GitHub username required"
        exit 1
    fi
    
    echo "🔗 Adding remote repository..."
    git remote add origin "https://github.com/$github_username/vajangu-orders.git"
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🌐 Your repository is now available at:"
    git remote get-url origin | sed 's/\.git$//'
    echo ""
    echo "📋 Next steps:"
    echo "1. Set up environment variables in your hosting platform"
    echo "2. Configure database (PostgreSQL recommended)"
    echo "3. Deploy to production"
    echo "4. Set up monitoring and backups"
    echo ""
    echo "📚 Documentation:"
    echo "- README.md - Project overview"
    echo "- PRODUCTION-DEPLOYMENT.md - Deployment guide"
    echo "- SECURITY-CHECKLIST.md - Security guidelines"
else
    echo ""
    echo "❌ Failed to push to GitHub"
    echo "Please check your GitHub credentials and repository access"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure you have push access to the repository"
    echo "2. Check your GitHub authentication (SSH keys or personal access token)"
    echo "3. Verify the repository URL is correct"
fi
