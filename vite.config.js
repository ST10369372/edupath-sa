import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'node_modules/tesseract.js/dist/worker.min.js', dest: 'ocr' },
        { src: 'node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js', dest: 'ocr' },
        { src: 'node_modules/@tesseract.js-data/eng/4.0.0/eng.traineddata.gz', dest: 'ocr' },
      ],
    }),
  ],
})
