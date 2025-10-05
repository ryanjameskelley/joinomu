# Medication Frequency Guide for Providers

This guide explains how to enter medication frequencies that will work correctly with the automatic "Next Dose" calculation in the patient treatments page.

## Recommended Frequency Formats

### Simple Number Format (Best Practice)
- **"1"** - Daily (every 1 day)
- **"2"** - Every other day (every 2 days)
- **"3"** - Every third day (every 3 days)
- **"7"** - Weekly (every 7 days)
- **"14"** - Bi-weekly (every 14 days)
- **"30"** - Monthly (every 30 days)

### Text Format (Also Supported)
- **"daily"** - Every day
- **"every other day"** - Every 2 days
- **"weekly"** - Every 7 days
- **"monthly"** - Every 30 days

### Medical Abbreviations
- **"twice daily"** or **"bid"** - Every 12 hours
- **"three times daily"** or **"tid"** - Every 8 hours
- **"four times daily"** or **"qid"** - Every 6 hours

### Complex Patterns
- **"twice weekly"** - Every 3-4 days
- **"three times weekly"** - Every 2-3 days
- **"every 5 days"** - Every 5 days

## Examples of What Works

✅ **Good Examples:**
- "1" → Daily
- "2" → Every other day
- "7" → Weekly
- "every other day" → Every 2 days
- "twice weekly" → Every 3-4 days

❌ **Avoid These:**
- "as needed" (no calculation possible)
- "when symptoms occur" (no calculation possible)
- "PRN" (no calculation possible)

## How It Calculates Next Dose

When a patient tracks their medication, the system:
1. Takes the date they last took the medication
2. Adds the frequency interval (in days)
3. Shows "Next: [calculated date]" in the treatments page

## For Custom Frequencies

If you need a custom frequency not listed above:
1. Use the number of days format (e.g., "5" for every 5 days)
2. Or use "every X days" format (e.g., "every 10 days")

## Technical Details

The system supports fractional days for multiple daily doses:
- Twice daily = 0.5 days (12 hours)
- Three times daily = 0.33 days (8 hours)
- Four times daily = 0.25 days (6 hours)