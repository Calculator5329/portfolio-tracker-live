import type { QuoteResponse } from '../types/portfolio';

const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY as string;
const BASE_URL = 'https://finnhub.io/api/v1';

export const getQuote = async (symbol: string): Promise<QuoteResponse | null> => {
  try {
    const url = `${BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    console.log(`[Finnhub] Fetching quote for ${symbol}:`, url);
    
    const response = await fetch(url);
    
    console.log(`[Finnhub] Response status for ${symbol}:`, response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch quote for ${symbol}`);
    }
    
    const data = await response.json();
    console.log(`[Finnhub] Data received for ${symbol}:`, data);
    
    return data as QuoteResponse;
  } catch (error) {
    console.error(`[Finnhub] Error fetching quote for ${symbol}:`, error);
    return null;
  }
};

export const getMultipleQuotes = async (
  symbols: string[]
): Promise<Record<string, QuoteResponse>> => {
  console.log(`[Finnhub] Fetching quotes for symbols:`, symbols);
  
  const quotes: Record<string, QuoteResponse> = {};
  
  // Fetch all quotes in parallel
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      const quote = await getQuote(symbol);
      return { symbol, quote };
    })
  );
  
  // Build the quotes object
  results.forEach(({ symbol, quote }) => {
    if (quote) {
      quotes[symbol] = quote;
    }
  });
  
  console.log(`[Finnhub] All quotes fetched:`, quotes);
  
  return quotes;
};

