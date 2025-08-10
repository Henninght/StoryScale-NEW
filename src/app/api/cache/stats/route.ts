import { NextResponse } from 'next/server';
import { CacheOptimizer } from '@/lib/cache/cache-optimizer';
import { LinkedInWarmingService } from '@/lib/cache/linkedin-warming-service';
import { MultiLayerCache } from '@/lib/cache/multi-layer-cache';

export async function GET() {
  try {
    const cacheOptimizer = CacheOptimizer.getInstance();
    const warmingService = LinkedInWarmingService.getInstance();
    const multiLayerCache = MultiLayerCache.getInstance();

    // Get core stats from optimizer
    const optimizerStats = await cacheOptimizer.getStats();
    
    // Get warming status
    const warmingStatus = await warmingService.getStats();
    
    // Get multi-layer stats
    const multiLayerStats = await multiLayerCache.getStats();
    
    // Combine stats
    const stats = {
      ...optimizerStats,
      layerStats: {
        L1: {
          hitRate: multiLayerStats.overall.layerHitRates.L1,
          size: multiLayerStats.l1?.entryCount || 0,
          avgLatency: multiLayerStats.l1?.avgLatency || 0,
        },
        L2: {
          hitRate: multiLayerStats.overall.layerHitRates.L2,
          size: multiLayerStats.l2?.entryCount || 0,
          avgLatency: multiLayerStats.l2?.avgLatency || 0,
        },
        L3: {
          hitRate: multiLayerStats.overall.layerHitRates.L3,
          size: multiLayerStats.l3?.entryCount || 0,
          avgLatency: multiLayerStats.l3?.avgLatency || 0,
        },
      },
      warmingStatus: {
        isWarming: warmingStatus.isCurrentlyWarming,
        patternsConfigured: warmingStatus.patternsConfigured,
        highPriorityPatterns: warmingStatus.highPriorityPatterns,
        nextWarmingIn: warmingStatus.nextWarmingIn,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve cache statistics' },
      { status: 500 }
    );
  }
}