import { useEffect, useState } from 'react';
import { Star, TrendingDown, AlertTriangle, Radio, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { getReviews, getCompetitors } from '../services/api';

const EMPTY_REVIEWS = {
  overall_sentiment: 0,
  sentiment_change: 0,
  total_reviews_scraped: 0,
  complaint_themes: [],
  sentiment_trend: [],
  recent_reviews: [],
};

const EMPTY_COMPETITORS = {
  competitors: [],
  price_comparison_trend: []
};

function renderStars(n: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ color: i < n ? '#f59e0b' : 'var(--text-muted)' }}>★</span>
  ));
}

export default function IntelligencePage() {
  const [tab, setTab] = useState<'reviews' | 'competitors'>('reviews');
  const [reviews, setReviews] = useState<any>(EMPTY_REVIEWS);
  const [comps, setComps] = useState<any>(EMPTY_COMPETITORS);

  useEffect(() => {
    getReviews().then(d => { if (d) setReviews(d); });
    getCompetitors().then(d => { if (d) setComps(d); });
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Market Intelligence</div>
          <div className="page-subtitle">Review sentiment analysis and competitor tracking</div>
        </div>
        <div className="tab-bar">
          <button className={`tab-btn ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
            <Star size={13} style={{ display: 'inline', marginRight: 5 }} />Review Sentiment
          </button>
          <button className={`tab-btn ${tab === 'competitors' ? 'active' : ''}`} onClick={() => setTab('competitors')}>
            <Radio size={13} style={{ display: 'inline', marginRight: 5 }} />Competitor Intel
          </button>
        </div>
      </div>

      <div className="page-body">
        {tab === 'reviews' && (
          <>
            {/* Sentiment Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              <div className="kpi-card">
                <div className="kpi-label">Overall Sentiment</div>
                <div className="kpi-value">{reviews.overall_sentiment}<span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/5.0</span></div>
                <div className="kpi-change down"><TrendingDown size={13} /> {Math.abs(reviews.sentiment_change)} this month</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Reviews Scraped</div>
                <div className="kpi-value" style={{ color: 'var(--accent-light)' }}>{reviews.total_reviews_scraped.toLocaleString()}</div>
                <div className="kpi-change neutral">Last 30 days · 4 platforms</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Negative Theme Spike</div>
                <div className="kpi-value" style={{ color: '#ef4444' }}>+47</div>
                <div className="kpi-change down"><TrendingDown size={13} /> Packaging complaints this week</div>
              </div>
            </div>

            {/* Complaint Themes + Trend */}
            <div className="chart-grid">
              <div className="card">
                <div className="card-title">Complaint Themes</div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reviews.complaint_themes} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" horizontal={false} />
                      <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="theme" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} width={140} />
                      <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {reviews.complaint_themes.map((t: any, i: number) => (
                          <Cell key={i} fill={t.sentiment === 'negative' ? '#ef4444' : '#22c55e'} fillOpacity={0.75} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <div className="card-title">Sentiment Trend (6 Weeks)</div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reviews.sentiment_trend} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                      <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis domain={[3.5, 5.0]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }} />
                      <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Reviews */}
            <div className="card">
              <div className="card-title">Recent Reviews <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— scraped from Amazon, Nykaa, Flipkart</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                {reviews.recent_reviews.map((r: any) => (
                  <div key={r.id} className="review-card">
                    <div className="review-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`platform-badge ${r.platform.toLowerCase()}`}>{r.platform}</span>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{r.author}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.date}</span>
                      </div>
                      <div className="stars">{renderStars(r.rating)}</div>
                    </div>
                    <div className="review-text">{r.text}</div>
                    <div className="review-tags">
                      {r.flagged_themes.map((t: string) => (
                        <span key={t} className="review-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'competitors' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              <div className="kpi-card">
                <div className="kpi-label">Competitors Tracked</div>
                <div className="kpi-value" style={{ color: 'var(--accent-light)' }}>4</div>
                <div className="kpi-change neutral">Scraped every 6 hours</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Price Alerts</div>
                <div className="kpi-value" style={{ color: '#ef4444' }}>3</div>
                <div className="kpi-change down"><TrendingDown size={13} /> Active pricing changes</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Running Ads</div>
                <div className="kpi-value" style={{ color: '#f59e0b' }}>2</div>
                <div className="kpi-change neutral">Competitors actively advertising</div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Competitor Tracker <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— live scraped data</span></div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Competitor</th><th>Product</th><th>Platform</th>
                    <th>Price</th><th>Price Δ</th><th>Rating</th>
                    <th>Stock</th><th>Ads</th>
                  </tr>
                </thead>
                <tbody>
                  {comps.competitors.map((c: any) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.brand}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>scraped {c.last_scraped}</div>
                      </td>
                      <td style={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <a 
                          href={c.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: 'var(--accent-light)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          {c.product}
                          <ExternalLink size={12} style={{ opacity: 0.7 }} />
                        </a>
                      </td>
                      <td><span className={`platform-badge ${c.platform.toLowerCase()}`}>{c.platform}</span></td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>₹{c.current_price}</td>
                      <td>
                        <span className={c.price_change < 0 ? 'price-down' : c.price_change > 0 ? 'price-up' : 'price-neutral'}>
                          {c.price_change > 0 ? '+' : ''}{c.price_change}%
                        </span>
                      </td>
                      <td>⭐ {c.rating} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({c.review_count})</span></td>
                      <td>
                        <span className={`status-dot ${c.in_stock ? 'green' : 'red'}`} />
                        {c.in_stock ? 'In Stock' : 'Out of Stock'}
                      </td>
                      <td>
                        {c.running_ad
                          ? <span className="tag medium">Running</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Competitor Alerts */}
            <div className="card">
              <div className="card-title">Active Competitor Alerts</div>
              <div className="alert-list">
                {comps.competitors.filter((c: any) => c.alert).map((c: any) => (
                  <div key={c.id} className="alert-item">
                    <div className="alert-icon warning">
                      <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
                    </div>
                    <div className="alert-body">
                      <div className="alert-title">{c.brand} — {c.alert}</div>
                      <div className="alert-meta">
                        <span className={`platform-badge ${c.platform.toLowerCase()}`} style={{ fontSize: 10 }}>{c.platform}</span>
                        Scraped {c.last_scraped}
                      </div>
                    </div>
                    <span className={`tag ${c.price_change < -10 ? 'high' : 'medium'}`}>
                      {c.price_change < -10 ? 'High Priority' : 'Monitor'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
