import { env } from '../../config/env.js';
import { badRequest, serviceUnavailable } from '../../lib/httpError.js';

// Komship / RajaOngkir Delivery Order API (auto-generate resi). This is a
// separate product from the cost/track API in shipping.service.ts: different
// base URL and `x-api-key` header auth.

interface KomshipEnvelope<T> {
  meta: { message: string; code: number; status: string };
  data: T;
}

// --- Request shapes we build ---
export interface KomshipOrderItem {
  product_name: string;
  product_variant_name: string;
  product_price: number;
  product_weight: number; // grams
  product_width: number; // cm
  product_height: number; // cm
  product_length: number; // cm
  qty: number;
  subtotal: number;
}

export interface KomshipOrderInput {
  order_date: string; // ISO date-time
  brand_name: string;
  shipper_name: string;
  shipper_phone: string;
  shipper_email: string;
  shipper_destination_id: number;
  shipper_address: string;
  origin_pin_point: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_email: string;
  receiver_destination_id: number;
  receiver_address: string;
  destination_pin_point: string;
  shipping: string; // courier name, e.g. "JNE"
  shipping_type: string; // service, e.g. "REG"
  payment_method: 'COD' | 'BANK TRANSFER';
  shipping_cost: number;
  shipping_cashback: number;
  service_fee: number;
  additional_cost: number;
  grand_total: number;
  cod_value: number;
  insurance_value: number;
  order_details: KomshipOrderItem[];
}

// --- Response shapes (only the bits we use) ---
interface KomshipStoreResult {
  order_id: number;
  order_no: string;
}

interface KomshipPickupResult {
  status: string;
  order_no: string;
  awb: string;
}

interface KomshipDetailResult {
  awb: string;
  live_tracking_url: string;
  order_status: string;
  order_no: string;
}

const isEnabled = () => env.KOMSHIP_API_KEY.length > 0;

const ensureEnabled = () => {
  if (!isEnabled()) {
    throw serviceUnavailable(
      'Fitur resi otomatis (Komship) belum dikonfigurasi. Atur KOMSHIP_API_KEY di server.',
    );
  }
};

async function call<T>(
  path: string,
  init: RequestInit & { query?: Record<string, string> } = {},
): Promise<T> {
  const url = new URL(`${env.KOMSHIP_BASE_URL}${path}`);
  if (init.query) {
    for (const [k, v] of Object.entries(init.query)) url.searchParams.set(k, v);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        'x-api-key': env.KOMSHIP_API_KEY,
        accept: 'application/json',
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw serviceUnavailable('Gagal menghubungi layanan Komship. Coba lagi nanti.');
  }

  const text = await res.text();
  let body: KomshipEnvelope<T> | undefined;
  try {
    body = text ? (JSON.parse(text) as KomshipEnvelope<T>) : undefined;
  } catch {
    body = undefined;
  }

  const meta = body?.meta;
  if (!res.ok || !meta || (meta.code !== 200 && meta.code !== 201)) {
    const msg = meta?.message ?? `Layanan Komship error (${res.status})`;
    throw badRequest(`Komship: ${msg}`);
  }
  return body!.data;
}

export const komshipService = {
  isEnabled,

  // Create a delivery order. Returns the Komship order number (no AWB yet).
  createOrder: async (input: KomshipOrderInput): Promise<KomshipStoreResult> => {
    ensureEnabled();
    return call<KomshipStoreResult>('/orders/store', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
  },

  // Schedule a pickup for one or more orders. The AWB (resi) is returned here.
  requestPickup: async (params: {
    orderNo: string;
    pickupDate: string; // YYYY-MM-DD
    pickupTime?: string; // HH:MM
    pickupVehicle?: string; // Motor | Mobil | Truk
  }): Promise<KomshipPickupResult | undefined> => {
    ensureEnabled();
    const data = await call<KomshipPickupResult[]>('/pickup/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        pickup_date: params.pickupDate,
        pickup_time: params.pickupTime ?? env.KOMSHIP_PICKUP_TIME,
        pickup_vehicle: params.pickupVehicle ?? env.KOMSHIP_PICKUP_VEHICLE,
        orders: [{ order_no: params.orderNo }],
      }),
    });
    return (data ?? []).find((d) => d.order_no === params.orderNo) ?? data?.[0];
  },

  // Fetch the current AWB / live tracking URL / status for an order.
  orderDetail: async (orderNo: string): Promise<KomshipDetailResult> => {
    ensureEnabled();
    return call<KomshipDetailResult>('/orders/detail', {
      method: 'GET',
      query: { order_no: orderNo },
    });
  },
};
