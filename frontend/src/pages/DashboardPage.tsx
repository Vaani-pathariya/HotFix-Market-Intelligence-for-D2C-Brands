import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Star, Zap } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { getDashboard, getDiagnostics } from '../services/api';

// Inline mock data used as fallback
const MOCK_DASHBOARD = {
  brand: 'GlowSkin Co.',
  kpis: { total_revenue: 124500, revenue_change: -18.2, avg_sentiment: 4.2, sentiment_change: -0.3, competitor_alerts: 3, conversion_rate: 3.1, conversion_change: -0.8, orders_today: 84 },
  sales_trend: [
    { date: 'Feb 22', revenue: 19200, anomaly: false },{ date: 'Feb 23', revenue: 18400, anomaly: false },
    { date: 'Feb 24', revenue: 20100, anomaly: false },{ date: 'Feb 25', revenue: 17800, anomaly: false },
    { date: 'Feb 26', revenue: 16900, anomaly: false },{ date: 'Feb 27', revenue: 15200, anomaly: true, event: 'Competitor X -20%' },
    { date: 'Feb 28', revenue: 13400, anomaly: true, event: 'Review spike' },{ date: 'Mar 1', revenue: 12900, anomaly: true, event: 'Sales -18%' },
    { date: 'Mar 2', revenue: 11800, anomaly: true, event: 'New competitor SKU' },{ date: 'Mar 3', revenue: 12300, anomaly: false },
    { date: 'Mar 4', revenue: 13100, anomaly: false },{ date: 'Mar 5', revenue: 13800, anomaly: false },
    { date: 'Mar 6', revenue: 14200, anomaly: false },{ date: 'Mar 7', revenue: 14900, anomaly: false },
  ],
  recent_alerts: [
    { id: 1, severity: 'critical', message: 'Sales dropped 18% — 2 root causes identified', time: '2 hours ago' },
    { id: 2, severity: 'warning', message: 'Competitor X is running a 20% off campaign', time: '5 hours ago' },
    { id: 3, severity: 'warning', message: 'Negative review spike: 5 new 1-star reviews', time: '8 hours ago' },
  ]
};

const MOCK_DIAGNOSTICS = {
  summary: 'Sales dropped 18% over the last 3 days. MarketSense AI has identified 3 primary root causes driven by competitor pricing and packaging complaints.',
  confidence: 87,
  root_causes: [
    { rank: 1, title: 'Competitor Price Drop', description: 'Competitor X dropped prices by 20% on a nearly identical SKU.', impact_pct: 52, confidence: 91, category: 'competitor', recommendation: 'Run a 10-15% discount campaign to recapture price-sensitive customers.' },
    { rank: 2, title: 'Negative Review Spike', description: '47 reviews in the last 7 days mention "leakage" issues (+35% spike).', impact_pct: 35, confidence: 88, category: 'reviews', recommendation: 'Urgently audit packaging supplier and reach out to affected customers.' },
    { rank: 3, title: 'Declining Category Engagement', description: 'Social engagement in the face serum category dropped 12% this week.', impact_pct: 13, confidence: 64, category: 'social', recommendation: 'Activate micro-influencer partnerships to maintain visibility.' },
  ],
  recommended_actions: [
    { priority: 1, action: 'Run 12% discount for 7 days on flagship SKU', effort: 'Low', expected_impact: 'High' },
    { priority: 2, action: 'Contact packaging supplier about leakage complaints', effort: 'Medium', expected_impact: 'High' },
    { priority: 3, action: 'Respond to all 1-star reviews within 24h', effort: 'Low', expected_impact: 'Medium' },
    { priority: 4, action: 'Activate 2 micro-influencers in skincare niche', effort: 'Medium', expected_impact: 'Medium' },
  ]
};

// Custom tooltip for chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', minWidth: 160 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        <div style={{ color: 'var(--accent-light)', fontWeight: 700 }}>₹{payload[0].value.toLocaleString('en-IN')}</div>
        {d.event && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>⚠ {d.event}</div>}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<any>(MOCK_DASHBOARD);
  const [diagnostics, setDiagnostics] = useState<any>(MOCK_DIAGNOSTICS);

  useEffect(() => {
    getDashboard().then(d => { if (d) setDashboard(d); });
    getDiagnostics().then(d => { if (d) setDiagnostics(d); });
  }, []);

  const kpis = dashboard.kpis;
  const anomalyDates = dashboard.sales_trend.filter((d: any) => d.anomaly).map((d: any) => d.date);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard Overview</div>
          <div className="page-subtitle">Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{dashboard.brand}</strong> — here's what's happening today.</div>
        </div>
        <div className="date-badge">Mar 7, 2026</div>
      </div>

      {dashboard.sales_trend.length === 0 && (
        <div className="empty-dashboard-overlay" style={{ background: 'var(--bg-card)', padding: 40, borderRadius: 16, border: '1px solid var(--border)', textAlign: 'center', marginTop: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
          <h2 style={{ color: 'white', marginBottom: 8 }}>Initialize Your Workspace</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
            Your dashboard is currently empty. Run the Engine Setup to dynamically generate your market simulation data.
          </p>
          <button 
            className="btn-primary" 
            onClick={() => { localStorage.removeItem('brand'); window.location.href = '/'; }}
            style={{ margin: '0 auto' }}
          >
            Launch Setup Engine
          </button>
        </div>
      )}

      {dashboard.sales_trend.length > 0 && (
        <div className="page-body">

        {/* AI Diagnostic Card */}
        <div className="diagnostic-card">
          <div className="diagnostic-header">
            <div className="pulse-dot" />
            <div>
              <div className="diagnostic-title">Sales Anomaly Detected</div>
              <div className="diagnostic-subtitle">
                AI Confidence: <strong style={{ color: 'var(--accent-light)' }}>{diagnostics.confidence}%</strong>
                &nbsp;·&nbsp; Detected 2 hours ago
              </div>
            </div>
          </div>
          <div className="diagnostic-summary">{diagnostics.summary}</div>
          <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Root Causes</div>
          <div className="cause-list">
            {diagnostics.root_causes.map((c: any) => (
              <div key={c.rank} className="cause-item">
                <div className="cause-rank">{c.rank}</div>
                <div className="cause-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div className="cause-title">{c.title}</div>
                    <span className={`cause-badge ${c.category}`}>{c.category}</span>
                  </div>
                  <div className="cause-desc">{c.description}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="cause-bar-wrap" style={{ flex: 1 }}>
                      <div className={`cause-bar ${c.category}`} style={{ width: `${c.impact_pct}%` }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', minWidth: 50, textAlign: 'right' }}>{c.impact_pct}% impact</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>
                    💡 {c.recommendation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KPI Grid */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Total Revenue (7d)</div>
            <div className="kpi-value">₹{((kpis?.total_revenue || 0) / 1000).toFixed(1)}K</div>
            <div className={`kpi-change ${(kpis?.revenue_change || 0) < 0 ? 'down' : 'up'}`}>
              {(kpis?.revenue_change || 0) < 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
              {Math.abs(kpis?.revenue_change || 0)}% from last week
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Avg. Review Sentiment</div>
            <div className="kpi-value">{kpis?.avg_sentiment || 0}<span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/5.0</span></div>
            <div className={`kpi-change ${(kpis?.sentiment_change || 0) < 0 ? 'down' : 'up'}`}>
              {(kpis?.sentiment_change || 0) < 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
              {Math.abs(kpis?.sentiment_change || 0)} from last week
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Competitor Alerts</div>
            <div className="kpi-value" style={{ color: '#f59e0b' }}>{kpis?.competitor_alerts || 0}</div>
            <div className="kpi-change neutral"><AlertTriangle size={13} /> Active pricing changes</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Conversion Rate</div>
            <div className="kpi-value">{kpis?.conversion_rate || 0}%</div>
            <div className={`kpi-change ${(kpis?.conversion_change || 0) < 0 ? 'down' : 'up'}`}>
              {(kpis?.conversion_change || 0) < 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
              {Math.abs(kpis?.conversion_change || 0)}% from last week
            </div>
          </div>
        </div>

        {/* Chart and Actions */}
        <div className="chart-grid">
          <div className="card">
            <div className="card-title">Sales Trend — Last 14 Days</div>
            <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>⚠</span> Red markers indicate detected anomalies
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboard.sales_trend} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  {anomalyDates.map((d: string) => (
                    <ReferenceLine key={d} x={d} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.6} />
                  ))}
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#grad)" dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.anomaly) return <circle key={cx} cx={cx} cy={cy} r={4} fill="#ef4444" stroke="#0a0b0f" strokeWidth={2} />;
                    return <circle key={cx} cx={cx} cy={cy} r={3} fill="#6366f1" stroke="#0a0b0f" strokeWidth={1.5} />;
                  }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={14} style={{ color: 'var(--accent-light)' }} /> Recommended Actions
            </div>
            <div className="action-list">
              {diagnostics.recommended_actions.map((a: any) => (
                <div key={a.priority} className="action-item">
                  <div className="action-priority">{a.priority}</div>
                  <div className="action-text">{a.action}</div>
                  <div className="action-meta">
                    <span className={`tag ${a.effort.toLowerCase()}`}>{a.effort} effort</span>
                    <span className={`tag ${a.expected_impact.toLowerCase()}`}>{a.expected_impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="card">
          <div className="card-title">Recent Alerts</div>
          <div className="alert-list">
            {dashboard.recent_alerts.map((a: any) => (
              <div key={a.id} className="alert-item">
                <div className={`alert-icon ${a.severity}`}>
                  {a.severity === 'critical' ? <AlertTriangle size={18} style={{ color: '#ef4444' }} /> :
                   a.severity === 'warning' ? <AlertTriangle size={18} style={{ color: '#f59e0b' }} /> :
                   <Star size={18} style={{ color: '#6366f1' }} />}
                </div>
                <div className="alert-body">
                  <div className="alert-title">{a.message}</div>
                  <div className="alert-meta">{a.time}</div>
                </div>
                <span className={`tag ${a.severity === 'critical' ? 'high' : a.severity === 'warning' ? 'medium' : 'low'}`}>
                  {a.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
    </>
  );
}
