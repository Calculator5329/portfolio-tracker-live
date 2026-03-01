import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { portfolioStore } from './stores/PortfolioStore';
import { PortfolioSetup } from './components/PortfolioSetup';
import { Dashboard } from './components/Dashboard';
import type { StockHolding } from './types/portfolio';
import { Loader2 } from 'lucide-react';

const App = observer(() => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await portfolioStore.initialize();
      setIsInitialized(true);
    };
    
    init();

    // Cleanup on unmount
    return () => {
      portfolioStore.stopUpdates();
    };
  }, []);

  const handleSavePortfolio = async (marketPosition: number, stocks: StockHolding[]) => {
    await portfolioStore.savePortfolioSettings(marketPosition, stocks);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-neutral-400">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mb-4" />
        <p className="text-sm tracking-wider uppercase font-medium">Initializing System...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-300 selection:bg-cyan-500/30">
      {!portfolioStore.hasPortfolio ? (
        <PortfolioSetup onSave={handleSavePortfolio} />
      ) : (
        <Dashboard />
      )}
    </div>
  );
});

export default App;
