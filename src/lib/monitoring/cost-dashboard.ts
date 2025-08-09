/**
 * Cost Dashboard - Reporting interface for cost monitoring
 * 
 * Provides:
 * - Real-time cost visualization data
 * - Language-specific cost breakdowns
 * - Provider comparison reports
 * - Budget tracking displays
 * - Export functionality
 */

import { SupportedLanguage } from '../types/language-aware-request';
import { UsageMetrics, OptimizationInsight } from './usage-analytics';
import { BudgetStatus, Alert } from './budget-alerts';
import { CostBreakdown } from './cost-calculator';

export interface DashboardData {
  summary: DashboardSummary;
  charts: ChartData[];
  tables: TableData[];
  alerts: Alert[];
  insights: OptimizationInsight[];
  exports: ExportOptions;
}

export interface DashboardSummary {
  period: {
    start: Date;
    end: Date;
    label: string;
  };
  costs: {
    total: number;
    trend: 'up' | 'down' | 'stable';
    changePercentage: number;
    projection: number;
  };
  usage: {
    requests: number;
    tokens: number;
    cacheHitRate: number;
    averageLatency: number;
  };
  languages: {
    english: {
      cost: number;
      requests: number;
      percentage: number;
    };
    norwegian: {
      cost: number;
      requests: number;
      percentage: number;
      overhead: number;
    };
  };
  budget: {
    used: number;
    limit: number;
    percentage: number;
    status: 'healthy' | 'warning' | 'critical' | 'exceeded';
    daysRemaining: number;
  };
  savings: {
    fromCache: number;
    fromOptimization: number;
    potential: number;
  };
}

export interface ChartData {
  id: string;
  type: ChartType;
  title: string;
  description?: string;
  data: any;
  options?: any;
}

export type ChartType = 
  | 'line'
  | 'bar'
  | 'pie'
  | 'donut'
  | 'area'
  | 'heatmap'
  | 'gauge'
  | 'comparison';

export interface TableData {
  id: string;
  title: string;
  columns: TableColumn[];
  rows: any[];
  sortable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
}

export interface TableColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'badge';
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface ExportOptions {
  formats: ('csv' | 'json' | 'pdf' | 'excel')[];
  dateRange: {
    presets: ('today' | 'week' | 'month' | 'quarter' | 'year' | 'custom')[];
    custom?: {
      start: Date;
      end: Date;
    };
  };
  includeCharts: boolean;
  includeInsights: boolean;
}

export interface Report {
  id: string;
  name: string;
  type: ReportType;
  schedule?: ReportSchedule;
  recipients?: string[];
  filters?: ReportFilters;
  generatedAt: Date;
  data: any;
}

export type ReportType = 
  | 'daily_summary'
  | 'weekly_analysis'
  | 'monthly_report'
  | 'cost_breakdown'
  | 'norwegian_analysis'
  | 'optimization_opportunities'
  | 'budget_forecast';

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:mm
  timezone: string;
  enabled: boolean;
}

export interface ReportFilters {
  languages?: SupportedLanguage[];
  providers?: string[];
  models?: string[];
  requestTypes?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export class CostDashboard {
  private static instance: CostDashboard;
  private dashboardCache: Map<string, DashboardData> = new Map();
  private reports: Map<string, Report[]> = new Map();
  private refreshInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeDashboard();
  }

  public static getInstance(): CostDashboard {
    if (!CostDashboard.instance) {
      CostDashboard.instance = new CostDashboard();
    }
    return CostDashboard.instance;
  }

  /**
   * Initialize dashboard
   */
  private initializeDashboard(): void {
    // Refresh dashboard data every 5 minutes
    this.refreshInterval = setInterval(() => {
      this.refreshAllDashboards();
    }, 300000);
  }

  /**
   * Get complete dashboard data
   */
  public async getDashboardData(
    userId: string,
    options?: {
      period?: 'day' | 'week' | 'month' | 'year';
      language?: SupportedLanguage;
      refresh?: boolean;
    }
  ): Promise<DashboardData> {
    const cacheKey = `${userId}-${options?.period || 'month'}-${options?.language || 'all'}`;
    
    // Check cache
    if (!options?.refresh && this.dashboardCache.has(cacheKey)) {
      const cached = this.dashboardCache.get(cacheKey);
      if (cached && this.isCacheValid(cached)) {
        return cached;
      }
    }

    // Generate fresh data
    const data = await this.generateDashboardData(userId, options);
    
    // Cache data
    this.dashboardCache.set(cacheKey, data);
    
    return data;
  }

  /**
   * Generate dashboard data
   */
  private async generateDashboardData(
    userId: string,
    options?: {
      period?: 'day' | 'week' | 'month' | 'year';
      language?: SupportedLanguage;
    }
  ): Promise<DashboardData> {
    const period = this.getPeriodDates(options?.period || 'month');
    
    // Generate summary
    const summary = await this.generateSummary(userId, period, options?.language);
    
    // Generate charts
    const charts = this.generateCharts(userId, period, options?.language);
    
    // Generate tables
    const tables = this.generateTables(userId, period, options?.language);
    
    // Get alerts
    const alerts = await this.getRecentAlerts(userId);
    
    // Get insights
    const insights = await this.getTopInsights(userId);
    
    // Export options
    const exports: ExportOptions = {
      formats: ['csv', 'json', 'pdf', 'excel'],
      dateRange: {
        presets: ['today', 'week', 'month', 'quarter', 'year', 'custom'],
      },
      includeCharts: true,
      includeInsights: true,
    };

    return {
      summary,
      charts,
      tables,
      alerts,
      insights,
      exports,
    };
  }

  /**
   * Generate dashboard summary
   */
  private async generateSummary(
    userId: string,
    period: { start: Date; end: Date },
    language?: SupportedLanguage
  ): Promise<DashboardSummary> {
    // This would fetch real data from the database
    // For now, returning mock data
    
    const totalCost = 125.50;
    const previousCost = 110.00;
    const changePercentage = ((totalCost - previousCost) / previousCost) * 100;
    
    return {
      period: {
        start: period.start,
        end: period.end,
        label: this.getPeriodLabel(period),
      },
      costs: {
        total: totalCost,
        trend: changePercentage > 5 ? 'up' : changePercentage < -5 ? 'down' : 'stable',
        changePercentage,
        projection: totalCost * 1.1, // Simple projection
      },
      usage: {
        requests: 1250,
        tokens: 450000,
        cacheHitRate: 0.42,
        averageLatency: 1250, // ms
      },
      languages: {
        english: {
          cost: 45.20,
          requests: 650,
          percentage: 36,
        },
        norwegian: {
          cost: 80.30,
          requests: 600,
          percentage: 64,
          overhead: 30, // 30% more expensive than English
        },
      },
      budget: {
        used: totalCost,
        limit: 500,
        percentage: (totalCost / 500) * 100,
        status: totalCost > 450 ? 'critical' : totalCost > 375 ? 'warning' : 'healthy',
        daysRemaining: Math.ceil((period.end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      },
      savings: {
        fromCache: 52.30,
        fromOptimization: 18.75,
        potential: 35.50,
      },
    };
  }

  /**
   * Generate chart data
   */
  private generateCharts(
    userId: string,
    period: { start: Date; end: Date },
    language?: SupportedLanguage
  ): ChartData[] {
    const charts: ChartData[] = [];

    // Cost trend chart
    charts.push({
      id: 'cost-trend',
      type: 'line',
      title: 'Cost Trend',
      description: 'Daily cost trend with projections',
      data: {
        labels: this.generateDateLabels(period, 'day'),
        datasets: [
          {
            label: 'Actual Cost',
            data: this.generateRandomData(30, 3, 10),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
          },
          {
            label: 'Projected Cost',
            data: this.generateRandomData(30, 4, 12),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderDash: [5, 5],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          tooltip: { mode: 'index' },
        },
      },
    });

    // Language distribution pie chart
    charts.push({
      id: 'language-distribution',
      type: 'donut',
      title: 'Cost by Language',
      description: 'Distribution of costs between English and Norwegian',
      data: {
        labels: ['English', 'Norwegian'],
        datasets: [{
          data: [45.20, 80.30],
          backgroundColor: ['#3B82F6', '#EF4444'],
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right' },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
              },
            },
          },
        },
      },
    });

    // Provider comparison bar chart
    charts.push({
      id: 'provider-comparison',
      type: 'bar',
      title: 'Cost by AI Provider',
      description: 'Comparison of costs across different AI providers',
      data: {
        labels: ['OpenAI', 'Anthropic', 'Cohere', 'Local'],
        datasets: [
          {
            label: 'English',
            data: [25.50, 15.30, 4.40, 0],
            backgroundColor: '#3B82F6',
          },
          {
            label: 'Norwegian',
            data: [45.20, 28.60, 6.50, 0],
            backgroundColor: '#EF4444',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
        },
        scales: {
          x: { stacked: true },
          y: { stacked: true },
        },
      },
    });

    // Cache efficiency gauge
    charts.push({
      id: 'cache-efficiency',
      type: 'gauge',
      title: 'Cache Hit Rate',
      description: 'Current cache efficiency',
      data: {
        value: 42,
        max: 100,
        thresholds: [
          { value: 30, color: '#EF4444' },
          { value: 50, color: '#F59E0B' },
          { value: 70, color: '#10B981' },
        ],
      },
    });

    // Norwegian cost overhead heatmap
    if (!language || language === 'no') {
      charts.push({
        id: 'norwegian-overhead',
        type: 'heatmap',
        title: 'Norwegian Cost Overhead by Hour',
        description: 'Hourly pattern of Norwegian content cost overhead',
        data: {
          hours: Array.from({ length: 24 }, (_, i) => i),
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          values: this.generateHeatmapData(),
        },
        options: {
          colorScale: {
            min: 0,
            max: 50,
            colors: ['#DBEAFE', '#3B82F6', '#1E40AF'],
          },
        },
      });
    }

    // Model usage comparison
    charts.push({
      id: 'model-usage',
      type: 'comparison',
      title: 'Model Usage & Cost Efficiency',
      description: 'Comparison of model usage and their cost efficiency',
      data: {
        models: [
          { name: 'GPT-4 Turbo', usage: 320, cost: 45.60, efficiency: 72 },
          { name: 'GPT-3.5 Turbo', usage: 580, cost: 12.30, efficiency: 88 },
          { name: 'Claude 3 Sonnet', usage: 250, cost: 32.50, efficiency: 78 },
          { name: 'Command R+', usage: 100, cost: 8.90, efficiency: 85 },
        ],
      },
    });

    return charts;
  }

  /**
   * Generate table data
   */
  private generateTables(
    userId: string,
    period: { start: Date; end: Date },
    language?: SupportedLanguage
  ): TableData[] {
    const tables: TableData[] = [];

    // Top requests table
    tables.push({
      id: 'top-requests',
      title: 'Top Content Requests',
      columns: [
        { key: 'type', label: 'Type', type: 'text', sortable: true },
        { key: 'language', label: 'Language', type: 'badge', width: '100px' },
        { key: 'count', label: 'Count', type: 'number', sortable: true, align: 'right' },
        { key: 'tokens', label: 'Tokens', type: 'number', sortable: true, align: 'right' },
        { key: 'cost', label: 'Cost', type: 'currency', sortable: true, align: 'right' },
        { key: 'efficiency', label: 'Efficiency', type: 'percentage', sortable: true, align: 'center' },
      ],
      rows: [
        { type: 'Article', language: 'NO', count: 145, tokens: 125000, cost: 28.50, efficiency: 0.72 },
        { type: 'Landing Page', language: 'EN', count: 98, tokens: 65000, cost: 15.30, efficiency: 0.85 },
        { type: 'Email', language: 'NO', count: 230, tokens: 45000, cost: 12.80, efficiency: 0.68 },
        { type: 'Ad Copy', language: 'EN', count: 180, tokens: 25000, cost: 8.50, efficiency: 0.92 },
        { type: 'Blog Post', language: 'NO', count: 67, tokens: 85000, cost: 22.40, efficiency: 0.65 },
      ],
      sortable: true,
      filterable: true,
      exportable: true,
    });

    // Provider costs table
    tables.push({
      id: 'provider-costs',
      title: 'Provider Cost Breakdown',
      columns: [
        { key: 'provider', label: 'Provider', type: 'text' },
        { key: 'model', label: 'Model', type: 'text' },
        { key: 'requests', label: 'Requests', type: 'number', align: 'right' },
        { key: 'tokens', label: 'Tokens', type: 'number', align: 'right' },
        { key: 'cost', label: 'Cost', type: 'currency', align: 'right' },
        { key: 'avgCost', label: 'Avg/Request', type: 'currency', align: 'right' },
      ],
      rows: [
        { provider: 'OpenAI', model: 'GPT-4 Turbo', requests: 320, tokens: 280000, cost: 45.60, avgCost: 0.143 },
        { provider: 'OpenAI', model: 'GPT-3.5 Turbo', requests: 580, tokens: 145000, cost: 12.30, avgCost: 0.021 },
        { provider: 'Anthropic', model: 'Claude 3 Sonnet', requests: 250, tokens: 225000, cost: 32.50, avgCost: 0.130 },
        { provider: 'Cohere', model: 'Command R+', requests: 100, tokens: 85000, cost: 8.90, avgCost: 0.089 },
      ],
      sortable: true,
      exportable: true,
    });

    // Norwegian-specific costs table
    if (!language || language === 'no') {
      tables.push({
        id: 'norwegian-costs',
        title: 'Norwegian Content Analysis',
        columns: [
          { key: 'category', label: 'Category', type: 'text' },
          { key: 'requests', label: 'Requests', type: 'number', align: 'right' },
          { key: 'baseCost', label: 'Base Cost', type: 'currency', align: 'right' },
          { key: 'overhead', label: 'NO Overhead', type: 'currency', align: 'right' },
          { key: 'totalCost', label: 'Total Cost', type: 'currency', align: 'right' },
          { key: 'overheadPct', label: 'Overhead %', type: 'percentage', align: 'center' },
        ],
        rows: [
          { category: 'Business Content', requests: 145, baseCost: 22.50, overhead: 6.75, totalCost: 29.25, overheadPct: 0.30 },
          { category: 'Marketing Copy', requests: 98, baseCost: 15.80, overhead: 5.53, totalCost: 21.33, overheadPct: 0.35 },
          { category: 'Technical Docs', requests: 67, baseCost: 12.40, overhead: 3.10, totalCost: 15.50, overheadPct: 0.25 },
          { category: 'Creative Writing', requests: 45, baseCost: 8.90, overhead: 3.56, totalCost: 12.46, overheadPct: 0.40 },
        ],
        sortable: true,
        exportable: true,
      });
    }

    // Optimization opportunities table
    tables.push({
      id: 'optimizations',
      title: 'Cost Optimization Opportunities',
      columns: [
        { key: 'priority', label: 'Priority', type: 'badge', width: '100px' },
        { key: 'category', label: 'Category', type: 'text' },
        { key: 'description', label: 'Opportunity', type: 'text' },
        { key: 'savings', label: 'Potential Savings', type: 'currency', align: 'right' },
        { key: 'effort', label: 'Effort', type: 'badge', align: 'center' },
      ],
      rows: [
        { 
          priority: 'High',
          category: 'Caching',
          description: 'Implement semantic caching for Norwegian templates',
          savings: 18.50,
          effort: 'Low',
        },
        {
          priority: 'High',
          category: 'Model Selection',
          description: 'Use GPT-3.5 for simple Norwegian tasks',
          savings: 12.30,
          effort: 'Low',
        },
        {
          priority: 'Medium',
          category: 'Provider Mix',
          description: 'Use Command R+ for Norwegian business content',
          savings: 8.75,
          effort: 'Medium',
        },
        {
          priority: 'Low',
          category: 'Batching',
          description: 'Batch similar Norwegian requests',
          savings: 4.20,
          effort: 'High',
        },
      ],
      filterable: true,
      exportable: true,
    });

    return tables;
  }

  /**
   * Generate scheduled report
   */
  public async generateReport(
    userId: string,
    type: ReportType,
    filters?: ReportFilters
  ): Promise<Report> {
    const report: Report = {
      id: `report-${Date.now()}`,
      name: this.getReportName(type),
      type,
      filters,
      generatedAt: new Date(),
      data: {},
    };

    switch (type) {
      case 'daily_summary':
        report.data = await this.generateDailySummaryReport(userId, filters);
        break;
      case 'norwegian_analysis':
        report.data = await this.generateNorwegianAnalysisReport(userId, filters);
        break;
      case 'optimization_opportunities':
        report.data = await this.generateOptimizationReport(userId, filters);
        break;
      case 'budget_forecast':
        report.data = await this.generateBudgetForecastReport(userId, filters);
        break;
      default:
        report.data = await this.generateGenericReport(userId, type, filters);
    }

    // Store report
    const userReports = this.reports.get(userId) || [];
    userReports.push(report);
    this.reports.set(userId, userReports);

    return report;
  }

  /**
   * Generate Norwegian analysis report
   */
  private async generateNorwegianAnalysisReport(
    userId: string,
    filters?: ReportFilters
  ): Promise<any> {
    return {
      summary: {
        totalNorwegianCost: 285.60,
        norwegianRequests: 1250,
        averageOverhead: 32,
        comparedToEnglish: '+32%',
      },
      trends: {
        weekly: [45.2, 48.5, 52.3, 49.8, 51.2, 47.6, 41.0],
        monthly: [980.5, 1050.3, 1125.8, 1285.6],
      },
      topContentTypes: [
        { type: 'Business Articles', cost: 125.30, overhead: 35 },
        { type: 'Marketing Emails', cost: 85.20, overhead: 30 },
        { type: 'Landing Pages', cost: 75.10, overhead: 28 },
      ],
      optimizations: [
        {
          title: 'Use Command R+ for Norwegian',
          description: 'Command R+ has native Norwegian support with 15% lower token usage',
          savings: '$45.20/month',
        },
        {
          title: 'Implement Norwegian Templates',
          description: 'Pre-built templates for common Norwegian business content',
          savings: '$32.50/month',
        },
      ],
      dialectAnalysis: {
        bokmål: { requests: 980, cost: 228.50 },
        nynorsk: { requests: 270, cost: 57.10 },
      },
      culturalAdaptations: {
        applied: 450,
        additionalCost: 28.90,
        topAdaptations: [
          'Formality adjustments',
          'Local references',
          'Business etiquette',
        ],
      },
    };
  }

  /**
   * Export dashboard data
   */
  public async exportData(
    userId: string,
    format: 'csv' | 'json' | 'pdf' | 'excel',
    options?: {
      dateRange?: { start: Date; end: Date };
      includeCharts?: boolean;
      includeInsights?: boolean;
    }
  ): Promise<Blob | string> {
    const data = await this.getDashboardData(userId);

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      
      case 'csv':
        return this.convertToCSV(data);
      
      case 'pdf':
        return this.generatePDF(data, options);
      
      case 'excel':
        return this.generateExcel(data, options);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Helper methods
   */

  private getPeriodDates(period: 'day' | 'week' | 'month' | 'year'): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'day':
        start.setDate(start.getDate() - 1);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return { start, end };
  }

  private getPeriodLabel(period: { start: Date; end: Date }): string {
    const days = Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days <= 1) return 'Today';
    if (days <= 7) return 'This Week';
    if (days <= 31) return 'This Month';
    if (days <= 365) return 'This Year';
    
    return `${period.start.toLocaleDateString()} - ${period.end.toLocaleDateString()}`;
  }

  private generateDateLabels(period: { start: Date; end: Date }, interval: 'day' | 'week' | 'month'): string[] {
    const labels: string[] = [];
    const current = new Date(period.start);
    
    while (current <= period.end) {
      labels.push(current.toLocaleDateString());
      
      switch (interval) {
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }
    
    return labels;
  }

  private generateRandomData(count: number, min: number, max: number): number[] {
    return Array.from({ length: count }, () => 
      Math.random() * (max - min) + min
    );
  }

  private generateHeatmapData(): number[][] {
    return Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => Math.random() * 50)
    );
  }

  private isCacheValid(data: DashboardData): boolean {
    // Cache is valid for 5 minutes
    return true; // Simplified for now
  }

  private async getRecentAlerts(userId: string): Promise<Alert[]> {
    // Would fetch from budget alert system
    return [];
  }

  private async getTopInsights(userId: string): Promise<OptimizationInsight[]> {
    // Would fetch from usage analytics
    return [];
  }

  private getReportName(type: ReportType): string {
    const names: Record<ReportType, string> = {
      daily_summary: 'Daily Cost Summary',
      weekly_analysis: 'Weekly Usage Analysis',
      monthly_report: 'Monthly Report',
      cost_breakdown: 'Detailed Cost Breakdown',
      norwegian_analysis: 'Norwegian Content Analysis',
      optimization_opportunities: 'Optimization Opportunities',
      budget_forecast: 'Budget Forecast',
    };
    return names[type] || 'Report';
  }

  private async generateDailySummaryReport(userId: string, filters?: ReportFilters): Promise<any> {
    return { /* Daily summary data */ };
  }

  private async generateOptimizationReport(userId: string, filters?: ReportFilters): Promise<any> {
    return { /* Optimization report data */ };
  }

  private async generateBudgetForecastReport(userId: string, filters?: ReportFilters): Promise<any> {
    return { /* Budget forecast data */ };
  }

  private async generateGenericReport(userId: string, type: ReportType, filters?: ReportFilters): Promise<any> {
    return { /* Generic report data */ };
  }

  private convertToCSV(data: DashboardData): string {
    // Convert dashboard data to CSV format
    return ''; // Simplified
  }

  private async generatePDF(data: DashboardData, options?: any): Promise<Blob> {
    // Generate PDF report
    return new Blob(); // Simplified
  }

  private async generateExcel(data: DashboardData, options?: any): Promise<Blob> {
    // Generate Excel report
    return new Blob(); // Simplified
  }

  private refreshAllDashboards(): void {
    // Refresh all cached dashboards
    this.dashboardCache.clear();
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}