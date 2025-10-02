#!/bin/bash
# Test script to check cron environment

echo "=== CRON ENVIRONMENT TEST ===" >> ./backups/cron-env-test.log
echo "Date: $(date)" >> ./backups/cron-env-test.log
echo "PWD: $(pwd)" >> ./backups/cron-env-test.log
echo "USER: $USER" >> ./backups/cron-env-test.log
echo "HOME: $HOME" >> ./backups/cron-env-test.log
echo "PATH: $PATH" >> ./backups/cron-env-test.log
echo "Docker location: $(which docker 2>&1)" >> ./backups/cron-env-test.log
echo "Docker version: $(docker --version 2>&1)" >> ./backups/cron-env-test.log
echo "Docker containers: $(docker ps --format 'table {{.Names}}' 2>&1)" >> ./backups/cron-env-test.log
echo "Supabase container check: $(docker exec supabase_db_joinomu-monorepo echo 'Container accessible' 2>&1)" >> ./backups/cron-env-test.log
echo "===========================================" >> ./backups/cron-env-test.log