#!/bin/bash
# schema-backup.sh - Schema-only backup for quick reference

# Set PATH for cron environment
export PATH="/usr/local/bin:/usr/bin:/bin"

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCHEMA_FILE="$BACKUP_DIR/schema_only_$TIMESTAMP.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

echo "🔄 Starting schema backup at $(date)"

# Schema-only backup
/usr/local/bin/docker exec supabase_db_joinomu-monorepo pg_dump \
  -U postgres \
  -d postgres \
  --schema-only \
  --verbose \
  --format=plain \
  --schema=public \
  --schema=auth \
  > "$SCHEMA_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Schema backup created: $SCHEMA_FILE"
    
    # Compress backup
    gzip "$SCHEMA_FILE"
    echo "🗜️  Schema backup compressed: $SCHEMA_FILE.gz"
    
    # Keep only last 10 schema backups
    find $BACKUP_DIR -name "schema_only_*.sql.gz" | sort -r | tail -n +11 | xargs rm -f
    echo "🧹 Cleaned old schema backups (kept last 10)"
    
    echo "✅ Schema backup completed successfully at $(date)"
else
    echo "❌ Schema backup failed!"
    exit 1
fi