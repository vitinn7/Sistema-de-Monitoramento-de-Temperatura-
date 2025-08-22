/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Test configuration
  test: {
    // Environment
    environment: 'jsdom',
    
    // Setup files
    setupFiles: ['./src/test/setup.ts'],
    
    // Global test utilities
    globals: true,
    
    // Coverage configuration  
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      threshold: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      },
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/test/**/*',
        'src/vite-env.d.ts',
        'src/main.tsx'
      ]
    },
    
    // File patterns
    include: [
      'src/**/*.{test,spec}.{ts,tsx}'
    ],
    
    // Test timeout
    testTimeout: 10000,
    
    // Mock CSS imports
    css: true,
    
    // Environment variables for testing
    env: {
      NODE_ENV: 'test'
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
