import {Plugin} from 'vite'
import path from 'path'

export default function rendererIgnoreVitePlugin(options?: {
    mainDirPath?: string
    pattern?: RegExp
}): Plugin {
    const {
        mainDirPath = path.resolve(),
        pattern = /\.service\.(js|jsx|ts|tsx)$/
    } = options || {}

    return {
        name: 'electron-renderer-ignore',
        transform(_, id) {
            if (id.includes('node_modules')) {
                return
            }
            const relative = path.relative(mainDirPath, id)
            if (
                !relative.startsWith('..')
                && !path.isAbsolute(relative)
                && pattern.test(relative)
            ) {
                return 'export default {};'
            }
        }
    }
}