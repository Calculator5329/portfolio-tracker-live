import React from 'react';
import { observer } from 'mobx-react-lite';
import { portfolioStore } from '../stores/PortfolioStore';
import { LineChart } from './LineChart';
import { Trash2, TrendingUp, LayoutDashboard, Clock, Activity, DollarSign, FlaskConical } from 'lucide-react';

export const Dashboard: React.FC = observer(() => {
  const {
    marketPosition,
    stocks,
    marketPriceHistory,
    stocksPriceHistory,
    marketReturn,
    stocksReturn,
    lastUpdated,
    testMode,
    testDataIndex,
    testData,
  } = portfolioStore;

  const formatCurrency = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}$${value.toFixed(2)}`;
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getReturnColor = (value: number) => {
    return value >= 0 ? '#22d3ee' : '#f43f5e'; // cyan-400 : rose-500
  };
  
  const getReturnTextClass = (value: number) => {
    return value >= 0 ? 'text-cyan-400' : 'text-rose-500';
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800 flex-shrink-0">
        <div className="px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <LayoutDashboard size={22} className="text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-neutral-100">Portfolio Tracker</h1>
                  {testMode && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
                      <FlaskConical size={12} />
                      TEST MODE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} />
                    Updated: {formatTime(lastUpdated)}
                  </span>
                  {testMode && testData.length > 0 && (
                    <span className="text-amber-400/70 font-mono">
                      Row {testDataIndex}/{testData.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <button 
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/30"
              onClick={() => {
                if (window.confirm('Are you sure you want to reset your portfolio?')) {
                  portfolioStore.clearPortfolio();
                  window.location.reload();
                }
              }}
            >
              <Trash2 size={16} />
              Reset Portfolio
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Stacked vertically */}
      <main className="flex-1 px-8 py-6 flex flex-col gap-6 overflow-auto">
        
        {/* Market Section - Top Half */}
        <section className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden hover:border-cyan-500/30 transition-colors duration-300 flex flex-col flex-1 min-h-0">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-neutral-800 flex-shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={18} className="text-cyan-400" />
                  <h2 className="text-base font-semibold text-neutral-100 uppercase tracking-wide">Market Holdings</h2>
                </div>
                <span className="text-xs text-neutral-500 font-mono">S&P 500 Index Fund (VOO)</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-neutral-500 uppercase tracking-wider block">Initial Position</span>
                <span className="text-xl font-bold text-neutral-100 font-mono">${marketPosition.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
          
          {/* Chart - Takes available space */}
          <div className="flex-1 flex items-center justify-center min-h-0 p-6 bg-neutral-950/50">
            {marketPosition > 0 ? (
              <LineChart 
                data={marketPriceHistory} 
                color={getReturnColor(marketReturn)}
                initialValue={marketPosition}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-neutral-600 border border-neutral-800 rounded-lg bg-neutral-900">
                <span className="text-sm">No market position</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 divide-x divide-neutral-800 border-t border-neutral-800 flex-shrink-0">
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={14} className="text-neutral-500" />
                <span className="text-xs text-neutral-500 uppercase tracking-wider">Return</span>
              </div>
              <p className={`text-3xl font-bold font-mono ${getReturnTextClass(marketReturn)}`}>
                {formatCurrency(marketReturn)}
              </p>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={14} className="text-neutral-500" />
                <span className="text-xs text-neutral-500 uppercase tracking-wider">Current Value</span>
              </div>
              <p className="text-3xl font-bold text-neutral-100 font-mono">
                ${marketPriceHistory.length > 0 ? marketPriceHistory[marketPriceHistory.length - 1].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : marketPosition.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </section>

        {/* Stocks Section - Bottom Half */}
        <section className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden hover:border-cyan-500/30 transition-colors duration-300 flex flex-col flex-1 min-h-0">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-neutral-800 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-cyan-400" />
              <h2 className="text-base font-semibold text-neutral-100 uppercase tracking-wide">Stock Portfolio</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {stocks.map((stock, index) => (
                <span key={index} className="text-xs px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 font-mono">
                  {stock.symbol}: {stock.shares}
                </span>
              ))}
            </div>
          </div>
          
          {/* Chart - Takes available space */}
          <div className="flex-1 flex items-center justify-center min-h-0 p-6 bg-neutral-950/50">
            {stocks.length > 0 ? (
              <LineChart 
                data={stocksPriceHistory} 
                color={getReturnColor(stocksReturn)}
                initialValue={stocksPriceHistory[0]?.value || 0}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-neutral-600 border border-neutral-800 rounded-lg bg-neutral-900">
                <span className="text-sm">No stock holdings</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 divide-x divide-neutral-800 border-t border-neutral-800 flex-shrink-0">
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={14} className="text-neutral-500" />
                <span className="text-xs text-neutral-500 uppercase tracking-wider">Return</span>
              </div>
              <p className={`text-3xl font-bold font-mono ${getReturnTextClass(stocksReturn)}`}>
                {formatCurrency(stocksReturn)}
              </p>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={14} className="text-neutral-500" />
                <span className="text-xs text-neutral-500 uppercase tracking-wider">Current Value</span>
              </div>
              <p className="text-3xl font-bold text-neutral-100 font-mono">
                ${stocksPriceHistory.length > 0 ? stocksPriceHistory[stocksPriceHistory.length - 1].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer Stats */}
      <footer className="px-8 py-4 flex justify-center flex-shrink-0 border-t border-neutral-800">
        <div className="inline-flex items-center gap-4 px-5 py-2.5 bg-neutral-900 rounded-lg border border-neutral-800 text-xs text-neutral-500">
          <span>Data Points: <span className="text-neutral-400 font-mono ml-1">Market ({marketPriceHistory.length})</span></span>
          <span className="text-neutral-700">•</span>
          <span><span className="text-neutral-400 font-mono">Stocks ({stocksPriceHistory.length})</span></span>
          {testMode && (
            <>
              <span className="text-neutral-700">•</span>
              <span className="text-amber-400/70">10x Speed</span>
            </>
          )}
        </div>
      </footer>
    </div>
  );
});
