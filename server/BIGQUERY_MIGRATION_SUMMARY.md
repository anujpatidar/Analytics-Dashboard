# BigQuery Migration Summary

## Overview
Updated the analytics dashboard to use the new service account and BigQuery table structure with nested data.

## Changes Made

### 1. Service Account Configuration
- **Updated**: `server/service-account.json`
- **New Project ID**: `frido-429506`
- **Service Account Email**: `frido-dev-analytics-dashboard@frido-429506.iam.gserviceaccount.com`

### 2. BigQuery Configuration Updates

#### Updated Files:
- `server/utils/bigquery.js`
- `server/config/bigquery.js`
- `server/controllers/orders.controller.js`
- `server/controllers/products.controller.js`
- `server/utils/fetchOverallProductMetric.js`

#### New Configuration:
```javascript
// Project ID: frido-429506
// Dataset: frido_analytics
// Table: Frido_Shopify_orders
```

### 3. Table Structure Changes

#### Old Structure (Separate Tables):
- `orders` table
- `line_items` table  
- `refunds` table

#### New Structure (Single Table with Nested Data):
- `Frido_Shopify_orders` table containing:
  - Order data (root level)
  - `line_items` (nested array)
  - `refunds` (nested array)

### 4. Query Updates

#### Orders Overview Query:
```sql
-- Old approach using JOINs
FROM orders o LEFT JOIN line_items li ON o.id = li.order_id

-- New approach using nested data
FROM Frido_Shopify_orders o, UNNEST(o.line_items) as line_item
```

#### Refunds Query:
```sql
-- Old approach
FROM refunds r WHERE r.order_id = ...

-- New approach  
FROM Frido_Shopify_orders o,
UNNEST(o.refunds) as refund,
UNNEST(refund.transactions) as refund_transaction
WHERE refund_transaction.kind = 'refund'
```

#### Products Query:
```sql
-- Old approach
FROM line_items WHERE sku IN (...)

-- New approach
FROM Frido_Shopify_orders o,
UNNEST(o.line_items) as line_item
WHERE line_item.SKU IN (...)
```

### 5. Environment Configuration

#### Created: `server/config.example.env`
```env
GOOGLE_CLOUD_PROJECT_ID=frido-429506
BIGQUERY_DATASET=frido_analytics
BIGQUERY_TABLE=Frido_Shopify_orders
BIGQUERY_LOCATION=US
```

### 6. Key Benefits of New Structure

1. **Performance**: Single table reduces JOIN operations
2. **Data Integrity**: Related data is kept together
3. **Simplified Queries**: No complex JOIN logic needed
4. **Atomic Operations**: All order data is in one place

### 7. Migration Steps Required

1. **Create .env file** based on `config.example.env`
2. **Set environment variables**:
   ```bash
   export GOOGLE_CLOUD_PROJECT_ID=frido-429506
   export BIGQUERY_DATASET=frido_analytics
   export BIGQUERY_TABLE=Frido_Shopify_orders
   ```
3. **Verify BigQuery access** with new service account
4. **Test queries** with new table structure

### 8. Updated Functions

#### Orders Controller:
- `getOrdersOverview()` - Now uses nested line_items and refunds
- `getOrdersByTimeRange()` - Updated for single table structure
- `getTopSellingProducts()` - Uses UNNEST for line_items
- `getRefundMetrics()` - Handles nested refund data

#### Products Controller:
- `getIndividualProductInsights()` - Updated for nested structure
- All product queries now use `UNNEST(o.line_items)`

#### Utils:
- `fetchOverallProductMetric.js` - Updated all queries
- `bigquery.js` - New project configuration and helper functions

### 9. Error Handling

All queries now include proper error handling for:
- Missing nested arrays
- Null values in nested structures
- Safe division operations using `SAFE_DIVIDE()`

### 10. Testing Checklist

- [ ] Orders overview loads correctly
- [ ] Time-based charts display data
- [ ] Product insights work with nested line_items
- [ ] Refund metrics calculate properly
- [ ] Marketing widgets load (using order data)
- [ ] No BigQuery quota exceeded errors
- [ ] Cache functionality works

### 11. Rollback Plan

If issues occur:
1. Keep the old service account as backup
2. Environment variables can be quickly switched
3. Query structure can be reverted by updating table references

## Next Steps

1. Create actual `.env` file with your real values
2. Test each dashboard component
3. Monitor BigQuery costs with new query patterns
4. Update any custom queries you may have added

## Notes

- All hardcoded table references have been replaced with `getDatasetName()`
- Queries are now more resilient to missing data
- Nested array handling follows BigQuery best practices
- Performance should improve due to reduced JOINs 