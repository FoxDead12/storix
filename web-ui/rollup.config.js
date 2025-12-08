import { globSync } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import dotenv from 'dotenv';

dotenv.config();

const output_dir = process.env.BUILD_OUTPUT_DIR || 'dist';

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
    entryFileNames: '[name].js',
    chunkFileNames: '[name]-build.js'
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
    })
  ]
}
