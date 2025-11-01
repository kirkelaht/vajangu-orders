-- Create a sequence for invoice numbers per year
-- This will generate unique sequential numbers atomically

-- Function to get next invoice number for current year
CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  invoice_num TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Get or create sequence for this year
  -- Sequence name format: invoice_seq_YYYY
  BEGIN
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS invoice_seq_%s START 1', current_year);
  EXCEPTION WHEN duplicate_object THEN
    -- Sequence already exists, continue
    NULL;
  END;
  
  -- Get next value from sequence atomically
  EXECUTE format('SELECT nextval(''invoice_seq_%s'')', current_year) INTO next_number;
  
  -- Format: YYYY-0001, YYYY-0002, etc.
  invoice_num := format('%s-%04d', current_year, next_number);
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Optional: Function to reset sequence at start of new year (can be called manually or via cron)
CREATE OR REPLACE FUNCTION reset_invoice_sequence_for_year(year_val INTEGER)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('DROP SEQUENCE IF EXISTS invoice_seq_%s', year_val);
  EXECUTE format('CREATE SEQUENCE invoice_seq_%s START 1', year_val);
END;
$$ LANGUAGE plpgsql;

