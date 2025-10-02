#!/bin/bash
# Create a test launchd service that runs in 1 minute

BACKUP_DIR="/Users/ryankelley/Desktop/Ryan's Macbook Pro/JoinOmu GLP-1/joinomu-monorepo"
LAUNCHD_DIR="$HOME/Library/LaunchAgents"

# Calculate time 1 minute from now
CURRENT_HOUR=$(date +%H)
CURRENT_MINUTE=$(date +%M)
TEST_MINUTE=$((CURRENT_MINUTE + 1))
TEST_HOUR=$CURRENT_HOUR

# Handle minute overflow
if [ $TEST_MINUTE -ge 60 ]; then
    TEST_MINUTE=$((TEST_MINUTE - 60))
    TEST_HOUR=$((TEST_HOUR + 1))
fi

# Handle hour overflow
if [ $TEST_HOUR -ge 24 ]; then
    TEST_HOUR=0
fi

echo "🕐 Creating test backup service to run at $TEST_HOUR:$(printf "%02d" $TEST_MINUTE)"

# Create test backup service
cat > "$LAUNCHD_DIR/com.joinomu.test-backup.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.joinomu.test-backup</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$BACKUP_DIR/schema-backup.sh</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$BACKUP_DIR</string>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>$TEST_HOUR</integer>
        <key>Minute</key>
        <integer>$TEST_MINUTE</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>$BACKUP_DIR/backups/test-backup.log</string>
    <key>StandardErrorPath</key>
    <string>$BACKUP_DIR/backups/test-backup.log</string>
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

# Load the test service
echo "🚀 Loading test service..."
launchctl load "$LAUNCHD_DIR/com.joinomu.test-backup.plist"

echo "✅ Test backup scheduled for $TEST_HOUR:$(printf "%02d" $TEST_MINUTE)"
echo "📋 Monitor with: tail -f $BACKUP_DIR/backups/test-backup.log"
echo "🗂️  Check backups: ls -la $BACKUP_DIR/backups/ | grep schema"
echo ""
echo "⏰ Waiting for test backup to run..."