const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function fetchData(endpoint: string, options?: RequestInit) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    if (!res.ok) throw new Error('Network response was not ok');
    return await res.json();
  } catch {
    return null;
  }
}

export const getDashboard = (branch?: string) => fetchData(branch && branch !== 'All Branches' ? `/dashboard?branch=${encodeURIComponent(branch)}` : '/dashboard');
export const getReviews = (branch?: string) => fetchData(branch && branch !== 'All Branches' ? `/reviews?branch=${encodeURIComponent(branch)}` : '/reviews');
export const getCompetitors = (branch?: string) => fetchData(branch && branch !== 'All Branches' ? `/competitors?branch=${encodeURIComponent(branch)}` : '/competitors');
export const getDiagnostics = () => fetchData('/diagnostics');
export const exportData = (branch?: string) => fetchData(branch && branch !== 'All Branches' ? `/export?branch=${encodeURIComponent(branch)}` : '/export', { method: 'POST' });

export const simulateLaunch = (brand: string, category: string, branches: string[], competitors: string[]) => {
  return fetchData(`/simulate/launch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brand_name: brand, category, branches, competitors })
  });
};

