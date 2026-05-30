import { env } from '../../config/env.js';
import { badRequest, serviceUnavailable } from '../../lib/httpError.js';

// --- Komerce RajaOngkir API (v1) response shapes (only the bits we use) ---
// Base: rajaongkir.komerce.id/api/v1, auth header `key`.
interface KomerceEnvelope<T> {
  meta: { message: string; code: number; status: string };
  data: T;
}

interface KoDestination {
  id: number;
  label: string;
  province_name: string;
  city_name: string;
  district_name: string;
  subdistrict_name: string;
  zip_code: string;
}

interface KoCost {
  name: string; // courier name, e.g. "JNE"
  code: string; // courier code, e.g. "jne"
  service: string; // e.g. "REG"
  description: string;
  cost: number; // IDR
  etd: string; // e.g. "2 day"
}

// --- Komerce waybill tracking response shapes (only the bits we use) ---
interface KoTrackManifest {
  manifest_code: string;
  manifest_description: string;
  manifest_date: string;
  manifest_time: string;
  city_name: string;
}

interface KoTrackResponse {
  delivered: boolean;
  summary: {
    courier_code: string;
    courier_name: string;
    waybill_number: string;
    service_code: string;
    waybill_date: string;
    shipper_name: string;
    receiver_name: string;
    origin: string;
    destination: string;
    status: string;
  };
  delivery_status: {
    status: string;
    pod_receiver: string;
    pod_date: string;
    pod_time: string;
  };
  manifest: KoTrackManifest[];
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
  courier: string; // e.g. "jne"
  courierName: string; // e.g. "JNE"
  service: string; // e.g. "REG"
  description: string;
  cost: number; // IDR
  etd: string; // e.g. "2-3" (cleaned), may be empty
}

export interface TrackingStep {
  date: string; // ISO-ish date string from courier
  time: string;
  description: string;
  location: string;
}

export interface TrackingInfo {
  waybill: string;
  courier: string; // courier code, e.g. "jne"
  courierName: string;
  service: string;
  shipper: string;
  receiver: string;
  origin: string;
  destination: string;
  status: string; // current status text
  delivered: boolean;
  podReceiver: string | null; // proof-of-delivery receiver name
  podDate: string | null;
  history: TrackingStep[]; // newest first
}

const isEnabled = () => env.RAJAONGKIR_API_KEY.length > 0;

const ensureEnabled = () => {
  if (!isEnabled()) {
    throw serviceUnavailable(
      'Fitur ongkir belum dikonfigurasi. Hubungi admin untuk mengatur RajaOngkir API key.',
    );
  }
};

async function call<T>(
  path: string,
  init: RequestInit & { query?: Record<string, string> } = {},
): Promise<T> {
  const url = new URL(`${env.RAJAONGKIR_BASE_URL}${path}`);
  if (init.query) {
    for (const [k, v] of Object.entries(init.query)) url.searchParams.set(k, v);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { key: env.RAJAONGKIR_API_KEY, ...(init.headers ?? {}) },
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

const cleanEtd = (etd: string) =>
  (etd ?? '').replace(/\s*(hari|days?)\s*/gi, '').trim();

export const shippingService = {
  isEnabled,

  // Search domestic destinations (down to sub-district level) by free text.
  searchDestinations: async (search: string): Promise<Destination[]> => {
    ensureEnabled();
    const data = await call<KoDestination[]>('/destination/domestic-destination', {
      query: { search, limit: '30', offset: '0' },
    });
    return (data ?? []).map((d) => ({
      id: String(d.id),
      label: d.label,
      province: d.province_name,
      city: d.city_name,
      district: d.district_name,
      subdistrict: d.subdistrict_name,
      zipCode: d.zip_code,
    }));
  },

  // Calculate shipping cost between two destination ids for a given weight.
  // Komerce returns all requested couriers in a single call.
  calculateCost: async (params: {
    originId: string;
    destinationId: string;
    weight: number; // grams
  }): Promise<ShippingOption[]> => {
    ensureEnabled();
    const weight = Math.max(1, Math.round(params.weight));
    const courier = env.RAJAONGKIR_COURIERS.split(':')
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean)
      .join(':');

    const data = await call<KoCost[]>('/calculate/domestic-cost', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        origin: params.originId,
        destination: params.destinationId,
        weight: String(weight),
        courier,
      }).toString(),
    });

    const options: ShippingOption[] = (data ?? []).map((c) => ({
      courier: c.code,
      courierName: c.name,
      service: c.service,
      description: c.description,
      cost: c.cost,
      etd: cleanEtd(c.etd),
    }));

    if (options.length === 0) {
      throw badRequest(
        'Tidak ada layanan pengiriman yang tersedia untuk tujuan ini.',
      );
    }
    options.sort((a, b) => a.cost - b.cost);
    return options;
  },

  // Track a shipment by its waybill/resi number for a given courier code.
  trackWaybill: async (params: {
    waybill: string;
    courier: string;
  }): Promise<TrackingInfo> => {
    ensureEnabled();
    const courier = params.courier.trim().toLowerCase();
    const awb = params.waybill.trim();
    if (!awb) throw badRequest('Nomor resi tidak boleh kosong.');
    if (!courier) throw badRequest('Kurir pengiriman belum diketahui untuk pesanan ini.');

    const data = await call<KoTrackResponse>('/track/waybill', {
      method: 'POST',
      query: { awb, courier },
    });

    const s = data?.summary;
    const d = data?.delivery_status;
    const history: TrackingStep[] = (data?.manifest ?? []).map((m) => ({
      date: m.manifest_date,
      time: m.manifest_time,
      description: m.manifest_description,
      location: m.city_name,
    }));
    // Komerce returns the manifest oldest-first; show newest first.
    history.reverse();

    return {
      waybill: s?.waybill_number || awb,
      courier,
      courierName: s?.courier_name || courier.toUpperCase(),
      service: s?.service_code || '',
      shipper: s?.shipper_name || '',
      receiver: s?.receiver_name || '',
      origin: s?.origin || '',
      destination: s?.destination || '',
      status: d?.status || s?.status || '',
      delivered: Boolean(data?.delivered),
      podReceiver: d?.pod_receiver || null,
      podDate: d?.pod_date || null,
      history,
    };
  },
};
