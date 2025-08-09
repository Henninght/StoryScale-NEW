/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  
  // Exclude test files from build
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    }
    
    // Ignore Playwright and test files during build
    config.externals = config.externals || []
    config.externals.push({
      '@playwright/test': 'commonjs @playwright/test'
    })
    
    // Fix Supabase WebSocket critical dependency warnings
    const webpack = require('webpack')
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^ws$/,
        contextRegExp: /websocket-factory/,
      }),
      // Suppress the specific critical dependency warning
      new webpack.ContextReplacementPlugin(
        /\/websocket-factory\.js/,
        false
      )
    )
    
    // Disable critical warnings for expression-based requires
    config.module = {
      ...config.module,
      exprContextCritical: false,
      unknownContextCritical: false,
    }
    
    // Filter out specific problematic modules in Edge Runtime
    if (config.resolve.alias) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'ws': false,
      }
    } else {
      config.resolve.alias = { 'ws': false }
    }
    
    return config
  },
  
  // Exclude test files from compilation
  excludeDefaultMomentLocales: true,
  
  // Page extensions (don't include test files)
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  
  // Experimental features
  experimental: {
    optimizeCss: true,
  }
}

module.exports = nextConfig