# 🚀 Study Buddy Agent - Deployment Guide

## Quick Deploy to Cloudflare

### Option 1: One-Click Deploy

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/your-username/studybot-cloudflare-agent)

### Option 2: Manual Deployment

1. **Fork this repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/studybot-cloudflare-agent.git
   cd studybot-cloudflare-agent
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Configure Cloudflare**
   ```bash
   # Login to Cloudflare
   wrangler login
   
   # Create D1 database
   wrangler d1 create studybot-db
   
   # Copy the database ID from the output
   ```

5. **Update configuration**
   - Edit `wrangler.toml`
   - Replace `your-database-id-here` with your actual database ID

6. **Deploy**
   ```bash
   wrangler deploy
   ```

7. **Test your deployment**
   ```bash
   npm test https://your-worker-url.workers.dev
   ```

## 🔧 Configuration

### Required Services

- ✅ **Cloudflare Workers** (Free tier)
- ✅ **Workers AI** (Free tier)
- ✅ **D1 Database** (Free tier)
- ✅ **Durable Objects** (Free tier)

### Environment Setup

1. **Enable Workers AI**
   - Go to Cloudflare Dashboard
   - Navigate to Workers & Pages → AI
   - Enable Workers AI (may require approval)

2. **Create D1 Database**
   ```bash
   wrangler d1 create studybot-db
   ```

3. **Update wrangler.toml**
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "studybot-db"
   database_id = "your-actual-database-id"
   ```

## 🧪 Testing

### Local Development
```bash
# Start development server
npm run dev

# Run tests
npm test http://localhost:8787
```

### Production Testing
```bash
# Test deployed version
npm test https://your-worker.workers.dev

# Test individual endpoints
curl https://your-worker.workers.dev/api/test/all
```

## 📊 Monitoring

### View Logs
```bash
wrangler tail
```

### Check Status
```bash
wrangler deployments list
```

### Database Management
```bash
# Execute SQL
wrangler d1 execute studybot-db --command "SELECT * FROM user_states"

# Export data
wrangler d1 export studybot-db --output=backup.sql
```

## 🔒 Security

### Environment Variables
- Never commit API keys or secrets
- Use Cloudflare secrets for sensitive data
- Rotate keys regularly

### Database Security
- Use prepared statements
- Validate all inputs
- Implement rate limiting

## 🚀 Scaling

### Performance Optimization
- Use Durable Objects for stateful operations
- Optimize database queries
- Implement caching strategies
- Monitor AI usage

### Cost Management
- Monitor Workers AI usage
- Optimize database queries
- Use appropriate D1 database size

## 🆘 Troubleshooting

### Common Issues

1. **AI not working**
   - Check if Workers AI is enabled
   - Verify model name is correct
   - Check API limits

2. **Database errors**
   - Verify database ID in wrangler.toml
   - Check database permissions
   - Review SQL syntax

3. **Deployment failures**
   - Check wrangler.toml syntax
   - Verify all bindings are correct
   - Check Cloudflare account limits

### Getting Help

- Check the [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- Review the [Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- Open an issue in this repository

## 📈 Analytics

### Built-in Monitoring
- Request/response logging
- Error tracking
- Performance metrics
- User activity tracking

### Custom Analytics
- Add your own analytics service
- Track user engagement
- Monitor AI usage patterns
- Database performance metrics

## 🔄 Updates

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Deploy updates
wrangler deploy
```

### Database Migrations
```bash
# Apply migrations
wrangler d1 migrations apply studybot-db
```

## 🎯 Next Steps

After deployment:

1. **Customize the AI prompts** for your use case
2. **Add your own branding** and styling
3. **Implement additional features** like voice input
4. **Set up monitoring** and analytics
5. **Scale based on usage** patterns

## 📞 Support

- **Documentation**: [README.md](README.md)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Issues**: [GitHub Issues](https://github.com/your-username/studybot-cloudflare-agent/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/studybot-cloudflare-agent/discussions)

---

**Happy Deploying! 🎉**
