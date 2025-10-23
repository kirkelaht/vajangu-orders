#!/usr/bin/env node

/**
 * Database Backup Setup Script
 * Sets up automated backups for PostgreSQL database
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('💾 Setting up database backup system...\n');

// Create backup directory
const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log('✅ Created backups directory');
}

// Create backup script
const backupScript = `#!/bin/bash

# Database Backup Script for Vajangu Orders
# Run this script daily via cron job

# Configuration
DB_NAME="vajangu_orders"
DB_USER="vajangu_user"
BACKUP_DIR="${backupDir}"
RETENTION_DAYS=30

# Create timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/vajangu_orders_$TIMESTAMP.sql"

# Create backup
echo "Creating backup: $BACKUP_FILE"
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully: $BACKUP_FILE"
    
    # Compress backup
    gzip $BACKUP_FILE
    echo "✅ Backup compressed: $BACKUP_FILE.gz"
    
    # Remove old backups (older than retention days)
    find $BACKUP_DIR -name "vajangu_orders_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo "✅ Old backups cleaned up"
    
    # Show backup info
    echo "📊 Backup size: $(du -h $BACKUP_FILE.gz | cut -f1)"
    echo "📁 Total backups: $(ls -1 $BACKUP_DIR/vajangu_orders_*.sql.gz 2>/dev/null | wc -l)"
    
else
    echo "❌ Backup failed!"
    exit 1
fi
`;

fs.writeFileSync(path.join(__dirname, 'backup-database.sh'), backupScript);
execSync('chmod +x backup-database.sh');
console.log('✅ Created backup script: backup-database.sh');

// Create restore script
const restoreScript = `#!/bin/bash

# Database Restore Script for Vajangu Orders
# Usage: ./restore-database.sh <backup_file>

if [ $# -eq 0 ]; then
    echo "❌ Please provide backup file name"
    echo "Usage: ./restore-database.sh <backup_file>"
    echo "Available backups:"
    ls -la ${backupDir}/
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="vajangu_orders"
DB_USER="vajangu_user"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Confirm restore
echo "⚠️  WARNING: This will replace all data in the database!"
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# Restore database
echo "🔄 Restoring database from $BACKUP_FILE..."

if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | psql -h localhost -U $DB_USER -d $DB_NAME
else
    psql -h localhost -U $DB_USER -d $DB_NAME < "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully!"
else
    echo "❌ Restore failed!"
    exit 1
fi
`;

fs.writeFileSync(path.join(__dirname, 'restore-database.sh'), restoreScript);
execSync('chmod +x restore-database.sh');
console.log('✅ Created restore script: restore-database.sh');

// Create cron job setup
const cronSetup = `# Add this to your crontab (run: crontab -e)
# Daily backup at 2 AM
0 2 * * * cd ${__dirname} && ./backup-database.sh >> backup.log 2>&1

# Weekly backup on Sunday at 3 AM (keep longer)
0 3 * * 0 cd ${__dirname} && ./backup-database.sh >> backup.log 2>&1
`;

fs.writeFileSync(path.join(__dirname, 'crontab-setup.txt'), cronSetup);
console.log('✅ Created crontab setup: crontab-setup.txt');

// Create backup monitoring script
const monitoringScript = `#!/usr/bin/env node

/**
 * Backup Monitoring Script
 * Checks backup status and sends alerts if needed
 */

const fs = require('fs');
const path = require('path');

const backupDir = '${backupDir}';
const maxAgeHours = 25; // Alert if no backup in 25 hours

function checkBackups() {
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('vajangu_orders_') && f.endsWith('.sql.gz'))
    .map(f => ({
      name: f,
      path: path.join(backupDir, f),
      mtime: fs.statSync(path.join(backupDir, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length === 0) {
    console.log('❌ No backups found!');
    return false;
  }

  const latest = files[0];
  const ageHours = (Date.now() - latest.mtime.getTime()) / (1000 * 60 * 60);

  console.log(\`📊 Latest backup: \${latest.name}\`);
  console.log(\`⏰ Age: \${ageHours.toFixed(1)} hours\`);
  console.log(\`📁 Total backups: \${files.length}\`);

  if (ageHours > maxAgeHours) {
    console.log('⚠️  WARNING: Backup is older than 25 hours!');
    return false;
  }

  console.log('✅ Backup status: OK');
  return true;
}

checkBackups();
`;

fs.writeFileSync(path.join(__dirname, 'check-backups.js'), monitoringScript);
execSync('chmod +x check-backups.js');
console.log('✅ Created backup monitoring: check-backups.js');

console.log('\n🎉 Backup system setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Test backup: ./backup-database.sh');
console.log('2. Set up cron job: crontab -e (see crontab-setup.txt)');
console.log('3. Monitor backups: node check-backups.js');
console.log('4. Test restore: ./restore-database.sh <backup_file>');
console.log('\n📁 Backup files will be stored in:', backupDir);
