import { useState } from 'react';
import { DashboardScreen } from './screens/DashboardScreen.js';
import { ShipmentListScreen } from './screens/ShipmentListScreen.js';
import { ShipmentDetailScreen } from './screens/ShipmentDetailScreen.js';
import { ShipmentForm, ShipmentFormData } from './components/ShipmentForm.js';
import { api } from './api/client.js';
import { ShieldCheck, LayoutDashboard, ListFilter, Plus } from 'lucide-react';

type Screen = 'dashboard' | 'list' | 'detail';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [listFilterTier, setListFilterTier] = useState<string>('all');

  // Quick Register Modal state
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectShipment = (id: string) => {
    setSelectedShipmentId(id);
    setCurrentScreen('detail');
  };

  const handleNavigateToList = (filterTier?: string) => {
    if (filterTier) {
      setListFilterTier(filterTier);
    } else {
      setListFilterTier('all');
    }
    setCurrentScreen('list');
  };

  const handleQuickCreateSubmit = async (data: ShipmentFormData) => {
    setIsCreating(true);
    try {
      const res = await api.createShipment(data);
      setIsQuickCreateOpen(false);
      // Navigate to detail of newly created shipment to show immediate scoring and prediction
      if (res.shipment?.id) {
        setSelectedShipmentId(res.shipment.id);
        setCurrentScreen('detail');
      } else {
        setCurrentScreen('list');
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div
              id="app-brand-logo"
              onClick={() => setCurrentScreen('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-slate-900 block leading-tight">
                  Risk Intelligence Platform
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block leading-tight">
                  Supply Chain & Logistics MVP
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden sm:flex items-center gap-1 ml-4 border-l border-slate-200 pl-4">
              <button
                id="nav-dashboard-btn"
                onClick={() => setCurrentScreen('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  currentScreen === 'dashboard'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                id="nav-shipments-btn"
                onClick={() => {
                  setListFilterTier('all');
                  setCurrentScreen('list');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  currentScreen === 'list'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Shipment Registry</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="header-create-shipment-btn"
              onClick={() => setIsQuickCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Shipment</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            onSelectShipment={handleSelectShipment}
            onNavigateToList={handleNavigateToList}
            onAddNewShipment={() => setIsQuickCreateOpen(true)}
          />
        )}

        {currentScreen === 'list' && (
          <ShipmentListScreen
            onSelectShipment={handleSelectShipment}
            initialRiskTier={listFilterTier}
          />
        )}

        {currentScreen === 'detail' && selectedShipmentId && (
          <ShipmentDetailScreen
            shipmentId={selectedShipmentId}
            onBack={() => setCurrentScreen('list')}
          />
        )}
      </main>

      {/* Shared Quick Create Form Modal */}
      {isQuickCreateOpen && (
        <ShipmentForm
          onSubmit={handleQuickCreateSubmit}
          onCancel={() => setIsQuickCreateOpen(false)}
          isSubmitting={isCreating}
        />
      )}
    </div>
  );
}
