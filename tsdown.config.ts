import { defineConfig } from 'tsdown';
export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  suppressWarnings: [/module level directive/],
  dts: true,
  sourcemap: true,
  clean: true,
  banner: { js: '"use client";' },
  deps: { neverBundle: ['react', 'react/jsx-runtime', 'react-hook-form'] },
});
