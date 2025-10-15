#!/bin/bash
# Simple test for launchd backup system
echo "$(date): Launchd test backup started" >> ./backups/launchd-test.log
echo "PATH: $PATH" >> ./backups/launchd-test.log
echo "HOME: $HOME" >> ./backups/launchd-test.log
echo "Docker accessible: $(docker ps &>/dev/null && echo 'Yes' || echo 'No')" >> ./backups/launchd-test.log
echo "Supabase container check: $(docker exec supabase_db_joinomu-monorepo echo 'OK' 2>&1)" >> ./backups/launchd-test.log
echo "$(date): Launchd test backup completed" >> ./backups/launchd-test.log