export interface SalesData {
    date: string;
    revenue: number;
    units_sold: number;
    source: string;
}

export interface Anomaly {
    id: string;
    date: string;
    metric: string;
    deviation: number;
    severity: 'low' | 'medium' | 'high';
    root_causes: RootCause[];
}

export interface RootCause {
    type: string;
    description: string;
    impact_score: number;
    confidence: number;
    suggested_actions: string[];
}
