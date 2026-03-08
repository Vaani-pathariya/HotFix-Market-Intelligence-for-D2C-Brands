import { useEffect, useState } from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { getDashboard } from '../services/api';

interface Alert {
  id: number;
  severity: string;
  sku: string;
  message: string;
  time: string;
  detail: string;
}

function SeverityIcon({ s }: { s: string }) {
  if (s === 'critical') return <AlertTriangle size={18} style={{ color: '#ef4444' }} />;
  if (s === 'warning') return <AlertTriangle size={18} style={{ color: '#f59e0b' }} />;
  return <Info size={18} style={{ color: '#6366f1' }} />;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [resolved, setResolved] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  useEffect(() => {
    getDashboard().then(d => {
      if (d?.recent_alerts) setAlerts(d.recent_alerts);
    });
  }, []);

  const toggle = (id: number) => {
    setResolved(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filtered = alerts.filter(a => filter === 'all' || a.severity === filter);

  const counts = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Alerts</div>
          <div className="page-subtitle">All detected anomalies and market signals</div>
        </div>
        <div className="date-badge">{alerts.length} total · {resolved.size} resolved</div>
      </div>

      <div className="page-body">
        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          <div className="kpi-card" style={{ borderColor: 'rgba(239,68,68,0.3)', cursor: 'pointer' }} onClick={() => setFilter('critical')}>
            <div className="kpi-label">Critical</div>
            <div className="kpi-value" style={{ color: '#ef4444' }}>{counts.critical}</div>
            <div className="kpi-change down"><AlertTriangle size={13} /> Requires immediate action</div>
          </div>
          <div className="kpi-card" style={{ borderColor: 'rgba(245,158,11,0.3)', cursor: 'pointer' }} onClick={() => setFilter('warning')}>
            <div className="kpi-label">Warnings</div>
            <div className="kpi-value" style={{ color: '#f59e0b' }}>{counts.warning}</div>
            <div className="kpi-change neutral">Monitor closely</div>
          </div>
          <div className="kpi-card" style={{ borderColor: 'rgba(99,102,241,0.3)', cursor: 'pointer' }} onClick={() => setFilter('info')}>
            <div className="kpi-label">Info</div>
            <div className="kpi-value" style={{ color: 'var(--accent-light)' }}>{counts.info}</div>
            <div className="kpi-change neutral">Opportunities & updates</div>
          </div>
        </div>

        {/* Filters */}
        <div className="tab-bar">
          {(['all', 'critical', 'warning', 'info'] as const).map(f => (
            <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}{f === 'all' ? ` (${alerts.length})` : ` (${counts[f as keyof typeof counts]})`}
            </button>
          ))}
        </div>

        {/* Alert List */}
        <div className="card">
          <div className="alert-list">
            {filtered.map(a => (
              <div key={a.id} className={`alert-item ${resolved.has(a.id) ? 'resolved' : ''}`}>
                <div className={`alert-icon ${a.severity}`}>
                  {resolved.has(a.id) ? <CheckCircle size={18} style={{ color: '#22c55e' }} /> : <SeverityIcon s={a.severity} />}
                </div>
                <div className="alert-body">
                  <div className="alert-title">{a.message}</div>
                  <div className="alert-meta">
                    <span style={{ background: 'rgba(255,255,255,0.05)', padding: '1px 7px', borderRadius: 4, fontSize: 11 }}>{a.sku}</span>
                    <span>{a.time}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>· {a.detail}</span>
                  </div>
                </div>
                <button
                  className="alert-resolve-btn"
                  onClick={() => toggle(a.id)}
                >
                  {resolved.has(a.id) ? 'Unresolve' : 'Resolve'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
