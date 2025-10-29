import {Plugin} from 'vite'

/**
 * vite插件，若遇到vite无法编译node模块的情况可使用此插件
 * @param options
 */
export default function rendererIgnoreVitePlugin(options?: {
    /**
     * 主进程所在的文件夹路径
     */
    mainDirPath?: string
    /**
     * 判断逻辑，默认为`/\.service\.(js|jsx|ts|tsx)$/`，如`example.service.ts`文件将会排除
     */
    pattern?: RegExp
}): Plugin