# 🐷 Vajangu Orders - Order Management System

A comprehensive order management system for Vajangu Perefarm, built with Next.js, Prisma, and PostgreSQL. This system handles customer orders, product management, and administrative functions for a farm-to-table meat delivery service.

## ✨ Features

### 🛒 Customer Features
- **Product Catalog** - Browse products by category with real-time pricing
- **Order Form** - Easy-to-use order form with validation
- **Ring Selection** - Choose delivery rings and stops
- **Custom Pricing** - Special pricing for gift cards
- **Order Confirmation** - Email confirmations and order tracking
- **Privacy Compliance** - GDPR-compliant data handling

### 👨‍💼 Admin Features
- **Order Management** - View, edit, and manage all orders
- **Product Management** - Add custom products and update pricing
- **Print Functions** - Generate packing lists and transport sheets
- **Excel Export** - Export orders to CSV format
- **Email System** - Send custom emails and invoices
- **Status Tracking** - Track order status from new to completed
- **Security** - Password-protected admin access

### 🔐 Security Features
- **Admin Authentication** - Secure login system
- **Database Encryption** - PostgreSQL with SSL connections
- **Input Validation** - XSS and injection protection
- **Automated Backups** - Daily backups with retention policy
- **Environment Security** - Sensitive data in environment variables

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+ (for production)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/vajangu-orders.git
   cd vajangu-orders
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp production.env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up database:**
   ```bash
   # For development (SQLite)
   npx prisma db push
   
   # For production (PostgreSQL)
   node setup-production-db.js
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Access the application:**
   - Customer orders: http://localhost:3001/order
   - Admin panel: http://localhost:3001/admin (password: vajangu2025)

## 📁 Project Structure

```
vajangu-orders/
├── src/
│   ├── app/
│   │   ├── admin/           # Admin dashboard
│   │   ├── api/             # API endpoints
│   │   ├── order/           # Customer order form
│   │   └── privacy-policy/  # Privacy policy page
│   └── lib/
│       ├── prisma.ts        # Database connection
│       └── email.ts         # Email service
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
├── public/                  # Static assets
├── data/                    # Product data
├── backups/                 # Database backups
└── scripts/                 # Setup and utility scripts
```

## 🗄️ Database Schema

The system uses Prisma ORM with the following main models:

- **Customer** - Customer information and contact details
- **Order** - Order details, status, and payment information
- **OrderLine** - Individual products in each order
- **Product** - Product catalog with pricing
- **Ring** - Delivery routes and schedules
- **Stop** - Delivery stops within rings

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# App Configuration
APP_BASE_URL="https://your-domain.com"
NODE_ENV="production"

# Email Service
MAILERSEND_API_KEY="your_mailersend_api_key"

# Security
ADMIN_PASSWORD="your_secure_password"
JWT_SECRET="your_jwt_secret"
```

### Database Setup

#### Development (SQLite)
```bash
npx prisma db push
npx prisma generate
```

#### Production (PostgreSQL)
```bash
node setup-production-db.js
```

## 📊 Backup & Recovery

### Automated Backups
```bash
# Set up backup system
node backup-setup.js

# Manual backup
./backup-database.sh

# Restore from backup
./restore-database.sh backups/vajangu_orders_YYYYMMDD_HHMMSS.sql.gz
```

### Backup Monitoring
```bash
# Check backup status
node check-backups.js
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Self-Hosted
1. Set up PostgreSQL database
2. Configure environment variables
3. Build and start the application:
   ```bash
   npm run build
   npm start
   ```

For detailed deployment instructions, see [PRODUCTION-DEPLOYMENT.md](PRODUCTION-DEPLOYMENT.md).

## 🔐 Security

### Admin Access
- **Default Password:** `vajangu2025` (change in production)
- **Session Management:** Secure session handling
- **Logout:** Automatic session termination

### Data Protection
- **Encryption:** Database connections encrypted with SSL
- **Backups:** Automated daily backups with encryption
- **Input Validation:** Protection against XSS and injection attacks
- **Environment Variables:** Sensitive data stored securely

For complete security guidelines, see [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md).

## 📈 Monitoring

### Health Checks
- Database connection status
- Backup success monitoring
- Application uptime tracking

### Logs
- Application logs
- Database query logs
- Backup operation logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is proprietary software for Vajangu Perefarm OÜ.

## 📞 Support

For technical support or questions:
- **Email:** info@perefarm.ee
- **Phone:** +372 5555 1234

## 🔄 Updates

### Version History
- **v1.0.0** - Initial release with basic order management
- **v1.1.0** - Added admin authentication and security features
- **v1.2.0** - Implemented PostgreSQL and backup system
- **v1.3.0** - Added email notifications and invoice generation

### Updating
```bash
git pull origin main
npm install
npx prisma db push
npm run build
```

---

**Built with ❤️ for Vajangu Perefarm OÜ**

*Kõrgekvaliteediline kodumaine sealiha* 🐷