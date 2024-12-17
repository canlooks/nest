/**
 * @example
 * class MyException extends Exception {
 *     statusCode = 500
 *     code = 'Server Error'
 *     message = '服务器内部错误'
 * }
 *
 * throw new MyException()
 */

export class Exception extends Error {
    statusCode?: number
    code?: string

    constructor(message?: string, info?: Record<string, any>) {
        super(message)
        info && Object.assign(this, info)
    }
}