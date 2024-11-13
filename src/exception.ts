import {ExceptionCause} from '..'

export class Exception extends Error {
    static statusCode?: number
    static code?: string
    static message?: string

    constructor(message?: string, public override cause?: ExceptionCause) {
        const destruct = (msg = '', _cause: ExceptionCause = {}): [string, ExceptionCause] => {
            // 将error字段从cause中提出另外处理
            const {error, ...restCause} = _cause
            for (const k in restCause) {
                const v = restCause[k]
                const type = typeof v
                if (({string: true, number: true, boolean: true} as any)[type]) {
                    // 将第一个字母转成大写
                    const key = k.replace(k[0], k[0].toUpperCase())
                    const value = type === 'string' ? `"${v}"` : v
                    msg += `\r\n${key}: ${value}`
                }
            }
            if (error) {
                // error字段使用message或转成字符串
                msg += `\r\n${'-'.repeat(50)}\r\n${error.toString()}`
            }
            return [msg, _cause]
        }
        const [splicedMessage, splicedCause] = destruct(message, cause)

        super(splicedMessage, {cause: splicedCause})

        const {constructor} = Object.getPrototypeOf(this)
        // 读取静态message字段，拼接到message
        const msgDesc = Object.getOwnPropertyDescriptor(constructor, 'message')
        if (msgDesc?.value) {
            this.message += `\r\n${'-'.repeat(50)}\r\n${msgDesc.value}`
        }
        // 读取静态type与code字段，拼接到cause
        const mergeStatic = (p: 'statusCode' | 'code') => {
            const desc = Object.getOwnPropertyDescriptor(constructor, p)
            if (typeof desc?.value !== 'undefined') {
                this.cause = {
                    ...this.cause,
                    [p]: desc.value
                }
            }
        }
        mergeStatic('statusCode')
        mergeStatic('code')
    }
}