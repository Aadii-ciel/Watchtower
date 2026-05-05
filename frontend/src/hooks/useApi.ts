import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error(`Error fetching ${url}`);
  return res.json();
});

export function useConfig() {
  return useSWR('/api/config', fetcher);
}

export function useGlobalNews() {
  return useSWR('/api/news/global', fetcher);
}

export function useLocalNews(city?: string, country?: string) {
  const query = new URLSearchParams();
  if (city) query.append('city', city);
  if (country) query.append('country', country);
  
  const queryString = query.toString();
  return useSWR(`/api/news/local${queryString ? `?${queryString}` : ''}`, fetcher);
}

export function useCryptoMarkets() {
  return useSWR('/api/markets/crypto', fetcher);
}

export function useStockMarkets() {
  return useSWR('/api/markets/stocks', fetcher);
}

export function useCommodityMarkets() {
  return useSWR('/api/markets/commodities', fetcher);
}

export function usePolymarket() {
  return useSWR('/api/markets/polymarket', fetcher);
}

export function useWeather(lat?: number, lon?: number, city?: string) {
  const query = new URLSearchParams();
  if (lat) query.append('lat', lat.toString());
  if (lon) query.append('lon', lon.toString());
  if (city) query.append('city', city);
  
  const queryString = query.toString();
  return useSWR(`/api/weather${queryString ? `?${queryString}` : ''}`, fetcher);
}

export async function generateGlobalBrief(newsItems: any[], forceRefresh = false) {
  const res = await fetch('/api/intel/brief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ news: newsItems, force_refresh: forceRefresh })
  });
  if (!res.ok) throw new Error('Failed to generate global intel brief');
  return res.json();
}

export async function generateLocalBrief(data: { city: string, news: any[], conditions: any, forecast: any[], force_refresh?: boolean }) {
  const res = await fetch('/api/intel/local-brief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      city: data.city,
      news: data.news,
      conditions: data.conditions,
      forecast: data.forecast,
      force_refresh: data.force_refresh || false
    })
  });
  if (!res.ok) throw new Error('Failed to generate local intel brief');
  return res.json();
}

export function useFundingIntel(source: string) {
  const query = new URLSearchParams();
  if (source) query.append('source', source);
  const queryString = query.toString();
  // Don't fetch if no source is provided
  return useSWR(source ? `/api/intel/funding?${queryString}` : null, fetcher, {
    revalidateOnFocus: false, // Don't constantly ping LLMs
    dedupingInterval: 600000 // Cache locally for 10 minutes
  });
}
