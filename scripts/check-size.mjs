// Fails when a built file grows past its limit (gzipped bytes). Run after `npm run build`.
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const limits = { 'dist/index.js': 30_000, 'dist/index.cjs': 31_000 } // about 20% above today's size
let failed = false
for (const [file, limit] of Object.entries(limits)) {
  const size = gzipSync(readFileSync(file)).length
  const ok = size <= limit
  failed ||= !ok
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${file}: ${size} bytes gzipped (limit ${limit})`)
}
process.exit(failed ? 1 : 0)
