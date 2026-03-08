import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Package, DownloadCloud } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { getDashboard, exportData } from '../services/api';

export default function SalesPage() {
  const [trend, setTrend] = useState<any[]>([]);
  const [skus, setSkus] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getDashboard().then(d => {
      if (d?.sales_trend) setTrend(d.sales_trend);
      if (d?.skus) setSkus(d.skus);
    });
  }, []);

  const handleExport = async () => {
    setExporting(true);
    const data = await exportData();
    if (data?.url) {
      window.open(data.url, '_blank');
    }
    setExporting(false);
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="page-title">Sales Analysis</div>
          <div className="page-subtitle">Revenue performance and SKU-level breakdown</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="date-badge">Last 14 Days</div>
          <button 
            onClick={handleExport} disabled={exporting}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
              background: 'var(--accent-light)', color: '#fff', borderRadius: 8,
              border: 'none', fontWeight: 600, fontSize: 13, cursor: exporting ? 'wait' : 'pointer'
            }}
          >
            <DownloadCloud size={16} />
            {exporting ? 'Exporting...' : 'Export to Target S3'}
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Revenue Chart */}
        <div className="card">
          <div className="card-title">Revenue Trend</div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                  itemStyle={{ color: 'var(--accent-light)' }}
                  formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#grad2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SKU Breakdown */}
        <div className="card">
          <div className="card-title"><Package size={14} style={{ display: 'inline', marginRight: 6 }} />SKU Performance</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Revenue</th>
                <th>Units Sold</th>
                <th>Rating</th>
                <th>Trend vs Last Week</th>
              </tr>
            </thead>
            <tbody>
              {skus.map(sku => (
                <tr key={sku.name}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{sku.name}</td>
                  <td style={{ color: 'var(--text-primary)' }}>₹{sku.revenue.toLocaleString('en-IN')}</td>
                  <td>{sku.units}</td>
                  <td>⭐ {sku.rating}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: sku.trend < 0 ? 'var(--red)' : 'var(--green)', fontWeight: 600, fontSize: 13 }}>
                      {sku.trend < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                      {sku.trend > 0 ? '+' : ''}{sku.trend}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SKU Bar */}
        <div className="card">
          <div className="card-title">Revenue by SKU</div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skus} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} width={180} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}
                  formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                  {skus.map((_, i) => (
                    <Cell key={i} fill={`hsl(${248 - i * 18}, 80%, ${60 - i * 4}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
