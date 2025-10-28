# Testing Guide for Order Flow

## Prerequisites
- Supabase database is set up with camelCase columns (customerId, ringId, stopId, etc.)
- Environment variables are correctly set in `.env.local` and Vercel
- At least one ring with stops is available in the database

## Test Flow

### 1. Customer Order Submission (localhost or production)

**URL:** http://localhost:3000/order or https://your-domain.vercel.app/order

**Steps:**
1. Open the order page
2. Select a ring from the dropdown (should load available rings)
3. Select a stop from the dropdown (should load stops for selected ring)
4. Select product category
5. Browse products and add quantities
6. Click "Lisa" to add products to order
7. Fill in customer information:
   - Name (required)
   - Phone (required)
   - Email (required)
   - Organization name (optional)
   - Registration code (optional)
8. Add additional notes if needed ("Lisainfo tellimuse kohta")
9. Select payment method
10. Check privacy consent checkbox
11. Click "Esita tellimus"

**Expected Results:**
- Success message: "Aitäh, Teie tellimus on edastatud! Koopia tellimusest tuleb ka Teie e-posti aadressile"
- Form is completely cleared (all fields empty, order lines removed)
- Order is saved to Supabase with correct camelCase column names

**Verify in Supabase:**
```sql
SELECT * FROM "Order" ORDER BY "createdAt" DESC LIMIT 1;
SELECT * FROM "OrderLine" WHERE "orderId" = '<last_order_id>';
SELECT * FROM "Customer" WHERE email = '<customer_email>';
```

### 2. Admin View - View Orders

**URL:** http://localhost:3000/admin or https://your-domain.vercel.app/admin

**Steps:**
1. Log in with admin password
2. Verify the order appears in the list
3. Check that all columns are displayed correctly:
   - Tellimuse ID
   - Kuupäev
   - Ring
   - Peatus
   - Klient
   - Telefon
   - Maksemeetod
   - Summa
   - Staatus
   - Tegevused

**Expected Results:**
- Order appears in the table
- All customer information is correct
- Ring and stop are correctly displayed
- Sum is calculated and displayed
- Status is "NEW" (Uus)

### 3. Admin View - Auto-Refresh

**Steps:**
1. Keep the admin page open
2. Wait 60 seconds
3. Check browser console for log: "[Admin] Auto-refreshing orders..."
4. Or manually click "Värskenda" button

**Expected Results:**
- Orders list refreshes automatically every 60 seconds
- Manual refresh button works immediately
- No page reload, just data refresh

### 4. Admin View - Order Details

**Steps:**
1. Click "Vaata" button for the order
2. Review all order details in the modal:
   - Customer information
   - Ring and stop details
   - Order lines with products, quantities, prices
   - Total sum
   - Notes (if any)

**Expected Results:**
- All information is displayed correctly
- Prices and totals are accurate
- Product names and quantities match the order

### 5. Admin View - Edit Packed Weights

**Steps:**
1. Open order details modal
2. Scroll to the weight editing section
3. Change packed weight for a product
4. Verify the sum updates immediately
5. Click "Salvesta" to save changes

**Expected Results:**
- Packed weight input accepts decimal numbers (e.g., 0.55, 6.78)
- Sum recalculates immediately as you type
- Changes are saved to the database
- Packed weight is displayed in the order list

**Verify in Supabase:**
```sql
SELECT "packedWeight", "packedQty" FROM "OrderLine" WHERE id = '<line_id>';
```

### 6. Admin View - Print Packing List

**Steps:**
1. Click "Prindi pakkimise nimekiri" button
2. A new window should open with the packing list

**Expected Results:**
- Packing list opens in a new window
- Grouped by Stop → Ring
- Shows all orders for the ring
- Each order shows:
  - Customer name and phone
  - Order ID
  - Products and quantities
  - Total sum
- Print dialog opens automatically

**API Endpoint Test:**
```bash
curl "http://localhost:3000/api/admin/print/packing?ringId=<ring_id>"
```

### 7. Admin View - Print Transport Sheet

**Steps:**
1. Click "Prindi transpordi leht" button
2. A new window should open with the transport sheet

**Expected Results:**
- Transport sheet opens in a new window
- Grouped by stop in ring order (based on Stop.order_index)
- Each stop shows orders with:
  - Customer name and phone
  - Order content (products)
  - Total sum
- Print dialog opens automatically

**API Endpoint Test:**
```bash
curl "http://localhost:3000/api/admin/print/transport?ringId=<ring_id>"
```

### 8. Admin View - Change Order Status

**Steps:**
1. Open order details modal
2. Change status to "Tellimus vastu võetud"
3. Click "Salvesta"

**Expected Results:**
- Status is updated in the database
- Order list reflects the new status
- Status badge color changes accordingly

**Verify in Supabase:**
```sql
SELECT status FROM "Order" WHERE id = '<order_id>';
```

### 9. Edge Cases to Test

**Empty Order Submission:**
- Try to submit without selecting products → Should show alert "Valige vähemalt üks toode!"

**Missing Customer Info:**
- Try to submit without required fields → Browser validation should prevent submission

**Duplicate Order Check:**
- Submit the same order twice within 24 hours → Should work but return `duplicate: true` in response

**No Orders for Printing:**
- Clear all filters so no orders are shown → Should show alert "Ei ole tellimusi printimiseks!"

**API Errors:**
- Test with wrong ringId → Should show error message
- Test with missing environment variables → Should return 503 error

### 10. Verify Column Names in Database

Run these queries to confirm camelCase columns are being used:

```sql
-- Check Order table
\d "Order"

-- Check OrderLine table
\d "OrderLine"

-- Check recent inserts use correct column names
SELECT "customerId", "ringId", "stopId", "deliveryType", "notesCustomer", "paymentMethod"
FROM "Order"
ORDER BY "createdAt" DESC
LIMIT 5;

SELECT "orderId", "productSku", "requestedQty", "unitPrice", "substitutionAllowed"
FROM "OrderLine"
ORDER BY "orderId" DESC
LIMIT 10;
```

## Success Criteria

✅ Customer can submit an order successfully
✅ Order appears in admin view immediately
✅ Admin page auto-refreshes every 60 seconds
✅ Admin can view order details
✅ Admin can edit packed weights
✅ Admin can change order status
✅ Admin can print packing list (server-rendered)
✅ Admin can print transport sheet (server-rendered)
✅ Form clears after successful submission
✅ All database operations use correct camelCase column names
✅ No linting errors in the code

## Deployment Steps

1. Commit and push changes to GitHub:
   ```bash
   git push origin main
   ```

2. Verify Vercel deployment completes successfully

3. Run the full test flow on production:
   - Submit a test order
   - Verify it appears in admin
   - Test print functions
   - Clean up test data if needed

4. Monitor for any errors in Vercel logs and Supabase logs

## Troubleshooting

**Orders not showing in admin:**
- Check Supabase environment variables in Vercel
- Verify database permissions (RLS policies)
- Check browser console for API errors

**Print functions not working:**
- Check that print API endpoints are accessible
- Verify ringId is being passed correctly
- Check browser pop-up blocker settings

**Auto-refresh not working:**
- Check browser console for interval logs
- Verify fetchOrders function is not throwing errors
- Check if admin session is still authenticated

**Column name errors:**
- Re-confirm database schema with `\d "Order"` and `\d "OrderLine"`
- Verify all API routes use camelCase (customerId, not customer_id)
- Check Supabase client queries for quoted vs unquoted column names

