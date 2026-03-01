import { makeAutoObservable, runInAction } from 'mobx';
import type { StockHolding, PriceData, PortfolioData } from '../types/portfolio';
import { getDocument, setDocument } from '../data/firestoreService';
import { getMultipleQuotes } from '../services/finnhubService';

// Test mode configuration
const TEST_MODE = true; // Set to false to use real API
const TEST_SPEED = 6000; // 6 seconds (10x faster than 60 seconds)

interface TestDataRow {
  Time: string;
  VOO: number;
  META: number;
  GOOGL: number;
  AMZN: number;
  PYPL: number;
  DUOL: number;
}

class PortfolioStore {
  marketPosition: number = 0;
  stocks: StockHolding[] = [];
  marketPriceHistory: PriceData[] = [];
  stocksPriceHistory: PriceData[] = [];
  lastUpdated: number = 0;
  isLoading: boolean = false;
  isInitialized: boolean = false;
  updateInterval: number | null = null;
  
  // Test mode state
  testMode: boolean = TEST_MODE;
  testData: TestDataRow[] = [];
  testDataIndex: number = 0;
  initialVooPrice: number = 0;

  constructor() {
    makeAutoObservable(this);
  }

  async initialize() {
    if (this.isInitialized) return;
    
    this.isLoading = true;
    try {
      // Load test data if in test mode
      if (this.testMode) {
        await this.loadTestData();
      }

      // Load portfolio data from Firestore
      const portfolioData = await getDocument<PortfolioData>(
        'portfolios',
        'main'
      );

      if (portfolioData) {
        runInAction(() => {
          this.marketPosition = portfolioData.marketPosition || 0;
          this.stocks = portfolioData.stocks || [];
          // Don't restore history in test mode - start fresh
          if (!this.testMode) {
            this.marketPriceHistory = portfolioData.marketPriceHistory || [];
            this.stocksPriceHistory = portfolioData.stocksPriceHistory || [];
          }
          this.lastUpdated = portfolioData.lastUpdated || 0;
          this.isInitialized = true;
        });
      } else {
        runInAction(() => {
          this.isInitialized = true;
        });
      }

      // Start the update interval if we have a portfolio set up
      if (this.stocks.length > 0 || this.marketPosition > 0) {
        this.startUpdates();
      }
    } catch (error) {
      console.error('Error initializing portfolio:', error);
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async loadTestData() {
    try {
      const response = await fetch('/testData.csv');
      const csvText = await response.text();
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',');
      
      this.testData = lines.slice(1).map(line => {
        const values = line.split(',');
        const row: Record<string, string | number> = {};
        headers.forEach((header, index) => {
          row[header.trim()] = index === 0 ? values[index] : parseFloat(values[index]);
        });
        return row as unknown as TestDataRow;
      });
      
      // Store initial VOO price for share calculation
      if (this.testData.length > 0) {
        this.initialVooPrice = this.testData[0].VOO;
      }
      
      console.log(`[TestMode] Loaded ${this.testData.length} rows of test data`);
    } catch (error) {
      console.error('Error loading test data:', error);
    }
  }

  async savePortfolioSettings(marketPosition: number, stocks: StockHolding[]) {
    this.marketPosition = marketPosition;
    this.stocks = stocks;
    
    // Reset price history when portfolio changes
    this.marketPriceHistory = [];
    this.stocksPriceHistory = [];
    this.testDataIndex = 0;

    await this.saveToFirestore();
    
    // Start updates
    this.startUpdates();
    
    // Fetch initial prices
    if (this.testMode) {
      this.updatePricesFromTestData();
    } else {
      await this.updatePrices();
    }
  }

  updatePricesFromTestData() {
    if (this.testDataIndex >= this.testData.length) {
      console.log('[TestMode] Reached end of test data, stopping updates');
      this.stopUpdates();
      return;
    }

    const row = this.testData[this.testDataIndex];
    const timestamp = Date.now();

    runInAction(() => {
      // Update market position value (VOO)
      if (this.marketPosition > 0) {
        const vooPrice = row.VOO;
        const vooShares = this.marketPosition / this.initialVooPrice;
        const currentValue = vooShares * vooPrice;
        
        this.marketPriceHistory.push({
          timestamp,
          price: vooPrice,
          value: currentValue,
        });
      }

      // Update stocks portfolio value
      if (this.stocks.length > 0) {
        let totalValue = 0;
        
        this.stocks.forEach(stock => {
          const price = row[stock.symbol as keyof TestDataRow] as number;
          if (price) {
            totalValue += price * stock.shares;
          }
        });

        this.stocksPriceHistory.push({
          timestamp,
          price: 0,
          value: totalValue,
        });
      }

      this.lastUpdated = timestamp;
      this.testDataIndex++;
    });

    console.log(`[TestMode] Updated with row ${this.testDataIndex}/${this.testData.length} (${row.Time})`);
  }

  async updatePrices() {
    try {
      const symbols = [...this.stocks.map(s => s.symbol)];
      if (this.marketPosition > 0) {
        symbols.push('VOO');
      }

      if (symbols.length === 0) return;

      const quotes = await getMultipleQuotes(symbols);
      const timestamp = Date.now();

      runInAction(() => {
        // Update market position value
        if (this.marketPosition > 0 && quotes['VOO']) {
          const vooQuote = quotes['VOO'];
          const vooShares = this.marketPosition / vooQuote.pc; // Calculate shares based on previous close
          const currentValue = vooShares * vooQuote.c;
          
          this.marketPriceHistory.push({
            timestamp,
            price: vooQuote.c,
            value: currentValue,
          });
        }

        // Update stocks portfolio value
        if (this.stocks.length > 0) {
          let totalValue = 0;
          
          this.stocks.forEach(stock => {
            const quote = quotes[stock.symbol];
            if (quote) {
              totalValue += quote.c * stock.shares;
            }
          });

          this.stocksPriceHistory.push({
            timestamp,
            price: 0, // Not applicable for combined portfolio
            value: totalValue,
          });
        }

        this.lastUpdated = timestamp;
      });

      await this.saveToFirestore();
    } catch (error) {
      console.error('Error updating prices:', error);
    }
  }

  startUpdates() {
    // Clear existing interval if any
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    if (this.testMode) {
      // Test mode: Update every 6 seconds (10x speed)
      console.log(`[TestMode] Starting updates at ${TEST_SPEED}ms intervals`);
      this.updateInterval = setInterval(() => {
        this.updatePricesFromTestData();
      }, TEST_SPEED);
    } else {
      // Normal mode: Update every minute (60000 ms)
      this.updateInterval = setInterval(() => {
        this.updatePrices();
      }, 60000);
    }
  }

  stopUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async saveToFirestore() {
    // Skip saving in test mode to keep test data clean
    if (this.testMode) return;

    try {
      const portfolioData: PortfolioData = {
        marketPosition: this.marketPosition,
        stocks: this.stocks,
        marketPriceHistory: this.marketPriceHistory,
        stocksPriceHistory: this.stocksPriceHistory,
        lastUpdated: this.lastUpdated,
      };

      await setDocument('portfolios', 'main', portfolioData);
    } catch (error) {
      console.error('Error saving to Firestore:', error);
    }
  }

  get marketReturn(): number {
    if (this.marketPriceHistory.length === 0) return 0;
    const latest = this.marketPriceHistory[this.marketPriceHistory.length - 1];
    return latest.value - this.marketPosition;
  }

  get stocksReturn(): number {
    if (this.stocksPriceHistory.length === 0) return 0;
    
    // Calculate initial value based on first recorded prices
    const first = this.stocksPriceHistory[0];
    const latest = this.stocksPriceHistory[this.stocksPriceHistory.length - 1];
    
    return latest.value - first.value;
  }

  get hasPortfolio(): boolean {
    return this.stocks.length > 0 || this.marketPosition > 0;
  }

  clearPortfolio() {
    this.stopUpdates();
    this.marketPosition = 0;
    this.stocks = [];
    this.marketPriceHistory = [];
    this.stocksPriceHistory = [];
    this.lastUpdated = 0;
    this.testDataIndex = 0;
    this.saveToFirestore();
  }

  // Toggle test mode
  setTestMode(enabled: boolean) {
    this.testMode = enabled;
    if (enabled) {
      this.loadTestData();
    }
  }
}

export const portfolioStore = new PortfolioStore();
