import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  ignore: [
    'src/components/ui/**',
    'src/tanstack-table.d.ts',
    // The bundled Laravel API: not part of the frontend build, and its
    // vendor/ directory is full of third-party JS knip would report on.
    'TestAPI/**',
  ],
}

export default config