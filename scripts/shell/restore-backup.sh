#!/bin/bash
# restore-backup.sh - Restore database from backup

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Example: $0 ./backups/complete_backup_20250929_140000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will completely replace the current database!"
echo "📁 Backup file: $BACKUP_FILE"
read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# Decompress if needed
RESTORE_FILE="$BACKUP_FILE"
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "📦 Decompressing backup..."
    gunzip -c "$BACKUP_FILE" > temp_restore.sql
    RESTORE_FILE="temp_restore.sql"
fi

echo "🛑 Stopping current containers..."
docker compose down

echo "🚀 Starting fresh database..."
docker compose up -d supabase_db

# Wait for database to be ready
echo "⏳ Waiting for database to start..."
sleep 15

# Test database connection
for i in {1..30}; do
    if docker exec supabase_db_joinomu-monorepo pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ Database is ready"
        break
    fi
    echo "⏳ Waiting for database... ($i/30)"
    sleep 2
done

echo "📥 Restoring database from backup..."
cat "$RESTORE_FILE" | docker exec -i supabase_db_joinomu-monorepo psql -U postgres -d postgres

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully"
    
    # Restart all services
    echo "🚀 Restarting all services..."
    docker compose up -d
    
    echo "✅ All services restarted"
    echo "🔗 Your app should be available shortly at your configured port"
else
    echo "❌ Database restore failed!"
    exit 1
fi

# Clean up temp file
if [ -f "temp_restore.sql" ]; then
    rm temp_restore.sql
    echo "🧹 Cleaned up temporary files"
fi

echo "✅ Restore process completed"