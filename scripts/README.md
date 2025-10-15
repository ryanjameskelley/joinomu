# Scripts Directory

This directory contains utility scripts organized into categories for easier maintenance.

## Folders

### `/debug/`
Contains debugging and testing scripts used during development:
- `check_*.js` - Scripts to check database state, user data, etc.
- `debug_*.js` - Debug utilities for troubleshooting specific issues
- `test_*.js` - Test scripts for validating functionality

### `/maintenance/`
Contains one-off scripts for fixing issues and database maintenance:
- `fix_*.js` - Scripts to fix specific bugs or data issues
- `apply_*.js` - Scripts to apply patches or updates
- `update_*.js` - Scripts to update data or schema
- `migrate_*.js` - Data migration scripts
- `restore_*.js` - Data restoration scripts

### `/utilities/`
Contains setup and utility scripts for development:
- `create_*.js` - Scripts to create test data, users, etc.
- `setup_*.js` - Environment setup scripts
- `temp_*.js` - Temporary utility scripts

### `/sql-patches/`
Contains SQL files for database patches and fixes:
- Various `.sql` files for database schema updates, trigger fixes, and data patches

### `/shell/`
Contains shell scripts for system administration and automation:
- `*backup*.sh` - Database backup and restore scripts
- `setup-*.sh` - System setup and configuration scripts
- `test-*.sh` - Test scripts for validating functionality
- `auth-health-check.sh` - Health check scripts

## Usage

Most scripts can be run with:
```bash
# JavaScript scripts
node scripts/[folder]/[script-name].js

# Shell scripts
bash scripts/shell/[script-name].sh
```

**Note:** These scripts were created during development to solve specific one-off problems. They may contain hardcoded values and should be reviewed before running in production.