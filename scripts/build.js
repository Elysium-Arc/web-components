import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync } from 'fs';
import { dirname, join } from 'path';

mkdirSync('dist', { recursive: true });
mkdirSync('public', { recursive: true });

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

const examplesDir = 'examples';
const publicDir = 'public';

if (existsSync(examplesDir)) {
  const files = readdirSync(examplesDir);
  for (const file of files) {
    copyFileSync(join(examplesDir, file), join(publicDir, file));
  }
}

copyFileSync('dist/bare-components.js', join(publicDir, 'bare-components.js'));
copyFileSync('dist/bare-components.min.js', join(publicDir, 'bare-components.min.js'));

let indexHtml = readFileSync(join(publicDir, 'index.html'), 'utf-8');

indexHtml = indexHtml.replace(
  /import\s*\{[^}]*\}\s*from\s*["']\.\.\/src\/index\.js["']/g,
  'import { registerAll, WcToast } from "./bare-components.min.js"'
);

writeFileSync(join(publicDir, 'index.html'), indexHtml);

console.log('\n   Deployment build complete!');
console.log('   public/ - Ready for Netlify/Vercel/static hosting');

