# Invoice Number Generation - Best Practices

## Problem with Current Approach
- **Race conditions**: Multiple simultaneous requests can generate the same number
- **Inefficient**: Requires multiple database queries to check uniqueness
- **Not atomic**: No guarantee of uniqueness without retry loops

## Best Solution: PostgreSQL Sequence (Database-Level)

### Why Sequences are Best:
1. **Atomic**: Database guarantees uniqueness at the DB level
2. **Thread-safe**: Handles concurrent requests automatically
3. **Fast**: No need for multiple queries or retry loops
4. **Reliable**: No race conditions possible
5. **Simple**: One function call to get next number

### Implementation:

#### 1. Database Migration (`supabase/migrations/20250101_add_invoice_sequence.sql`)
Creates:
- **Per-year sequences**: Automatically creates `invoice_seq_2025`, `invoice_seq_2026`, etc.
- **Function `get_next_invoice_number()`**: 
  - Creates sequence for current year if it doesn't exist
  - Returns next number atomically (format: `YYYY-0001`)
  - Resets to 1 each new year automatically

#### 2. Application Code (`src/app/api/admin/invoice/route.ts`)
- Uses `sb.rpc('get_next_invoice_number')` to get next number
- Falls back to manual generation if function doesn't exist yet
- No retry loops needed - database handles uniqueness

### How to Apply:

1. **Run the migration in Supabase**:
   - Go to Supabase Dashboard → SQL Editor
   - Run the SQL from `supabase/migrations/20250101_add_invoice_sequence.sql`
   - Or use Supabase CLI: `supabase migration up`

2. **Deploy code changes**:
   - Code is already updated to use the function
   - It will automatically fall back if function doesn't exist

### Format:
- Current year: `2025-0001`, `2025-0002`, etc.
- Next year: Automatically starts `2026-0001`

### Benefits:
✅ **Zero duplicates**: Database guarantees uniqueness  
✅ **Fast**: Single function call  
✅ **Simple**: No complex retry logic  
✅ **Year-based**: Automatically resets each year  
✅ **Production-ready**: Used by thousands of apps  

### Alternative Approaches (if needed):

#### Option 2: Atomic Counter Table
```sql
CREATE TABLE invoice_counter (
  year INTEGER PRIMARY KEY,
  counter INTEGER NOT NULL DEFAULT 0
);

-- Function with SELECT FOR UPDATE (row-level locking)
CREATE FUNCTION get_next_invoice_number() RETURNS TEXT AS $$
  DECLARE
    current_year INTEGER;
    next_num INTEGER;
  BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    SELECT counter + 1 INTO next_num
    FROM invoice_counter
    WHERE year = current_year
    FOR UPDATE;
    
    IF next_num IS NULL THEN
      INSERT INTO invoice_counter (year, counter) 
      VALUES (current_year, 1)
      ON CONFLICT (year) DO UPDATE SET counter = invoice_counter.counter + 1
      RETURNING counter INTO next_num;
    ELSE
      UPDATE invoice_counter SET counter = next_num WHERE year = current_year;
    END IF;
    
    RETURN format('%s-%04d', current_year, next_num);
  END;
$$ LANGUAGE plpgsql;
```

#### Option 3: UUID-based (if sequential not required)
- Not recommended for invoices (needs to be sequential for accounting)

## Current Status:
- ✅ Migration file created
- ✅ Application code updated with fallback
- ⏳ **Next step**: Run the migration in Supabase

