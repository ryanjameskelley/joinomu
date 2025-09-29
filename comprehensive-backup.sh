#!/bin/bash
# comprehensive-backup.sh - Complete database backup including schema and data

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/complete_backup_$TIMESTAMP.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

echo "🔄 Starting comprehensive backup at $(date)"

# Full database dump including schema, data, and Supabase-specific elements
docker exec supabase_db_joinomu-monorepo pg_dump \
  -U postgres \
  -d postgres \
  --verbose \
  --clean \
  --if-exists \
  --create \
  --format=plain \
  --encoding=UTF8 \
  --no-owner \
  --no-privileges \
  --schema=public \
  --schema=auth \
  --schema=storage \
  --schema=realtime \
  --schema=supabase_functions \
  > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Complete backup created: $BACKUP_FILE"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    echo "🗜️  Backup compressed: $BACKUP_FILE.gz"
    
    # Keep only last 7 days of backups
    find $BACKUP_DIR -name "complete_backup_*.sql.gz" -mtime +7 -delete
    echo "🧹 Cleaned old backups (kept last 7 days)"
    
    echo "✅ Comprehensive backup completed successfully at $(date)"
else
    echo "❌ Backup failed!"
    exit 1
fi