import { useEffect, useState } from 'react';
import { LayoutDashboard, TrendingUp, Search, Bell, Sparkles } from 'lucide-react';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import SalesPage from './pages/SalesPage';
import IntelligencePage from './pages/IntelligencePage';
import AlertsPage from './pages/AlertsPage';
import { getDashboard } from './services/api';
import './index.css';

type Page = 'dashboard' | 'sales' | 'intelligence' | 'alerts';

const NAV = [
  { id: 'dashboard',     label: 'Dashboard',       Icon: LayoutDashboard },
  { id: 'sales',         label: 'Sales Analysis',  Icon: TrendingUp       },
  { id: 'intelligence',  label: 'Intelligence',    Icon: Search           },
  { id: 'alerts',        label: 'Alerts',          Icon: Bell, badge: 2  },
] as Array<{ id: Page, label: string, Icon: any, badge?: number }>;

function Sidebar({ 
  page, setPage, brand, alertsCount 
}: { 
  page: Page; setPage: (p: Page) => void; brand: string; alertsCount: number;
}) {
  const initials = brand.slice(0, 2).toUpperCase();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">✦</div>
          <div>
            <div className="logo-text">MarketSense AI</div>
            <div className="logo-sub">D2C Intelligence Platform</div>
          </div>
        </div>
      </div>



      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        {NAV.map(({ id, label, Icon, badge }) => (
          <div
            key={id}
            className={`nav-item ${page === id ? 'active' : ''}`}
            onClick={() => setPage(id as Page)}
          >
            <Icon size={17} className="nav-icon" />
            {label}
            {id === 'alerts' && alertsCount > 0 ? <span className="nav-badge">{alertsCount}</span> : (badge && <span className="nav-badge">{badge}</span>)}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="brand-pill">
          <div className="brand-avatar">{initials}</div>
          <div>
            <div className="brand-name">{brand}</div>
            <div className="brand-plan">Growth Plan · Active</div>
          </div>
          <Sparkles size={14} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [brand, setBrand] = useState('GlowSkin Co.');
  const [page, setPage] = useState<Page>('dashboard');
  const [alertsCount, setAlertsCount] = useState(0);

  useEffect(() => {
    if (onboarded) {
      getDashboard().then(d => {
        if (d?.recent_alerts) {
          setAlertsCount(d.recent_alerts.length);
        }
      });
    }
  }, [onboarded]);

  if (!onboarded) {
    return (
      <OnboardingPage
        onComplete={(b) => {
          setBrand(b || 'GlowSkin Co.');
          setOnboarded(true);
        }}
      />
    );
  }

  return (
    <div className="app-layout">
      <Sidebar 
        page={page} 
        setPage={setPage} 
        brand={brand}
        alertsCount={alertsCount}
      />
      <main className="main-content">
        {page === 'dashboard'    && <DashboardPage />}
        {page === 'sales'        && <SalesPage />}
        {page === 'intelligence' && <IntelligencePage />}
        {page === 'alerts'       && <AlertsPage />}
      </main>
    </div>
  );
}
