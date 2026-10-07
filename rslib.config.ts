import { pluginReact } from '@rsbuild/plugin-react'
import { defineConfig } from '@rslib/core'

// Externals are listed explicitly (autoExternal off) so the small en.json locale is inlined:
// a bare `import ... from 'pkg/x.json'` would break native Node ESM consumers.
const output = {
  target: 'web' as const,
  autoExternal: false,
  externals: [
    /^react(\/.*)?$/,
    'react-svg-worldmap',
    'i18n-iso-countries',
    'i18n-iso-countries-extended-info',
  ],
}

export default defineConfig({
  source: { entry: { index: './src/index.tsx' } },
  lib: [
    { format: 'esm', dts: { autoExtension: true }, output },
    { format: 'cjs', dts: { autoExtension: true }, output },
  ],
  plugins: [pluginReact()],
})
