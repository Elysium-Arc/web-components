import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

mkdirSync('dist', { recursive: true });

await esbuild.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  format: 'esm',
  outfile: 'dist/bare-components.js',
  target: ['es2020'],
  minify: false,
});

await esbuild.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  format: 'esm',
  outfile: 'dist/bare-components.min.js',
  target: ['es2020'],
  minify: true,
});

await esbuild.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  format: 'cjs',
  outfile: 'dist/bare-components.cjs',
  target: ['es2020'],
  minify: false,
});

await esbuild.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  format: 'iife',
  globalName: 'BareComponents',
  outfile: 'dist/bare-components.iife.js',
  target: ['es2020'],
  minify: false,
});

await esbuild.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  format: 'iife',
  globalName: 'BareComponents',
  outfile: 'dist/bare-components.iife.min.js',
  target: ['es2020'],
  minify: true,
});

console.log('   Build complete!');
console.log('   dist/bare-components.js      - ESM bundle');
console.log('   dist/bare-components.min.js  - ESM bundle (minified)');
console.log('   dist/bare-components.cjs     - CommonJS bundle');
console.log('   dist/bare-components.iife.js - IIFE bundle (for <script> tags)');
console.log('   dist/bare-components.iife.min.js - IIFE bundle (minified)');
