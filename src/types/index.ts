// Type definitions for Vajangu Orders

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  org_name?: string;
  reg_code?: string;
  vat?: string;
  segment: string;
  consentEmail: boolean;
  consentSms: boolean;
  created_at: string;
}

export interface Ring {
  id: string;
  ring_date: string;
  region: string;
  driver?: string;
  visible_from: string;
  visible_to: string;
  cutoff_at: string;
  capacity_orders?: number;
  capacity_kg?: number;
  status: string;
}

export interface Stop {
  id: string;
  ring_id: string;
  name: string;
  place: string;
  meeting_point?: string;
  time_start?: string;
  time_end?: string;
  order_index: number;
  sort_order?: number;
}

export interface Product {
  sku: string;
  name: string;
  category: string;
  uom: string;
  catch_weight: boolean;
  active: boolean;
  current_price?: number;
}

export interface OrderLine {
  id: string;
  order_id: string;
  product_sku: string;
  product: Product;
  uom: string;
  requested_qty: number;
  packed_qty?: number;
  packed_weight?: number;
  unit_price?: number;
  line_total?: number;
  substitution_allowed: boolean;
}

export interface Order {
  id: string;
  created_at: string;
  channel: string;
  customer_id: string;
  customer: Customer;
  ring_id: string;
  ring: Ring;
  stop_id: string;
  stop: Stop;
  delivery_type: string;
  delivery_address?: string;
  status: string;
  notes_customer?: string;
  notes_internal?: string;
  payment_method: string;
  payment_status: string;
  invoice_id?: string;
  invoice_number?: string;
  invoiced_at?: string;
  invoice_total?: number;
  tax_rate?: number;
  picked_by?: string;
  delivered_by?: string;
  lines: OrderLine[];
}

export interface FilterState {
  ring: string;
  stop: string;
  status: string;
  month: string;
}

export interface NewProduct {
  name: string;
  price: string;
  weight: string;
  uom: string;
}

export interface EmailData {
  subject: string;
  message: string;
}
