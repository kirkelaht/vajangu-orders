#!/usr/bin/env node

/**
 * Production Database Setup Script
 * This script helps you set up PostgreSQL for production
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up PostgreSQL for Vajangu Orders Production...\n');

// Check if PostgreSQL is installed
function checkPostgreSQL() {
  try {
    execSync('psql --version', { stdio: 'pipe' });
    console.log('✅ PostgreSQL is installed');
    return true;
  } catch (error) {
    console.log('❌ PostgreSQL is not installed');
    console.log('\n📋 To install PostgreSQL:');
    console.log('   macOS: brew install postgresql');
    console.log('   Ubuntu: sudo apt-get install postgresql postgresql-contrib');
    console.log('   Windows: Download from https://www.postgresql.org/download/');
    return false;
  }
}

// Create database and user
function setupDatabase() {
  const dbName = 'vajangu_orders';
  const dbUser = 'vajangu_user';
  const dbPassword = 'vajangu_secure_password_2025';
  
  console.log('\n🔧 Setting up database...');
  
  try {
    // Create database
    execSync(`createdb ${dbName}`, { stdio: 'pipe' });
    console.log(`✅ Database '${dbName}' created`);
    
    // Create user (this might require sudo)
    try {
      execSync(`psql -d ${dbName} -c "CREATE USER ${dbUser} WITH PASSWORD '${dbPassword}';"`, { stdio: 'pipe' });
      console.log(`✅ User '${dbUser}' created`);
      
      // Grant privileges
      execSync(`psql -d ${dbName} -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser};"`, { stdio: 'pipe' });
      console.log(`✅ Privileges granted to '${dbUser}'`);
      
    } catch (userError) {
      console.log('⚠️  Could not create user automatically. Please run manually:');
      console.log(`   psql -d ${dbName} -c "CREATE USER ${dbUser} WITH PASSWORD '${dbPassword}';"`);
      console.log(`   psql -d ${dbName} -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser};"`);
    }
    
    // Generate connection string
    const connectionString = `postgresql://${dbUser}:${dbPassword}@localhost:5432/${dbName}?sslmode=require`;
    
    console.log('\n📋 Database setup complete!');
    console.log('🔗 Connection string:');
    console.log(`   ${connectionString}`);
    
    // Create .env.local file
    const envContent = `# Production Database
DATABASE_URL="${connectionString}"

# App Configuration
APP_BASE_URL="http://localhost:3001"
NODE_ENV="production"

# Email Configuration
MAILERSEND_API_KEY=""

# Admin Security
ADMIN_PASSWORD="vajangu2025"
`;

    fs.writeFileSync('.env.local', envContent);
    console.log('\n✅ Created .env.local file with database configuration');
    
    return connectionString;
    
  } catch (error) {
    console.log('❌ Error setting up database:', error.message);
    console.log('\n📋 Manual setup instructions:');
    console.log('1. Create database: createdb vajangu_orders');
    console.log('2. Create user: psql -d vajangu_orders -c "CREATE USER vajangu_user WITH PASSWORD \'vajangu_secure_password_2025\';"');
    console.log('3. Grant privileges: psql -d vajangu_orders -c "GRANT ALL PRIVILEGES ON DATABASE vajangu_orders TO vajangu_user;"');
    return null;
  }
}

// Run Prisma migration
function runMigration(connectionString) {
  console.log('\n🔄 Running database migration...');
  
  try {
    // Update schema.prisma to use PostgreSQL
    const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    let schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Replace SQLite with PostgreSQL
    schema = schema.replace(
      'provider = "sqlite"',
      'provider = "postgresql"'
    );
    schema = schema.replace(
      'url      = "file:./dev.db"',
      'url      = env("DATABASE_URL")'
    );
    
    fs.writeFileSync(schemaPath, schema);
    console.log('✅ Updated schema.prisma for PostgreSQL');
    
    // Run migration
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Database migration completed');
    
    // Generate Prisma client
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated');
    
  } catch (error) {
    console.log('❌ Migration failed:', error.message);
    console.log('\n📋 Manual migration:');
    console.log('1. Update prisma/schema.prisma to use PostgreSQL');
    console.log('2. Run: npx prisma db push');
    console.log('3. Run: npx prisma generate');
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking system requirements...\n');
  
  if (!checkPostgreSQL()) {
    process.exit(1);
  }
  
  const connectionString = setupDatabase();
  if (connectionString) {
    runMigration(connectionString);
    
    console.log('\n🎉 Production database setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Update .env.local with your actual domain and email settings');
    console.log('2. Test the connection: npm run dev');
    console.log('3. Set up database backups (see backup-setup.js)');
    console.log('4. Deploy to your production server');
  }
}

main().catch(console.error);
