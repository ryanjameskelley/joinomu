# Manual Health Metrics Data Addition Guide

Since the automated script is having database connection issues, we can add the missing metric types using the "Add Daily Metrics" form in the application.

## Steps:

1. **Navigate to the tracking page** at http://localhost:4219/treatments
2. **Click "Add Daily Metrics"** button
3. **Add sample data for each missing metric type:**

### Sample Data to Add:

**Today's Date:**
- **Protein**: 120 grams
- **Sugar**: 35 grams  
- **Water**: 75 fl oz
- **Average Heart Rate**: 72 bpm
- **Weight**: 185 lbs (to test alongside existing data)

**Yesterday:**
- **Protein**: 105 grams
- **Sugar**: 42 grams
- **Water**: 68 fl oz
- **Average Heart Rate**: 74 bpm

**2 Days Ago:**
- **Protein**: 135 grams
- **Sugar**: 28 grams
- **Water**: 82 fl oz
- **Average Heart Rate**: 71 bpm

## After Adding Data:

1. Switch between different metric types using the dropdown (Weight, Protein, Sugar, Water, Heart Rate)
2. Verify that each metric type shows data points in the chart
3. Test the date range picker to ensure historical data is preserved

This manual approach will:
- ✅ Use the same authentication system
- ✅ Use the same health metrics service
- ✅ Ensure proper data formatting
- ✅ Test the actual user workflow
- ✅ Verify the chart displays each metric type correctly

Once you've added a few data points for each metric type, we can verify that the chart switching and data persistence issues are resolved.