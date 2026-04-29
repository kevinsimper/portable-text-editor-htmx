import * as esbuild from 'esbuild'

const watch = process.argv.includes('--watch')

const options = {
  entryPoints: ['src/client/editor.tsx'],
  bundle: true,
  format: 'iife',
  globalName: 'PortableTextEditor',
  outfile: 'public/client.js',
  jsx: 'automatic',
  jsxImportSource: 'react',
  loader: { '.tsx': 'tsx', '.ts': 'ts' },
  define: { 'process.env.NODE_ENV': watch ? '"development"' : '"production"' },
  minify: !watch,
  logLevel: 'info',
  target: ['es2020'],
}

if (watch) {
  const ctx = await esbuild.context(options)
  await ctx.watch()
  console.log('esbuild: watching src/client/editor.tsx')
} else {
  await esbuild.build(options)
}
