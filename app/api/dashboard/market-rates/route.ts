import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

type MarketRates = {
  usd: { buying: number; selling: number };
  eur: { buying: number; selling: number };
  gramAltin: { buying: number; selling: number };
  updatedAt: string;
};

const globalForRates = globalThis as unknown as {
  marketRatesCache: { data: MarketRates; fetchedAt: number } | undefined;
};

const CACHE_TTL_MS = 15 * 60 * 1000;

async function fetchMarketRates(): Promise<MarketRates> {
  const res = await fetch("https://finans.truncgil.com/v4/today.json", {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Truncgil isteği başarısız: ${res.status}`);
  }
  const data = await res.json();

  return {
    usd: { buying: Number(data.USD.Buying), selling: Number(data.USD.Selling) },
    eur: { buying: Number(data.EUR.Buying), selling: Number(data.EUR.Selling) },
    gramAltin: { buying: Number(data.GRA.Buying), selling: Number(data.GRA.Selling) },
    updatedAt: data.Update_Date,
  };
}

async function fetchMarketRatesWithRetry(): Promise<MarketRates> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fetchMarketRates();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  throw lastErr;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const cache = globalForRates.marketRatesCache;
  const isFresh = cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS;

  if (isFresh) {
    return NextResponse.json(cache.data);
  }

  try {
    const data = await fetchMarketRatesWithRetry();
    globalForRates.marketRatesCache = { data, fetchedAt: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    console.error("Piyasa verisi çekilemedi:", err);
    if (cache) {
      return NextResponse.json(cache.data);
    }
    return NextResponse.json({ error: "Piyasa verisi alınamadı." }, { status: 502 });
  }
}
