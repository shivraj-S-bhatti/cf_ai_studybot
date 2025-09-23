#!/bin/bash

echo "🚀 Deploying Study Buddy Agent to Cloudflare Workers..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it with: npm install -g wrangler"
    exit 1
fi

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare. Please run: wrangler login"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create D1 database if it doesn't exist
echo "🗄️ Setting up D1 database..."
wrangler d1 create studybot-db --experimental

# Deploy the worker
echo "🚀 Deploying worker..."
wrangler deploy

echo "✅ Deployment complete!"
echo "🌐 Your Study Buddy Agent is now live!"
echo "💡 Don't forget to update the database_id in wrangler.toml with the actual ID from the D1 creation output"
