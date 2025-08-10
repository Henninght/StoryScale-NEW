import { NextResponse } from 'next/server';
import { CacheOptimizer } from '@/lib/cache/cache-optimizer';

export async function POST() {
  try {
    const cacheOptimizer = CacheOptimizer.getInstance();
    
    // Run optimization
    await cacheOptimizer.optimizeDistribution();
    
    // Get updated stats
    const stats = await cacheOptimizer.getStats();
    
    return NextResponse.json({
      success: true,
      message: 'Cache optimization completed',
      stats,
    });
  } catch (error) {
    console.error('Failed to optimize cache:', error);
    return NextResponse.json(
      { error: 'Failed to optimize cache' },
      { status: 500 }
    );
  }
}