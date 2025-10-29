import {defineConfig} from 'vite'
import path from 'path'

export default defineConfig({
    root: path.resolve('test'),
    base: './',
    server: {
        port: 5188
    }
})