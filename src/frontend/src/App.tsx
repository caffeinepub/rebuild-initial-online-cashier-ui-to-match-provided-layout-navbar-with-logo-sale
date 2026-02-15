import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ProductsPage from './components/ProductsPage';
import InventoryPage from './components/InventoryPage';
import TransactionPage from './components/TransactionPage';
import { Heart } from 'lucide-react';

type View = 'dashboard' | 'products' | 'inventory' | 'transactions';

const queryClient = new QueryClient();

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Navbar currentView={currentView} onViewChange={setCurrentView} />
        <main className="container mx-auto px-4 py-8">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'products' && (
            <ProductsPage onNavigateDashboard={() => setCurrentView('dashboard')} />
          )}
          {currentView === 'inventory' && <InventoryPage />}
          {currentView === 'transactions' && <TransactionPage />}
        </main>
        <footer className="border-t border-border mt-16 py-6">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-1">
              © {new Date().getFullYear()} Dibuat dengan{' '}
              <Heart className="h-3 w-3 text-primary fill-primary inline" /> menggunakan{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                  typeof window !== 'undefined' ? window.location.hostname : 'kasir-online'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;
