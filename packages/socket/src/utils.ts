/**
 * 将字符串转驼峰写法
 * @param str
 */
export function camelCase(str: string) {
    return stringCaser(str, (p, c, i) => {
        return i
            ? p + c[0].toUpperCase() + c.slice(1).toLowerCase()
            : p + c.toLowerCase()
    })
}

/**
 * 将字符串转分隔符写法
 * @param str
 * @param separator @default '-'
 */
export function segmentCase(str: string, separator = '-') {
    return stringCaser(str, (p, c, i) => {
        return p + (i ? separator : '') + c.toLowerCase()
    })
}

/**
 * 将字符串转连字符写法
 * @alias {@link segmentCase}
 * @param str
 */
export const kebabCase = segmentCase

/**
 * 将字符串转下划线写法
 * @alias {@link segmentCase}
 * @param str
 */
export function snakeCase(str: string) {
    return segmentCase(str, '_')
}

/**
 * 将字符串转标题写法
 * @param str
 */
export function startCase(str: string) {
    return stringCaser(str, (p, c, i) => {
        return p + (i ? ' ' : '') + c[0].toUpperCase() + c.slice(1).toLowerCase()
    })
}

/**
 * @private 通用方法 {@link camelCase} {@link segmentCase} {@link kebabCase} {@link startCase}
 * @param str
 * @param callback
 */
function stringCaser(str: string, callback: (prev: string, current: string, index: number) => string) {
    const symbolPattern = /[^0-9a-zA-Z]+/
    // 包含符号与不包含符号使用不同的匹配规则
    const containSymbol = symbolPattern.test(str)
    const words = containSymbol
        ? str.split(symbolPattern)
        : str.match(/[0-9a-zA-Z][0-9a-z]*/g)
    if (!words) {
        return str
    }
    let result = ''
    let index = 0
    for (let i = 0, {length} = words; i < length; i++) {
        const current = words[i]
        if (current) {
            result = callback(result, current, index)
            index++
        }
    }
    return result
}

/**
 * 命名的转换
 * @param str
 * @param strategy
 */
export function nameStrategy(str: string, strategy: 'origin' | 'camelCase' | 'kebabCase' | 'snakeCase' | 'startCase' = 'origin') {
    if (strategy === 'origin') {
        return str
    }
    const method = {
        camelCase,
        segmentCase,
        kebabCase,
        snakeCase,
        startCase
    }[strategy]
    return method(str)
}