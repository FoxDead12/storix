import { globSync } from 'glob';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import dotenv from 'dotenv';

dotenv.config();

const output_dir = process.env.BUILD_OUTPUT_DIR || 'dist';

// ... some entries (e.g. src/storix-photos.js, src/storix-files.js) are only
// ever reached through a dynamic `import('./name.js')` built from a route
// name at runtime, so rollup can't rewrite those call sites to the hashed
// filename by itself. This plugin writes out a manifest mapping the logical
// entry name to its final hashed filename, exposes it to the runtime as
// `window.__MANIFEST__` (see storix-app.js#importModule), and rewrites the
// `<script type="module" src="...">` tags in the already-copied html files
// to point at the hashed entry files ...
function hashManifestPlugin () {
  let manifest = {};
  return {
    name: 'hash-manifest',
    buildStart () {
      // ... clean the previous build so stale hashed files don't pile up
      // on every build ...
      fs.rmSync(output_dir, { recursive: true, force: true });
    },
    generateBundle (options, bundle) {
      manifest = {};
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          // ... strip the leading `src/` so keys/values match the plain
          // component names used at runtime (e.g. 'storix-photos') and the
          // basenames referenced from the html files ...
          const name = chunk.name.replace(/^src\//, '');
          const fileName = chunk.fileName.replace(/^src\//, '');
          manifest[name] = fileName;
        }
      }
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: JSON.stringify(manifest, null, 2)
      });
    },
    writeBundle (options) {
      const outDir = options.dir;

      // ... css is only copied (not bundled by rollup), so give it its own
      // content hash here and rename the file in place ...
      const cssManifest = {};
      for (const cssFile of globSync('*.css')) {
        const destPath = path.join(outDir, cssFile);
        if ( !fs.existsSync(destPath) ) continue;

        const content = fs.readFileSync(destPath);
        const hash = crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
        const ext = path.extname(cssFile);
        const base = path.basename(cssFile, ext);
        const hashedName = `${base}-${hash}${ext}`;

        fs.renameSync(destPath, path.join(outDir, hashedName));
        cssManifest[cssFile] = hashedName;
      }

      const manifestScript = `<script>window.__MANIFEST__=${JSON.stringify(manifest)};</script>`;

      for (const htmlFile of globSync('*.html')) {
        const destPath = path.join(outDir, htmlFile);
        if ( !fs.existsSync(destPath) ) continue;

        let html = fs.readFileSync(destPath, 'utf-8');

        html = html.replace(/(src="\/src\/)([\w-]+)(\.js")/g, (match, prefix, name, suffix) => {
          const hashed = manifest[name];
          return hashed ? `${prefix}${hashed}"` : match;
        });

        html = html.replace(/(href="\/)([\w-]+\.css)(")/g, (match, prefix, name, suffix) => {
          const hashed = cssManifest[name];
          return hashed ? `${prefix}${hashed}"` : match;
        });

        html = html.replace('</head>', `  ${manifestScript}\n</head>`);

        fs.writeFileSync(destPath, html);
      }
    }
  };
}

const array = Object.fromEntries(
  globSync('src/**/*.js').map(file => [
    // This removes `src/` as well as the file extension from each
    // file, so e.g. src/nested/foo.js becomes nested/foo
    path.relative(
      './',
      file.slice(0, file.length - path.extname(file).length)
    ),
    // This expands the relative paths to absolute paths, so e.g.
    // src/nested/foo becomes /project/src/nested/foo.js
    fileURLToPath(new URL(file, import.meta.url))
  ])
);

export default {
	input: array,
  output: {
    dir: output_dir,
    format: 'es',
    entryFileNames: '[name]-[hash].js',
    chunkFileNames: '[name]-[hash].js'
  },
  plugins: [
    resolve({
      browser: true, // se o código for para browser
      preferBuiltins: false
    }),
    commonjs(),
    copy({
      targets: [
        { src: '*.html', dest: output_dir },
        { src: '*.txt', dest: output_dir },
        { src: '*.css', dest: output_dir },
        { src: '**/*.ttf', dest: path.join(output_dir, 'public/fonts') },
        { src: '**/*.svg', dest: path.join(output_dir, 'public/svgs') },
        { src: '**/*.png', dest: path.join(output_dir, 'public/images') },
      ]
    }),
    hashManifestPlugin()
  ]
}
