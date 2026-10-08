import { pluginReact } from '@rsbuild/plugin-react'
import { defineConfig } from '@rslib/core'

// dependencies and peerDependencies are externalised automatically; the type declarations are
// bundled into one file per format, so no internal module is published
export default defineConfig({
  source: { entry: { index: './src/index.tsx' } },
  lib: [
    { format: 'esm', dts: { bundle: true, autoExtension: true } },
    { format: 'cjs', dts: { bundle: true, autoExtension: true } },
  ],
  output: { target: 'web' },
  plugins: [pluginReact()],
})
