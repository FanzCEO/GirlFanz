#!/usr/bin/env node

// Custom build script for Vite that works around top-level await issues
const { build } = require('vite');
const path = require('path');

async function buildApp() {
  console.log('🔨 Building Vite application...');
  
  try {
    // Build configuration without problematic plugins
    await build({
      root: path.resolve(__dirname, 'client'),
      build: {
        outDir: path.resolve(__dirname, 'dist/public'),
        emptyOutDir: true,
        rollupOptions: {
          onwarn: (warning, warn) => {
            // Suppress specific warnings that aren't critical
            if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
            warn(warning);
          }
        }
      },
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "client", "src"),
          "@shared": path.resolve(__dirname, "shared"),
          "@assets": path.resolve(__dirname, "attached_assets"),
        },
      },
      plugins: [
        // Only include the React plugin, skip Replit plugins
        require('@vitejs/plugin-react').default()
      ],
      css: {
        postcss: {
          plugins: []
        }
      },
      server: {
        fs: {
          strict: true,
          deny: ["**/.*"],
        },
      },
      logLevel: 'info',
    });
    
    console.log('✅ Vite build completed successfully!');
    console.log('📦 Output directory: dist/public');
    
    // Build server TypeScript files
    console.log('🔧 Compiling server TypeScript files...');
    const { spawn } = require('child_process');
    const tscPath = require.resolve('typescript/bin/tsc');
    const tscChild = spawn(process.execPath, [tscPath, '--project', 'tsconfig.server.json', '--noEmit', 'false'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    tscChild.on('exit', (tscCode) => {
      if (tscCode === 0) {
        console.log('✅ Server build completed successfully!');
      } else {
        console.log('❌ Server build failed with exit code:', tscCode);
      }
      process.exit(tscCode);
    });
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildApp();