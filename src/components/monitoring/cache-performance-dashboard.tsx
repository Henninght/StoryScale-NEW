'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  Database, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Layers,
  Target
} from 'lucide-react';

interface CacheStats {
  currentHitRate: number;
  avgResponseTime: number;
  cacheSizeGB: number;
  memoryUsageMB: number;
  patternsWarmed: number;
  optimizationScore: number;
  recommendations: string[];
  layerStats?: {
    L1: { hitRate: number; size: number; avgLatency: number };
    L2: { hitRate: number; size: number; avgLatency: number };
    L3: { hitRate: number; size: number; avgLatency: number };
  };
  warmingStatus?: {
    isWarming: boolean;
    patternsConfigured: number;
    highPriorityPatterns: number;
    nextWarmingIn: number;
  };
}

export function CachePerformanceDashboard() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchStats();
    
    if (autoRefresh) {
      const interval = setInterval(fetchStats, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/cache/stats');
      const data = await response.json();
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    try {
      await fetch('/api/cache/optimize', { method: 'POST' });
      fetchStats();
    } catch (error) {
      console.error('Failed to optimize cache:', error);
    }
  };

  const handleWarmCache = async () => {
    try {
      await fetch('/api/cache/warm', { method: 'POST' });
      fetchStats();
    } catch (error) {
      console.error('Failed to warm cache:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500 py-8">
        No cache statistics available
      </div>
    );
  }

  const hitRateColor = stats.currentHitRate >= 0.45 ? 'text-green-600' : 
                       stats.currentHitRate >= 0.35 ? 'text-yellow-600' : 'text-red-600';
  
  const responseTimeColor = stats.avgResponseTime <= 1000 ? 'text-green-600' :
                            stats.avgResponseTime <= 2000 ? 'text-yellow-600' : 'text-red-600';

  const optimizationColor = stats.optimizationScore >= 80 ? 'bg-green-500' :
                           stats.optimizationScore >= 60 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Cache Performance Dashboard</h2>
          <p className="text-gray-500">Real-time cache metrics and optimization</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleWarmCache}>
            <Zap className="h-4 w-4 mr-2" />
            Warm Cache
          </Button>
          <Button variant="default" size="sm" onClick={handleOptimize}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Optimize
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${hitRateColor}`}>
              {(stats.currentHitRate * 100).toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Target className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">Target: 45%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${responseTimeColor}`}>
              {stats.avgResponseTime.toFixed(0)}ms
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">Target: &lt;1000ms</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cache Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.cacheSizeGB.toFixed(2)} GB
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Database className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">
                Memory: {stats.memoryUsageMB.toFixed(0)} MB
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Optimization Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.optimizationScore}/100</div>
            <Progress 
              value={stats.optimizationScore} 
              className="mt-2 h-1.5"
              indicatorClassName={optimizationColor}
            />
          </CardContent>
        </Card>
      </div>

      {/* Layer Performance */}
      {stats.layerStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Cache Layer Performance
            </CardTitle>
            <CardDescription>Multi-layer cache hit rates and latency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.layerStats).map(([layer, layerData]) => (
                <div key={layer} className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Badge variant={layer === 'L1' ? 'default' : layer === 'L2' ? 'secondary' : 'outline'}>
                      {layer}
                    </Badge>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Hit Rate: {(layerData.hitRate * 100).toFixed(1)}%</span>
                        <span className="text-gray-500">{layerData.avgLatency.toFixed(0)}ms</span>
                      </div>
                      <Progress value={layerData.hitRate * 100} className="h-1.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warming Status */}
      {stats.warmingStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Cache Warming Status
            </CardTitle>
            <CardDescription>Pre-generated pattern caching</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div className="flex items-center gap-1 mt-1">
                  {stats.warmingStatus.isWarming ? (
                    <>
                      <Activity className="h-4 w-4 text-yellow-500 animate-pulse" />
                      <span className="font-medium">Warming...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Idle</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Patterns Configured</div>
                <div className="font-medium mt-1">{stats.warmingStatus.patternsConfigured}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">High Priority</div>
                <div className="font-medium mt-1">{stats.warmingStatus.highPriorityPatterns}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Next Warming</div>
                <div className="font-medium mt-1">{stats.warmingStatus.nextWarmingIn} min</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pattern Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Pattern Analysis
          </CardTitle>
          <CardDescription>Content generation patterns tracked</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-2">{stats.patternsWarmed}</div>
          <div className="text-sm text-gray-500">
            Unique patterns cached and optimized
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {stats.recommendations && stats.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Optimization Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {stats.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}