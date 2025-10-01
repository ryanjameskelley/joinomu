#!/bin/bash
# update-cron-backups.sh - Update automated backups with fixed paths

PROJECT_DIR="/Users/ryankelley/Desktop/Ryan's Macbook Pro/JoinOmu GLP-1/joinomu-monorepo"

echo "🔧 Updating automated backups with Docker path fixes..."

# Create the cron job entries with explicit PATH setting
CRON_JOBS="# JoinOmu Database Backup Jobs with Full Paths
PATH=/usr/local/bin:/usr/bin:/bin

# Run comprehensive backup daily at 2 AM
0 2 * * * cd '$PROJECT_DIR' && ./comprehensive-backup.sh >> ./backups/cron.log 2>&1

# Run schema-only backup every 6 hours
0 */6 * * * cd '$PROJECT_DIR' && ./schema-backup.sh >> ./backups/cron.log 2>&1

# Run health check daily at 9 AM
0 9 * * * cd '$PROJECT_DIR' && ./auth-health-check.sh >> ./backups/health.log 2>&1"

# Add to crontab
echo "$CRON_JOBS" | crontab -

if [ $? -eq 0 ]; then
    echo "✅ Automated backups updated successfully!"
    echo ""
    echo "📅 Schedule:"
    echo "   - Comprehensive backup: Daily at 2:00 AM"
    echo "   - Schema backup: Every 6 hours"
    echo "   - Health check: Daily at 9:00 AM"
    echo ""
    echo "🔧 Fixed issues:"
    echo "   - Added explicit PATH for cron environment"
    echo "   - Updated scripts to use absolute Docker paths"
    echo "   - Set proper environment variables"
    echo ""
    echo "📁 Logs will be saved to:"
    echo "   - Backup logs: ./backups/cron.log"
    echo "   - Health logs: ./backups/health.log"
    echo ""
    echo "🔍 View current cron jobs:"
    echo "   crontab -l"
else
    echo "❌ Failed to update cron jobs"
    exit 1
fi