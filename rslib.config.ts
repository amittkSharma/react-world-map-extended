import { pluginReact } from '@rsbuild/plugin-react'
import { defineConfig } from '@rslib/core'

// dependencies and peerDependencies are externalised automatically
export default defineConfig({
  source: { entry: { index: './src/index.tsx' } },
  lib: [
    { format: 'esm', dts: { autoExtension: true } },
    { format: 'cjs', dts: { autoExtension: true } },
  ],
  output: { target: 'web' },
  plugins: [pluginReact()],
})
