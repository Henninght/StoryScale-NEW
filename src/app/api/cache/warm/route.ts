import { NextResponse } from 'next/server';
import { LinkedInWarmingService } from '@/lib/cache/linkedin-warming-service';
import { CacheOptimizer } from '@/lib/cache/cache-optimizer';

export async function POST() {
  try {
    const warmingService = LinkedInWarmingService.getInstance();
    const cacheOptimizer = CacheOptimizer.getInstance();
    
    // Start warming high-priority patterns
    await warmingService.warmHighPriorityPatterns();
    
    // Also trigger optimizer warming
    await cacheOptimizer.warmCache();
    
    return NextResponse.json({
      success: true,
      message: 'Cache warming initiated',
    });
  } catch (error) {
    console.error('Failed to warm cache:', error);
    return NextResponse.json(
      { error: 'Failed to warm cache' },
      { status: 500 }
    );
  }
}