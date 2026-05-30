import { env } from '../../config/env.js';
import { badRequest, serviceUnavailable } from '../../lib/httpError.js';

// --- RajaOngkir (Starter) response shapes (only the bits we use) ---
interface RajaOngkirEnvelope<T> {
  rajaongkir: {
    status: { code: number; description: string };
    results: T;
  };
}

interface RoProvince {
  province_id: string;
  province: string;
}

interface RoCity {
  city_id: string;
  province_id: string;
  province: string;
  type: string;
  city_name: string;
  postal_code: string;
}

interface RoCostResult {
  code: string;
  name: string;
  costs: {
    service: string;
    description: string;
    cost: { value: number; etd: string; note: string }[];
  }[];
}

// --- Our normalized public shapes ---
export interface Province {
  id: string;
  name: string;
}

export interface City {
  id: string;
  provinceId: string;
  province: string;
  name: string;
  postalCode: string;
}

export interface ShippingOption {
  courier: string; // e.g. "jne"
  courierName: string; // e.g. "Jalur Nugraha Ekakurir (JNE)"
  service: string; // e.g. "REG"
  description: string; // e.g. "Layanan Reguler"
  cost: number; // IDR
  etd: string; // e.g. "2-3" (days), may be empty
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
  let body: RajaOngkirEnvelope<T> | undefined;
  try {
    body = text ? (JSON.parse(text) as RajaOngkirEnvelope<T>) : undefined;
  } catch {
    body = undefined;
  }

  const status = body?.rajaongkir?.status;
  if (!res.ok || !status || status.code !== 200) {
    const msg = status?.description ?? `Layanan ongkir error (${res.status})`;
    // 4xx from RajaOngkir is usually a bad request (invalid city/courier).
    throw badRequest(`Ongkir: ${msg}`);
  }
  return body!.rajaongkir.results;
}

export const shippingService = {
  isEnabled,

  getProvinces: async (): Promise<Province[]> => {
    ensureEnabled();
    const results = await call<RoProvince[]>('/province');
    return results.map((p) => ({ id: p.province_id, name: p.province }));
  },

  getCities: async (provinceId?: string): Promise<City[]> => {
    ensureEnabled();
    const results = await call<RoCity[]>('/city', {
      query: provinceId ? { province: provinceId } : {},
    });
    return results.map((c) => ({
      id: c.city_id,
      provinceId: c.province_id,
      province: c.province,
      name: `${c.type} ${c.city_name}`.trim(),
      postalCode: c.postal_code,
    }));
  },

  // RajaOngkir Starter only quotes one courier per request, so we fan out.
  calculateCost: async (params: {
    originCityId: string;
    destinationCityId: string;
    weight: number;
  }): Promise<ShippingOption[]> => {
    ensureEnabled();
    const weight = Math.max(1, Math.round(params.weight));
    const couriers = env.RAJAONGKIR_COURIERS.split(':')
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);

    const perCourier = await Promise.allSettled(
      couriers.map((courier) =>
        call<RoCostResult[]>('/cost', {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            origin: params.originCityId,
            destination: params.destinationCityId,
            weight: String(weight),
            courier,
          }).toString(),
        }),
      ),
    );

    const options: ShippingOption[] = [];
    for (const settled of perCourier) {
      if (settled.status !== 'fulfilled') continue;
      for (const result of settled.value) {
        for (const svc of result.costs) {
          const cost = svc.cost[0];
          if (!cost) continue;
          options.push({
            courier: result.code,
            courierName: result.name,
            service: svc.service,
            description: svc.description,
            cost: cost.value,
            etd: (cost.etd ?? '').replace(/\s*hari\s*/i, '').trim(),
          });
        }
      }
    }

    if (options.length === 0) {
      throw badRequest(
        'Tidak ada layanan pengiriman yang tersedia untuk tujuan ini.',
      );
    }
    options.sort((a, b) => a.cost - b.cost);
    return options;
  },
};
