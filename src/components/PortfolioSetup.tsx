import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import type { StockHolding } from '../types/portfolio';
import { TrendingUp, ArrowRight, DollarSign } from 'lucide-react';

interface PortfolioSetupProps {
  onSave: (marketPosition: number, stocks: StockHolding[]) => void;
}

export const PortfolioSetup: React.FC<PortfolioSetupProps> = observer(({ onSave }) => {
  const [marketPosition, setMarketPosition] = useState<string>('10000');
  const [stocks, setStocks] = useState<StockHolding[]>([
    { symbol: 'META', shares: 26 },
    { symbol: 'AMZN', shares: 26 },
    { symbol: 'GOOGL', shares: 40 },
    { symbol: 'PYPL', shares: 96 },
    { symbol: 'DUOL', shares: 12 },
  ]);

  const handleStockChange = (index: number, field: 'symbol' | 'shares', value: string | number) => {
    const newStocks = [...stocks];
    if (field === 'symbol') {
      newStocks[index].symbol = (value as string).toUpperCase();
    } else {
      newStocks[index].shares = typeof value === 'number' ? value : parseFloat(value) || 0;
    }
    setStocks(newStocks);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const position = parseFloat(marketPosition) || 0;
    const validStocks = stocks.filter(s => s.symbol && s.shares > 0);

    if (position <= 0 && validStocks.length === 0) {
      alert('Please enter at least a market position or one stock holding.');
      return;
    }

    onSave(position, validStocks);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8 animate-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/20 mb-4">
            <TrendingUp size={28} className="text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-100 mb-2">Portfolio Setup</h1>
          <p className="text-neutral-400 text-sm">Configure your initial holdings to begin tracking</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 animate-in">
          {/* Market Position Section */}
          <section className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
            <div className="px-5 py-3 border-b border-neutral-800 flex items-center gap-2">
              <DollarSign size={16} className="text-cyan-400" />
              <h2 className="text-sm font-semibold text-neutral-100 uppercase tracking-wide">Market Position</h2>
              <span className="text-xs text-neutral-500 font-mono">S&P 500 / VOO</span>
            </div>
            
            <div className="p-5">
              <label htmlFor="marketPosition" className="block text-xs text-neutral-500 uppercase tracking-wider mb-2">
                Dollar Value
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-lg">$</span>
                <input
                  type="number"
                  id="marketPosition"
                  value={marketPosition}
                  onChange={(e) => setMarketPosition(e.target.value)}
                  placeholder="10000"
                  step="0.01"
                  min="0"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-3 text-neutral-100 font-mono text-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-neutral-700 hover:border-neutral-700"
                />
              </div>
            </div>
          </section>

          {/* Stock Holdings Section */}
          <section className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
            <div className="px-5 py-3 border-b border-neutral-800 flex items-center gap-2">
              <TrendingUp size={16} className="text-cyan-400" />
              <h2 className="text-sm font-semibold text-neutral-100 uppercase tracking-wide">Stock Holdings</h2>
              <span className="text-xs text-neutral-500">Up to 5 stocks</span>
            </div>
            
            <div className="p-5">
              <div className="space-y-3">
                {stocks.map((stock, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-1 text-neutral-600 text-sm font-medium text-center">
                      {index + 1}
                    </div>
                    <div className="col-span-6">
                      <input
                        type="text"
                        value={stock.symbol}
                        onChange={(e) => handleStockChange(index, 'symbol', e.target.value)}
                        placeholder="SYMBOL"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 font-mono uppercase focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-neutral-700 hover:border-neutral-700 text-sm"
                      />
                    </div>
                    <div className="col-span-5">
                      <input
                        type="number"
                        value={stock.shares || ''}
                        onChange={(e) => handleStockChange(index, 'shares', e.target.value)}
                        placeholder="Shares"
                        step="0.01"
                        min="0"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-neutral-700 hover:border-neutral-700 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex justify-center pt-2">
            <button 
              type="submit" 
              className="group bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-6 py-3 font-semibold text-sm flex items-center gap-2 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-300 border border-cyan-500/50"
            >
              <span className="uppercase tracking-wider">Start Tracking</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
