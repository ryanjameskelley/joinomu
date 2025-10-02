#!/bin/bash
# Convert backup system from cron to launchd for macOS compatibility

BACKUP_DIR="/Users/ryankelley/Desktop/Ryan's Macbook Pro/JoinOmu GLP-1/joinomu-monorepo"
LAUNCHD_DIR="$HOME/Library/LaunchAgents"

echo "🔄 Setting up launchd backup services..."

# Remove existing cron jobs
echo "Removing existing cron jobs..."
crontab -l | grep -v "joinomu-monorepo" | crontab - 2>/dev/null || true

# Create launchd directory if it doesn't exist
mkdir -p "$LAUNCHD_DIR"

# Schema backup every 6 hours
cat > "$LAUNCHD_DIR/com.joinomu.schema-backup.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.joinomu.schema-backup</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$BACKUP_DIR/schema-backup.sh</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$BACKUP_DIR</string>
    <key>StartInterval</key>
    <integer>21600</integer>
    <key>StandardOutPath</key>
    <string>$BACKUP_DIR/backups/cron.log</string>
    <key>StandardErrorPath</key>
    <string>$BACKUP_DIR/backups/cron.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
        <key>HOME</key>
        <string>$HOME</string>
    </dict>
</dict>
</plist>
EOF

# Comprehensive backup daily at 2 AM
cat > "$LAUNCHD_DIR/com.joinomu.comprehensive-backup.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.joinomu.comprehensive-backup</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$BACKUP_DIR/comprehensive-backup.sh</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$BACKUP_DIR</string>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>2</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>$BACKUP_DIR/backups/cron.log</string>
    <key>StandardErrorPath</key>
    <string>$BACKUP_DIR/backups/cron.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
        <key>HOME</key>
        <string>$HOME</string>
    </dict>
</dict>
</plist>
EOF

# Health check daily at 9 AM
cat > "$LAUNCHD_DIR/com.joinomu.health-check.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.joinomu.health-check</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$BACKUP_DIR/auth-health-check.sh</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$BACKUP_DIR</string>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>$BACKUP_DIR/backups/health.log</string>
    <key>StandardErrorPath</key>
    <string>$BACKUP_DIR/backups/health.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
        <key>HOME</key>
        <string>$HOME</string>
    </dict>
</dict>
</plist>
EOF

# Load the services
echo "Loading launchd services..."
launchctl load "$LAUNCHD_DIR/com.joinomu.schema-backup.plist"
launchctl load "$LAUNCHD_DIR/com.joinomu.comprehensive-backup.plist" 
launchctl load "$LAUNCHD_DIR/com.joinomu.health-check.plist"

echo "✅ Launchd backup services installed successfully!"
echo ""
echo "📋 Services created:"
echo "  • Schema backup: Every 6 hours"
echo "  • Comprehensive backup: Daily at 2:00 AM"  
echo "  • Health check: Daily at 9:00 AM"
echo ""
echo "🔧 Management commands:"
echo "  • Check status: launchctl list | grep joinomu"
echo "  • Restart schema backup: launchctl kickstart -k gui/$(id -u)/com.joinomu.schema-backup"
echo "  • View logs: tail -f $BACKUP_DIR/backups/cron.log"
echo ""
echo "⚠️  Note: If Docker permission issues occur, you may need to:"
echo "   1. Run 'sudo chmod 666 /var/run/docker.sock' (temporary)"
echo "   2. Or add your user to the docker group"

# Test the schema backup immediately
echo "🧪 Testing schema backup service..."
launchctl kickstart -k "gui/$(id -u)/com.joinomu.schema-backup"
echo "✅ Test backup initiated - check ./backups/ directory in a moment"