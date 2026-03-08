import { useState } from 'react';
import { Sparkles, Link, ShoppingBag, Users } from 'lucide-react';
import { simulateLaunch } from '../services/api';

interface Props {
  onComplete: (brand: string) => void;
}

const categories = ['Skincare', 'Food & Bev', 'Electronics', 'Apparel', 'Fitness', 'Home'];

export default function OnboardingPage({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [products, setProducts] = useState(['', '', '']);
  const [competitors, setCompetitors] = useState(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState('Setting up your dashboard...');

  const handleLaunch = async () => {
    setLoading(true);
    setScrapeMsg('Generating dynamic dataset...');

    try {
      const validProducts = products.filter(p => p.trim());
      const validComps = competitors.filter(c => c.trim());

      setScrapeMsg('Simulating web scraping & market data...');
      await simulateLaunch(
        brand || 'Demo Brand', 
        category || 'General', 
        validProducts.length ? validProducts : [(category || 'General') + ' Product'], 
        validComps.length ? validComps : ['Generic Competitor']
      );

      setScrapeMsg('Dashboard ready. Launching...');
      setTimeout(() => onComplete(brand || 'Demo Brand'), 800);

    } catch (err) {
      console.error('Launch failed:', err);
      // Fallback
      onComplete(brand || 'Demo Brand');
    }
  };

  const stepDot = (s: number) =>
    s < step ? 'done' : s === step ? 'current' : 'upcoming';

  return (
    <div className="onboarding-wrap">
      <div className="onboarding-card">
        {/* Logo */}
        <div className="onboarding-logo">
          <div className="logo-icon">✦</div>
          <div>
            <div className="logo-text">MarketSense AI</div>
          </div>
        </div>

        {/* Step indicators */}
        <div className="step-indicators">
          {[1, 2, 3].map(s => (
            <div key={s} className={`step-dot ${stepDot(s)}`} />
          ))}
        </div>

        {/* Step 1: Brand Setup */}
        {step === 1 && (
          <>
            <div className="onboarding-step-label">Step 1 of 3 — Brand Setup</div>
            <div className="onboarding-title">Tell us about your brand</div>
            <div className="onboarding-subtitle">
              MarketSense AI will simulate a personalized diagnostic engine spanning any industry.
            </div>

            <div className="form-group">
              <label className="form-label">Brand Name</label>
              <input
                className="form-input"
                placeholder="e.g. Sugar Cosmetics, Nike, Apple..."
                value={brand}
                onChange={e => setBrand(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Product Category</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4 }}>
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    style={{
                      padding: '8px 0', borderRadius: 8, border: '1px solid',
                      borderColor: category === c ? 'var(--accent)' : 'var(--border)',
                      background: category === c ? 'var(--accent-glow)' : 'var(--bg-surface)',
                      color: category === c ? 'var(--accent-light)' : 'var(--text-secondary)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <input
                className="form-input"
                style={{ marginTop: 8 }}
                placeholder="Or type a custom category..."
                value={category}
                onChange={e => setCategory(e.target.value)}
              />
            </div>

            <button className="btn-primary" onClick={() => setStep(2)} disabled={!brand}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <ShoppingBag size={16} /> Continue to Products
              </span>
            </button>
          </>
        )}

        {/* Step 2: Products */}
        {step === 2 && (
          <>
            <div className="onboarding-step-label">Step 2 of 3 — Your Products</div>
            <div className="onboarding-title">What产品 categories do you sell?</div>
            <div className="onboarding-subtitle">
              Enter the main branches of your product line (e.g. "Face Wash", "Vitamin C Serum"). We'll simulate finding relevant reviews across the web.
            </div>

            <div className="form-group">
              <label className="form-label">Product Branches (up to 3)</label>
              <div className="url-input-group">
                {products.map((url, i) => (
                  <div key={i} className="url-input-row">
                    <span className="url-badge">{i + 1}</span>
                    <input
                      className="form-input"
                      placeholder={i === 0 ? "e.g. Face Wash" : i === 1 ? "e.g. Night Cream" : "e.g. Hair Serum"}
                      value={url}
                      onChange={e => {
                        const next = [...products];
                        next[i] = e.target.value;
                        setProducts(next);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="scraping-note">
              <Link size={14} style={{ color: 'var(--accent-light)', marginTop: 2, flexShrink: 0 }} />
              <div className="scraping-note-text">
                <strong style={{ color: 'var(--text-primary)' }}>Dynamic Scraping Simulation</strong> — The engine will dynamically generate contextual datasets (KPIs, sentiment trends) precisely matching your input branches.
              </div>
            </div>

            <button className="btn-primary" onClick={() => setStep(3)}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Users size={16} /> Continue to Competitors
              </span>
            </button>
            <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
          </>
        )}

        {/* Step 3: Competitors */}
        {step === 3 && (
          <>
            <div className="onboarding-step-label">Step 3 of 3 — Competitor Tracking</div>
            <div className="onboarding-title">Who are you competing with?</div>
            <div className="onboarding-subtitle">
              Enter the names of competitor brands. The engine will simulate tracking their pricing, stock status, and market share.
            </div>

            <div className="form-group">
              <label className="form-label">Competitor Brands (up to 3)</label>
              <div className="url-input-group">
                {competitors.map((url, i) => (
                  <div key={i} className="url-input-row">
                    <span className="url-badge">{i + 1}</span>
                    <input
                      className="form-input"
                      placeholder={i === 0 ? "e.g. Minimalist" : i === 1 ? "e.g. Derma Co" : "e.g. Dot & Key"}
                      value={url}
                      onChange={e => {
                        const next = [...competitors];
                        next[i] = e.target.value;
                        setCompetitors(next);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="scraping-note">
              <Sparkles size={14} style={{ color: 'var(--accent-light)', marginTop: 2, flexShrink: 0 }} />
              <div className="scraping-note-text">
                <strong style={{ color: 'var(--text-primary)' }}>AI Diagnostics active</strong> — Once generated, the AI engine will correlate your simulated sales anomalies with this competitor activity.
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={handleLaunch}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  {scrapeMsg}
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Sparkles size={16} /> Launch MarketSense AI
                </span>
              )}
            </button>
            <button className="btn-secondary" onClick={() => setStep(2)} disabled={loading}>Back</button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
