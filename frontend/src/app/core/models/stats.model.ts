export interface StatsTrendEntry {
  label: string;
  value: number;
  date?: string;
}

export interface StatsDistributionEntry {
  label: string;
  value: number;
  color?: string;
  icon?: string;
}

export interface StatsSummary {
  /** High-level metrics (counts, totals, averages) */
  summary: Record<string, number | string>;

  /** Categorical breakdowns (by status, priority, type) */
  distribution?: Record<string, StatsDistributionEntry[]>;

  /** Time-series data for sparklines or charts */
  trend?: StatsTrendEntry[];

  /** Metadata about the statistics (filters applied, date range) */
  metadata?: {
    startDate?: string;
    endDate?: string;
    entityId?: string | number;
    filters?: Record<string, unknown>;
    generatedAt: string;
  };
}
