// Type definitions for Vajangu Orders

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  orgName?: string;
  regCode?: string;
  vat?: string;
  segment: string;
  consentEmail: boolean;
  consentSms: boolean;
  createdAt: string;
}

export interface Ring {
  id: string;
  ringDate: string;
  region: string;
  driver?: string;
  visibleFrom: string;
  visibleTo: string;
  cutoffAt: string;
  capacityOrders?: number;
  capacityKg?: number;
  status: string;
}

export interface Stop {
  id: string;
  ringId: string;
  name: string;
  meetingPoint: string;
  timeStart: string;
  timeEnd: string;
  sortOrder: number;
}

export interface Product {
  sku: string;
  name: string;
  category: string;
  uom: string;
  catchWeight: boolean;
  active: boolean;
  currentPrice?: number;
}

export interface OrderLine {
  id: string;
  orderId: string;
  productSku: string;
  product: Product;
  uom: string;
  requestedQty: number;
  packedQty?: number;
  packedWeight?: number;
  unitPrice?: number;
  lineTotal?: number;
  substitutionAllowed: boolean;
}

export interface Order {
  id: string;
  createdAt: string;
  channel: string;
  customerId: string;
  customer: Customer;
  ringId: string;
  ring: Ring;
  stopId: string;
  stop: Stop;
  deliveryType: string;
  deliveryAddress?: string;
  status: string;
  notesCustomer?: string;
  notesInternal?: string;
  paymentMethod: string;
  paymentStatus: string;
  invoiceId?: string;
  invoiceNumber?: string;
  invoicedAt?: string;
  invoiceTotal?: number;
  taxRate?: number;
  pickedBy?: string;
  deliveredBy?: string;
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
