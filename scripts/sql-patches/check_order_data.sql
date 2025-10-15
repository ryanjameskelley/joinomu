-- Check medication orders data to verify payment and fulfillment status values
SELECT 
    id,
    medication_name,
    payment_status,
    fulfillment_status,
    payment_method,
    payment_date,
    tracking_number,
    shipped_date,
    estimated_delivery
FROM medication_orders 
ORDER BY created_at DESC 
LIMIT 10;