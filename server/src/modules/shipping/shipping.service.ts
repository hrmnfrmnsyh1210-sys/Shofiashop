import { env } from '../../config/env.js';
import { badRequest, serviceUnavailable } from '../../lib/httpError.js';

// --- Komerce Collaborator "tariff" API (cost + destination) response shapes ---
// Base: {KOMERCE_BASE_URL}/tariff/api/v1, auth header `x-api-key`.
interface KomerceEnvelope<T> {
  meta: { message: string; code: number; status: string };
  data: T;
}

interface KoDestination {
  // collaborator returns `id`; some payloads use `destination_id`/`subdistrict_id`
  id?: number | string;
  destination_id?: number | string;
  subdistrict_id?: number | string;
  label?: string;
  province_name?: string;
  city_name?: string;
  district_name?: string;
  subdistrict_name?: string;
  zip_code?: string;
}

// A single quoted service from /tariff/api/v1/calculate. The response groups
// these under calculate_reguler / calculate_cargo / calculate_instant.
interface KoCalcItem {
  shipping_name?: string; // courier, e.g. "JNE"
  service_name?: string; // e.g. "REG"
  shipping_cost?: number; // IDR
  shipping_cost_net?: number;
  grandtotal?: number;
  etd?: string; // e.g. "2 days"
  // tolerate alternative field names
  name?: string;
  service?: string;
  cost?: number;
}

interface KoCalcData {
  calculate_reguler?: KoCalcItem[];
  calculate_cargo?: KoCalcItem[];
  calculate_instant?: KoCalcItem[];
}

// --- Our normalized public shapes ---
export interface Destination {
  id: string;
  label: string;
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  zipCode: string;
}

export interface ShippingOption {
  courier: string; // courier name as Komerce knows it, e.g. "JNE"
  courierName: string; // same as courier (kept for UI compatibility)
  service: string; // e.g. "REG"
  description: string;
  cost: number; // IDR
  etd: string; // e.g. "2-3" (cleaned), may be empty
}

const COST_BASE = () => `${env.KOMERCE_BASE_URL}/tariff/api/v1`;

const isEnabled = () => env.KOMERCE_COST_API_KEY.length > 0;

const ensureEnabled = () => {
  if (!isEnabled()) {
    throw serviceUnavailable(
      'Fitur ongkir belum dikonfigurasi. Atur KOMERCE_COST_API_KEY di server.',
    );
  }
};

// Shared caller for the Komerce collaborator "tariff" API (x-api-key header).
async function call<T>(
  path: string,
  init: RequestInit & { query?: Record<string, string> } = {},
): Promise<T> {
  const url = new URL(`${COST_BASE()}${path}`);
  if (init.query) {
    for (const [k, v] of Object.entries(init.query)) url.searchParams.set(k, v);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        'x-api-key': env.KOMERCE_COST_API_KEY,
        accept: 'application/json',
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw serviceUnavailable('Gagal menghubungi layanan ongkir. Coba lagi nanti.');
  }

  const text = await res.text();
  let body: KomerceEnvelope<T> | undefined;
  try {
    body = text ? (JSON.parse(text) as KomerceEnvelope<T>) : undefined;
  } catch {
    body = undefined;
  }

  const meta = body?.meta;
  if (!res.ok || !meta || meta.code !== 200) {
    const msg = meta?.message ?? `Layanan ongkir error (${res.status})`;
    throw badRequest(`Ongkir: ${msg}`);
  }
  return body!.data;
}

const cleanEtd = (etd?: string) =>
  (etd ?? '').replace(/\s*(hari|days?)\s*/gi, '').trim();

export const shippingService = {
  isEnabled,

  // Search domestic destinations (down to sub-district level) by free text.
  // Collaborator: GET /tariff/api/v1/destination/search?keyword=...
  searchDestinations: async (search: string): Promise<Destination[]> => {
    ensureEnabled();
    const data = await call<KoDestination[]>('/destination/search', {
      query: { keyword: search },
    });
    return (data ?? []).map((d) => ({
      id: String(d.id ?? d.destination_id ?? d.subdistrict_id ?? ''),
      label: d.label ?? '',
      province: d.province_name ?? '',
      city: d.city_name ?? '',
      district: d.district_name ?? '',
      subdistrict: d.subdistrict_name ?? '',
      zipCode: d.zip_code ?? '',
    }));
  },

  // Calculate shipping cost between two destination ids for a given weight.
  // Collaborator: GET /tariff/api/v1/calculate (weight in KG). Couriers are
  // returned grouped by reguler/cargo/instant; we flatten them all.
  calculateCost: async (params: {
    originId: string;
    destinationId: string;
    weight: number; // grams
    itemValue?: number; // IDR (for insurance), optional
  }): Promise<ShippingOption[]> => {
    ensureEnabled();
    const weightKg = Math.max(0.1, Math.round((params.weight / 1000) * 100) / 100);

    const data = await call<KoCalcData>('/calculate', {
      query: {
        shipper_destination_id: params.originId,
        receiver_destination_id: params.destinationId,
        weight: String(weightKg),
        item_value: String(Math.max(0, Math.round(params.itemValue ?? 0))),
        cod: 'false',
      },
    });

    const groups = [
      ...(data?.calculate_reguler ?? []),
      ...(data?.calculate_cargo ?? []),
      ...(data?.calculate_instant ?? []),
    ];
    const options: ShippingOption[] = groups.map((c) => {
      const name = c.shipping_name ?? c.name ?? '';
      const service = c.service_name ?? c.service ?? '';
      const cost = c.shipping_cost ?? c.cost ?? c.grandtotal ?? 0;
      return {
        courier: name,
        courierName: name,
        service,
        description: `${name} ${service}`.trim(),
        cost,
        etd: cleanEtd(c.etd),
      };
    });

    if (options.length === 0) {
      throw badRequest(
        'Tidak ada layanan pengiriman yang tersedia untuk tujuan ini.',
      );
    }
    options.sort((a, b) => a.cost - b.cost);
    return options;
  },
};
