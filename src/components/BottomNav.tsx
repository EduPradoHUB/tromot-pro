import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Package, ScanLine, Bookmark, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarcodeScannerDialog } from '@/components/BarcodeScannerDialog';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';

const items = [
  { name: 'Início', path: '/', icon: Home },
  { name: 'Produtos', path: '/manuais', icon: Package },
  { name: 'Salvos', path: '/salvos', icon: Bookmark },
  { name: 'Perfil', path: '/perfil', icon: User },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { findProductByBarcode } = useApp();
  const [scanOpen, setScanOpen] = useState(false);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleBarcodeDetected = async (barcode: string) => {
    setScanOpen(false);
    const product = await findProductByBarcode(barcode);
    if (product) {
      navigate(`/produto/${product.id}`);
    } else {
      toast({
        title: 'Produto não encontrado',
        description: `Nenhum produto encontrado com o código ${barcode}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="relative grid grid-cols-5 h-16">
          {items.slice(0, 2).map((item) => (
            <NavItem key={item.path} item={item} active={isActive(item.path)} />
          ))}

          {/* Central Scan FAB */}
          <div className="flex items-start justify-center">
            <button
              type="button"
              onClick={() => setScanOpen(true)}
              aria-label="Escanear código"
              className="relative -top-5 h-14 w-14 rounded-full text-primary-foreground bg-[linear-gradient(135deg,#C41E3A_0%,#9B1530_100%)] shadow-[0_6px_20px_rgba(196,30,58,0.5)] flex flex-col items-center justify-center active:scale-95 transition-transform"
            >
              <ScanLine className="h-6 w-6" />
              <span className="text-[10px] font-semibold mt-0.5">Escanear</span>
            </button>
          </div>

          {items.slice(2).map((item) => (
            <NavItem key={item.path} item={item} active={isActive(item.path)} />
          ))}
        </div>
      </nav>

      <BarcodeScannerDialog
        open={scanOpen}
        onOpenChange={setScanOpen}
        onBarcodeDetected={handleBarcodeDetected}
      />
    </>
  );
};

const NavItem: React.FC<{
  item: { name: string; path: string; icon: React.ComponentType<{ className?: string }> };
  active: boolean;
}> = ({ item, active }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <Icon className={cn('h-5 w-5', active && 'text-primary')} />
      <span>{item.name}</span>
    </Link>
  );
};