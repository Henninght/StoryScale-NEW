/**
 * Budget Alert System - Real-time budget monitoring and alerts
 */

import { EventEmitter } from 'events';
import { SupportedLanguage } from '../types/language-aware-request';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertType = 
  | 'budget_warning'
  | 'budget_critical'
  | 'quota_exceeded'
  | 'unusual_activity'
  | 'cost_spike'
  | 'provider_issue';

// Budget alert structure
export interface BudgetAlert {
  id: string;
  timestamp: Date;
  severity: AlertSeverity;
  type: AlertType;
  message: string;
  details: Record<string, any>;
  actions: string[];
  acknowledged?: boolean;
  resolvedAt?: Date;
}

// Budget configuration
export interface BudgetConfig {
  daily: number;
  weekly: number;
  monthly: number;
  quarterly: number;
  alertThresholds: {
    warning: number; // Percentage (0-100)
    critical: number; // Percentage (0-100)
  };
  spikeDetection: {
    enabled: boolean;
    threshold: number; // Percentage increase
    timeWindow: number; // Minutes
  };
  languageSpecific: {
    no: {
      multiplier: number;
      separateLimit: boolean;
      limit?: number;
    };
  };
}

// Alert notification channels
export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'dashboard';
  enabled: boolean;
  config: Record<string, any>;
  severityFilter?: AlertSeverity[];
}

// Alert history entry
export interface AlertHistoryEntry extends BudgetAlert {
  notificationsSent: Array<{
    channel: string;
    sentAt: Date;
    success: boolean;
    error?: string;
  }>;
  userActions: Array<{
    action: string;
    userId: string;
    timestamp: Date;
  }>;
}

export class BudgetAlertSystem extends EventEmitter {
  private static instance: BudgetAlertSystem;
  private config: BudgetConfig;
  private notificationChannels: Map<string, NotificationChannel>;
  private activeAlerts: Map<string, BudgetAlert>;
  private alertHistory: AlertHistoryEntry[];
  private costBuffer: Array<{ timestamp: Date; amount: number; language: SupportedLanguage }>;
  private alertCooldowns: Map<string, Date>;

  private constructor() {
    super();
    this.config = this.initializeConfig();
    this.notificationChannels = this.initializeChannels();
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.costBuffer = [];
    this.alertCooldowns = new Map();
    this.startMonitoring();
  }

  public static getInstance(): BudgetAlertSystem {
    if (!BudgetAlertSystem.instance) {
      BudgetAlertSystem.instance = new BudgetAlertSystem();
    }
    return BudgetAlertSystem.instance;
  }

  /**
   * Initialize budget configuration
   */
  private initializeConfig(): BudgetConfig {
    return {
      daily: 100,
      weekly: 500,
      monthly: 1500,
      quarterly: 4000,
      alertThresholds: {
        warning: 80,
        critical: 95,
      },
      spikeDetection: {
        enabled: true,
        threshold: 200, // 200% increase
        timeWindow: 30, // 30 minutes
      },
      languageSpecific: {
        no: {
          multiplier: 1.3,
          separateLimit: false,
        },
      },
    };
  }

  /**
   * Initialize notification channels
   */
  private initializeChannels(): Map<string, NotificationChannel> {
    const channels = new Map<string, NotificationChannel>();

    // Dashboard notifications (always enabled)
    channels.set('dashboard', {
      type: 'dashboard',
      enabled: true,
      config: {},
    });

    // Email notifications
    channels.set('email', {
      type: 'email',
      enabled: false,
      config: {
        recipients: [],
        smtpConfig: {},
      },
      severityFilter: ['warning', 'critical'],
    });

    // Slack notifications
    channels.set('slack', {
      type: 'slack',
      enabled: false,
      config: {
        webhookUrl: '',
        channel: '#alerts',
      },
      severityFilter: ['critical'],
    });

    // Webhook notifications
    channels.set('webhook', {
      type: 'webhook',
      enabled: false,
      config: {
        url: '',
        headers: {},
      },
    });

    return channels;
  }

  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    // Check for spike detection every minute
    setInterval(() => {
      this.detectCostSpikes();
    }, 60000);

    // Clean up old cost buffer entries every 5 minutes
    setInterval(() => {
      this.cleanupCostBuffer();
    }, 300000);

    // Check alert cooldowns every minute
    setInterval(() => {
      this.cleanupCooldowns();
    }, 60000);
  }

  /**
   * Check budget against limits
   */
  public async checkBudget(params: {
    current: number;
    limit: number;
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    userId?: string;
    language?: SupportedLanguage;
  }): Promise<void> {
    const { current, limit, period, userId, language } = params;
    const percentage = (current / limit) * 100;

    // Check if we're in cooldown for this alert type
    const cooldownKey = `budget_${period}_${userId || 'global'}`;
    if (this.isInCooldown(cooldownKey)) {
      return;
    }

    // Check warning threshold
    if (percentage >= this.config.alertThresholds.warning && percentage < this.config.alertThresholds.critical) {
      await this.createAlert({
        severity: 'warning',
        type: 'budget_warning',
        message: `${period.charAt(0).toUpperCase() + period.slice(1)} budget at ${percentage.toFixed(1)}% ($${current.toFixed(2)} of $${limit})`,
        details: {
          period,
          current,
          limit,
          percentage,
          userId,
          language,
        },
        actions: ['review_usage', 'optimize_costs', 'increase_limit'],
      });
      this.setCooldown(cooldownKey, 3600000); // 1 hour cooldown
    }

    // Check critical threshold
    if (percentage >= this.config.alertThresholds.critical) {
      await this.createAlert({
        severity: 'critical',
        type: 'budget_critical',
        message: `${period.charAt(0).toUpperCase() + period.slice(1)} budget critical at ${percentage.toFixed(1)}% ($${current.toFixed(2)} of $${limit})`,
        details: {
          period,
          current,
          limit,
          percentage,
          userId,
          language,
        },
        actions: ['immediate_review', 'pause_non_essential', 'contact_admin'],
      });
      this.setCooldown(cooldownKey, 1800000); // 30 minute cooldown for critical
    }
  }

  /**
   * Track cost for spike detection
   */
  public trackCost(amount: number, language: SupportedLanguage = 'en'): void {
    this.costBuffer.push({
      timestamp: new Date(),
      amount,
      language,
    });

    // Keep buffer size manageable
    if (this.costBuffer.length > 1000) {
      this.costBuffer.splice(0, 100);
    }
  }

  /**
   * Detect cost spikes
   */
  private async detectCostSpikes(): Promise<void> {
    if (!this.config.spikeDetection.enabled) {
      return;
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - this.config.spikeDetection.timeWindow * 60000);
    const previousWindowStart = new Date(windowStart.getTime() - this.config.spikeDetection.timeWindow * 60000);

    // Get costs for current and previous windows
    const currentWindowCosts = this.costBuffer
      .filter(c => c.timestamp >= windowStart)
      .reduce((sum, c) => sum + c.amount, 0);

    const previousWindowCosts = this.costBuffer
      .filter(c => c.timestamp >= previousWindowStart && c.timestamp < windowStart)
      .reduce((sum, c) => sum + c.amount, 0);

    if (previousWindowCosts === 0) {
      return; // Can't calculate spike without baseline
    }

    const percentageIncrease = ((currentWindowCosts - previousWindowCosts) / previousWindowCosts) * 100;

    if (percentageIncrease >= this.config.spikeDetection.threshold) {
      const cooldownKey = 'spike_detection';
      if (!this.isInCooldown(cooldownKey)) {
        await this.createAlert({
          severity: 'warning',
          type: 'cost_spike',
          message: `Cost spike detected: ${percentageIncrease.toFixed(1)}% increase in last ${this.config.spikeDetection.timeWindow} minutes`,
          details: {
            currentWindowCosts,
            previousWindowCosts,
            percentageIncrease,
            timeWindow: this.config.spikeDetection.timeWindow,
          },
          actions: ['investigate_spike', 'check_for_loops', 'review_recent_requests'],
        });
        this.setCooldown(cooldownKey, 3600000); // 1 hour cooldown
      }
    }
  }

  /**
   * Create and send alert
   */
  private async createAlert(params: {
    severity: AlertSeverity;
    type: AlertType;
    message: string;
    details: Record<string, any>;
    actions: string[];
  }): Promise<BudgetAlert> {
    const alert: BudgetAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      severity: params.severity,
      type: params.type,
      message: params.message,
      details: params.details,
      actions: params.actions,
      acknowledged: false,
    };

    // Store active alert
    this.activeAlerts.set(alert.id, alert);

    // Create history entry
    const historyEntry: AlertHistoryEntry = {
      ...alert,
      notificationsSent: [],
      userActions: [],
    };

    // Send notifications
    await this.sendNotifications(alert, historyEntry);

    // Store in history
    this.alertHistory.push(historyEntry);

    // Emit event
    this.emit('alert:triggered', alert);

    return alert;
  }

  /**
   * Send notifications through configured channels
   */
  private async sendNotifications(
    alert: BudgetAlert,
    historyEntry: AlertHistoryEntry
  ): Promise<void> {
    for (const [name, channel] of this.notificationChannels) {
      if (!channel.enabled) continue;

      // Check severity filter
      if (channel.severityFilter && !channel.severityFilter.includes(alert.severity)) {
        continue;
      }

      try {
        await this.sendToChannel(channel, alert);
        historyEntry.notificationsSent.push({
          channel: name,
          sentAt: new Date(),
          success: true,
        });
      } catch (error) {
        historyEntry.notificationsSent.push({
          channel: name,
          sentAt: new Date(),
          success: false,
          error: (error as Error).message,
        });
      }
    }
  }

  /**
   * Send alert to specific channel
   */
  private async sendToChannel(
    channel: NotificationChannel,
    alert: BudgetAlert
  ): Promise<void> {
    switch (channel.type) {
      case 'dashboard':
        // Dashboard notifications are handled through events
        this.emit('dashboard:alert', alert);
        break;

      case 'email':
        // Implement email sending
        console.log('Email alert:', alert.message);
        break;

      case 'slack':
        // Implement Slack webhook
        if (channel.config.webhookUrl) {
          const slackMessage = this.formatSlackMessage(alert);
          // await fetch(channel.config.webhookUrl, { method: 'POST', body: JSON.stringify(slackMessage) });
        }
        break;

      case 'webhook':
        // Implement generic webhook
        if (channel.config.url) {
          // await fetch(channel.config.url, { method: 'POST', body: JSON.stringify(alert), headers: channel.config.headers });
        }
        break;
    }
  }

  /**
   * Format alert for Slack
   */
  private formatSlackMessage(alert: BudgetAlert): any {
    const color = alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'good';
    
    return {
      attachments: [{
        color,
        title: `Budget Alert: ${alert.type.replace('_', ' ').toUpperCase()}`,
        text: alert.message,
        fields: Object.entries(alert.details).map(([key, value]) => ({
          title: key.replace('_', ' ').charAt(0).toUpperCase() + key.slice(1),
          value: String(value),
          short: true,
        })),
        footer: 'StoryScale Cost Guardian',
        ts: Math.floor(alert.timestamp.getTime() / 1000),
      }],
    };
  }

  /**
   * Check if alert is in cooldown
   */
  private isInCooldown(key: string): boolean {
    const cooldownUntil = this.alertCooldowns.get(key);
    if (!cooldownUntil) return false;
    return new Date() < cooldownUntil;
  }

  /**
   * Set cooldown for alert type
   */
  private setCooldown(key: string, duration: number): void {
    this.alertCooldowns.set(key, new Date(Date.now() + duration));
  }

  /**
   * Clean up old cooldowns
   */
  private cleanupCooldowns(): void {
    const now = new Date();
    for (const [key, until] of this.alertCooldowns) {
      if (until < now) {
        this.alertCooldowns.delete(key);
      }
    }
  }

  /**
   * Clean up old cost buffer entries
   */
  private cleanupCostBuffer(): void {
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000); // Keep 2 hours
    this.costBuffer = this.costBuffer.filter(c => c.timestamp > cutoff);
  }

  /**
   * Trigger manual alert
   */
  public async triggerAlert(alert: BudgetAlert): Promise<void> {
    // Store active alert
    this.activeAlerts.set(alert.id, alert);

    // Create history entry
    const historyEntry: AlertHistoryEntry = {
      ...alert,
      notificationsSent: [],
      userActions: [],
    };

    // Send notifications
    await this.sendNotifications(alert, historyEntry);

    // Store in history
    this.alertHistory.push(historyEntry);

    // Emit event
    this.emit('alert:triggered', alert);
  }

  /**
   * Acknowledge alert
   */
  public acknowledgeAlert(alertId: string, userId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      
      // Update history
      const historyEntry = this.alertHistory.find(h => h.id === alertId);
      if (historyEntry) {
        historyEntry.userActions.push({
          action: 'acknowledged',
          userId,
          timestamp: new Date(),
        });
      }

      this.emit('alert:acknowledged', alert, userId);
    }
  }

  /**
   * Resolve alert
   */
  public resolveAlert(alertId: string, userId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      this.activeAlerts.delete(alertId);
      
      // Update history
      const historyEntry = this.alertHistory.find(h => h.id === alertId);
      if (historyEntry) {
        historyEntry.resolvedAt = alert.resolvedAt;
        historyEntry.userActions.push({
          action: 'resolved',
          userId,
          timestamp: new Date(),
        });
      }

      this.emit('alert:resolved', alert, userId);
    }
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(severity?: AlertSeverity): BudgetAlert[] {
    const alerts = Array.from(this.activeAlerts.values());
    if (severity) {
      return alerts.filter(a => a.severity === severity);
    }
    return alerts;
  }

  /**
   * Get alert history
   */
  public getAlertHistory(filters?: {
    startDate?: Date;
    endDate?: Date;
    severity?: AlertSeverity;
    type?: AlertType;
    limit?: number;
  }): AlertHistoryEntry[] {
    let history = [...this.alertHistory];

    if (filters) {
      if (filters.startDate) {
        history = history.filter(h => h.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        history = history.filter(h => h.timestamp <= filters.endDate!);
      }
      if (filters.severity) {
        history = history.filter(h => h.severity === filters.severity);
      }
      if (filters.type) {
        history = history.filter(h => h.type === filters.type);
      }
      if (filters.limit) {
        history = history.slice(0, filters.limit);
      }
    }

    return history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Update budget configuration
   */
  public updateConfig(config: Partial<BudgetConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('config:updated', this.config);
  }

  /**
   * Update notification channel
   */
  public updateNotificationChannel(
    name: string,
    updates: Partial<NotificationChannel>
  ): void {
    const channel = this.notificationChannels.get(name);
    if (channel) {
      Object.assign(channel, updates);
      this.emit('channel:updated', name, channel);
    }
  }

  /**
   * Get budget status
   */
  public getBudgetStatus(): {
    config: BudgetConfig;
    activeAlerts: number;
    alertsByType: Record<AlertType, number>;
    recentSpikes: number;
    notificationChannels: Array<{ name: string; enabled: boolean }>;
  } {
    const alertsByType: Record<AlertType, number> = {
      budget_warning: 0,
      budget_critical: 0,
      quota_exceeded: 0,
      unusual_activity: 0,
      cost_spike: 0,
      provider_issue: 0,
    };

    for (const alert of this.activeAlerts.values()) {
      alertsByType[alert.type]++;
    }

    const recentSpikes = this.alertHistory
      .filter(h => h.type === 'cost_spike' && h.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000))
      .length;

    return {
      config: this.config,
      activeAlerts: this.activeAlerts.size,
      alertsByType,
      recentSpikes,
      notificationChannels: Array.from(this.notificationChannels.entries()).map(([name, channel]) => ({
        name,
        enabled: channel.enabled,
      })),
    };
  }

  /**
   * Export alert data
   */
  public exportAlertData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify({
        activeAlerts: Array.from(this.activeAlerts.values()),
        history: this.alertHistory,
        config: this.config,
      }, null, 2);
    } else {
      // CSV export
      const headers = ['Timestamp', 'Severity', 'Type', 'Message', 'Resolved'];
      const rows = this.alertHistory.map(h => [
        h.timestamp.toISOString(),
        h.severity,
        h.type,
        h.message,
        h.resolvedAt ? h.resolvedAt.toISOString() : 'Active',
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}