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