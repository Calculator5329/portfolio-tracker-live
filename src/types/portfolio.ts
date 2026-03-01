export interface StockHolding {
  symbol: string;
  shares: number;
}

export interface PriceData {
  timestamp: number;
  price: number;
  value: number;
}

export interface PortfolioData {
  marketPosition: number; // Dollar value in VOO
  stocks: StockHolding[];
  marketPriceHistory: PriceData[];
  stocksPriceHistory: PriceData[];
  lastUpdated: number;
}

export interface QuoteResponse {
  c: number; // Current price
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

