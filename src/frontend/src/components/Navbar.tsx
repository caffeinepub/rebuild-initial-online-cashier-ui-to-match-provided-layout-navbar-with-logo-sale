import { Package, FileText, Receipt, FileBarChart, UserCheck, ChevronDown, LayoutDashboard, DollarSign } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type View = 'dashboard' | 'products' | 'inventory' | 'transactions' | 'expenses' | 'salesReport' | 'inventoryReport' | 'expenseReport';

interface NavbarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' as View },
  { id: 'produk', label: 'Produk', icon: Package, view: 'products' as View },
  { id: 'inventori', label: 'Inventori', icon: FileText, view: 'inventory' as View },
  { id: 'transaksi', label: 'Transaksi', icon: Receipt, view: 'transactions' as View },
  { id: 'pengeluaran', label: 'Pengeluaran', icon: DollarSign, view: 'expenses' as View },
  { id: 'laporan', label: 'Laporan', icon: FileBarChart, view: null },
  { id: 'absensi', label: 'Absensi', icon: UserCheck, view: null },
];

const laporanSubmenuItems = [
  { id: 'laporan-penjualan', label: 'Laporan Penjualan', view: 'salesReport' as View },
  { id: 'laporan-inventori', label: 'Laporan Inventori', view: 'inventoryReport' as View },
  { id: 'laporan-pengeluaran', label: 'Laporan Pengeluaran', view: 'expenseReport' as View },
  { id: 'laporan-absensi', label: 'Laporan Absensi', view: null },
];

export default function Navbar({ currentView, onViewChange }: NavbarProps) {
  const [laporanOpen, setLaporanOpen] = useState(false);

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top section with logo and title */}
        <div className="flex items-center gap-4 py-4">
          <img
            src="/assets/Logo Natea Fresh Green.png"
            alt="Natea Fresh Logo"
            className="h-12 w-auto"
          />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-foreground leading-tight">
              Program Kasir Online Terpadu
            </h1>
            <p className="text-sm text-muted-foreground">Manajemen Usaha Natea Fresh</p>
          </div>
        </div>

        {/* Navigation menu */}
        <nav className="border-t border-border">
          <ul className="flex items-center gap-1 overflow-x-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.view === currentView;
              const isClickable = item.view !== null;
              
              // Special handling for Laporan menu item with dropdown
              if (item.id === 'laporan') {
                return (
                  <li key={item.id}>
                    <DropdownMenu open={laporanOpen} onOpenChange={setLaporanOpen}>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap text-muted-foreground hover:text-primary hover:bg-accent/50 cursor-pointer"
                          type="button"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        {laporanSubmenuItems.map((subItem) => (
                          <DropdownMenuItem
                            key={subItem.id}
                            onClick={() => {
                              if (subItem.view) {
                                onViewChange(subItem.view);
                                setLaporanOpen(false);
                              } else {
                                console.log(`Clicked: ${subItem.label}`);
                              }
                            }}
                            disabled={!subItem.view}
                          >
                            {subItem.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                );
              }
              
              return (
                <li key={item.id}>
                  <button
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'text-primary bg-accent border-b-2 border-primary'
                        : isClickable
                        ? 'text-muted-foreground hover:text-primary hover:bg-accent/50 cursor-pointer'
                        : 'text-muted-foreground/50 cursor-default'
                    }`}
                    type="button"
                    onClick={() => {
                      if (item.view) {
                        onViewChange(item.view);
                      }
                    }}
                    disabled={!isClickable}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
