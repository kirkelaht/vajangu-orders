# 🚀 Vajangu Orders - Production Deployment Guide

This guide will help you deploy your Vajangu Orders system to production with proper security and backup measures.

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL 13+ installed
- Domain name and hosting service
- SSL certificate (Let's Encrypt recommended)

## 🔐 Security Features Implemented

### ✅ Admin Password Protection
- **Password:** `vajangu2025` (change in production)
- **Login required** for admin access
- **Logout functionality** included

### ✅ Database Security
- **PostgreSQL** for production (encrypted connections)
- **Environment variables** for sensitive data
- **Automated backups** with retention policy

## 🗄️ Database Setup

### 1. Install PostgreSQL
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Run Database Setup
```bash
node setup-production-db.js
```

This will:
- Create PostgreSQL database
- Set up user and permissions
- Update Prisma schema
- Run migrations
- Create `.env.local` file

### 3. Set Up Backups
```bash
node backup-setup.js
```

This will:
- Create backup scripts
- Set up monitoring
- Generate cron job configuration

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from `production.env.example`

4. **Database:** Use Vercel Postgres or external PostgreSQL

### Option 2: DigitalOcean App Platform

1. **Connect GitHub repository**
2. **Set build command:** `npm run build`
3. **Set run command:** `npm start`
4. **Add environment variables**
5. **Create PostgreSQL database**

### Option 3: Self-Hosted (VPS)

1. **Set up server** (Ubuntu 20.04+ recommended)
2. **Install dependencies:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs postgresql nginx
   ```

3. **Clone repository:**
   ```bash
   git clone <your-repo-url>
   cd vajangu-orders
   npm install
   ```

4. **Set up database:**
   ```bash
   node setup-production-db.js
   ```

5. **Build and start:**
   ```bash
   npm run build
   npm start
   ```

6. **Set up Nginx reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Set up SSL with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# App
APP_BASE_URL="https://your-domain.com"
NODE_ENV="production"

# Email
MAILERSEND_API_KEY="your_mailersend_api_key"

# Security
ADMIN_PASSWORD="your_secure_password"
JWT_SECRET="your_jwt_secret"
SESSION_SECRET="your_session_secret"
```

### Generate Secure Secrets

```bash
# Generate random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📊 Monitoring & Maintenance

### 1. Database Backups
- **Automatic:** Daily at 2 AM
- **Retention:** 30 days
- **Location:** `./backups/` directory
- **Monitoring:** `node check-backups.js`

### 2. Log Monitoring
```bash
# View application logs
pm2 logs vajangu-orders

# View backup logs
tail -f backup.log
```

### 3. Performance Monitoring
- Monitor database size
- Check backup success
- Monitor disk space
- Set up uptime monitoring

## 🛡️ Security Checklist

### ✅ Implemented
- [x] Admin password protection
- [x] PostgreSQL with SSL
- [x] Environment variable security
- [x] Automated backups
- [x] Input validation

### 🔄 Additional Recommendations
- [ ] Change default admin password
- [ ] Set up firewall rules
- [ ] Enable database encryption at rest
- [ ] Set up intrusion detection
- [ ] Regular security updates
- [ ] SSL certificate monitoring

## 🚨 Emergency Procedures

### Database Recovery
```bash
# List available backups
ls -la backups/

# Restore from backup
./restore-database.sh backups/vajangu_orders_20250101_020000.sql.gz
```

### Password Reset
```bash
# Update admin password in database
psql -d vajangu_orders -c "UPDATE customers SET email = 'new@email.com' WHERE id = 'admin';"
```

### System Recovery
1. **Stop application**
2. **Restore database**
3. **Update environment variables**
4. **Restart application**

## 📞 Support

- **Technical Issues:** Check logs and error messages
- **Database Issues:** Run `node check-backups.js`
- **Performance Issues:** Monitor system resources

## 🔄 Updates

To update the system:
1. **Backup database**
2. **Pull latest code**
3. **Run migrations:** `npx prisma db push`
4. **Restart application**

---

**🎉 Your Vajangu Orders system is now production-ready with enterprise-level security and backup systems!**
