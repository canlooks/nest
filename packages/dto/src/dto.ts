import {ArrayOptions, DTOOptions, NumberOptions, SchemaItem, ValidateOptions} from '..'
import Ajv, {Options as AjvOptions, ValidateFunction} from 'ajv'
import {ClassType, Exception, getMapValue, registerDecorator} from '@canlooks/nest'
import {generateJSONSchemaRoot, mergeSchema, schemaItemToJSONSchema} from './utils'

let ajv = new Ajv()

/**
 * 设置全局选项
 * @param option
 */
export function setGlobalOption(option: AjvOptions) {
    ajv = new Ajv(option)
}

/**
 * --------------------------------------------------------------------
 * 类修饰器，生成JSONschema根节点
 */

export function DTO(target: ClassType): void
export function DTO(options?: DTOOptions): (target: ClassType) => void
export function DTO(a?: any): any {
    const fn = (options: DTOOptions = {}) => {
        return (target: ClassType) => {
            // 对象或funciton类型的选项，需要转换成JSONSchema
            if (typeof options.additionalProperties === 'object' || typeof options.additionalProperties === 'function') {
                options.additionalProperties = schemaItemToJSONSchema(options.additionalProperties)
            }
            if (typeof options.unevaluatedProperties === 'object' || typeof options.unevaluatedProperties === 'function') {
                options.unevaluatedProperties = schemaItemToJSONSchema(options.unevaluatedProperties)
            }
            if (options.patternProperties) {
                for (const k in options.patternProperties) {
                    options.patternProperties[k] = schemaItemToJSONSchema(options.patternProperties[k])
                }
            }
            const schema = generateJSONSchemaRoot(target.prototype)
            Object.assign(schema, options)
        }
    }
    return typeof a === 'function' ? fn()(a) : fn(a)
}

DTO.Obj = Obj
DTO.Num = Num
DTO.Int = Int
DTO.Str = Str
DTO.Bool = Bool
DTO.Arr = Arr
DTO.Required = Required
DTO.Nullable = Nullable
DTO.Enum = Enum
DTO.Const = Const

/**
 * --------------------------------------------------------------------
 * 属性修饰器，定义属性类型
 */

export function Obj<T = any>(dto: SchemaItem<T>) {
    return (prototype: Object, property: PropertyKey) => {
        const JSONSchema = schemaItemToJSONSchema(dto)
        if (typeof JSONSchema !== 'object' || JSONSchema === null) {
            throw new Exception('[@canlooks/nest] Invalid schema in "@Obj()" decorator', {
                position: `${prototype.constructor.name}.${property.toString()}`,
                schema: dto
            })
        }
        mergeSchema(prototype, property, JSONSchema)
    }
}

export function Num(prototype: Object, property: PropertyKey): void
export function Num(options?: NumberOptions): PropertyDecorator
export function Num(a?: any, b?: any): any {
    const fn = (options?: NumberOptions) => (prototype: Object, property: PropertyKey) => {
        mergeSchema(prototype, property, options, 'number')
    }
    return typeof b !== 'undefined' ? fn()(a, b) : fn(a)
}

export function Int(prototype: Object, property: PropertyKey): void
export function Int(options?: NumberOptions): PropertyDecorator
export function Int(a?: any, b?: any): any {
    const fn = (options?: NumberOptions) => (prototype: Object, property: PropertyKey) => {
        mergeSchema(prototype, property, options, 'interger')
    }
    return typeof b !== 'undefined' ? fn()(a, b) : fn(a)
}

export function Str(prototype: Object, property: PropertyKey): void
export function Str(options?: NumberOptions): PropertyDecorator
export function Str(a?: any, b?: any): any {
    const fn = (options?: NumberOptions) => (prototype: Object, property: PropertyKey) => {
        mergeSchema(prototype, property, options, 'string')
    }
    return typeof b !== 'undefined' ? fn()(a, b) : fn(a)
}

export function Bool(prototype: Object, property: PropertyKey): void
export function Bool(): PropertyDecorator
export function Bool(a?: any, b?: any): any {
    const fn = (prototype: Object, property: PropertyKey) => {
        mergeSchema(prototype, property, {}, 'boolean')
    }
    return a ? fn(a, b) : fn
}

export function Arr<T = any>(items: SchemaItem<T>): PropertyDecorator
export function Arr(options: ArrayOptions): PropertyDecorator
export function Arr(a: any) {
    return (prototype: Object, property: PropertyKey) => {
        // 有items字段，表示a为options，否则将a当作items
        const options = a.items ? a : {items: a}
        options.items = Array.isArray(options.items)
            ? options.items.map(schemaItemToJSONSchema)
            : schemaItemToJSONSchema(options.items)
        if (typeof options.items !== 'object' || options.items === null) {
            throw new Exception('[@canlooks/nest] Invalid schema in "@Arr()" decorator', {
                position: `${prototype.constructor.name}.${property.toString()}`,
                schema: a
            })
        }
        if (options.contains) {
            options.contains = schemaItemToJSONSchema(options.contains)
        }
        mergeSchema(prototype, property, options, 'array')
    }
}

export function Required(prototype: Object, property: PropertyKey): void
export function Required(): PropertyDecorator
export function Required(a?: any, b?: any): any {
    const fn = (prototype: Object, property: PropertyKey) => {
        generateJSONSchemaRoot(prototype).required.push(property)
    }
    return a ? fn(a, b) : fn
}

export function Nullable(prototype: Object, property: PropertyKey): void
export function Nullable(): PropertyDecorator
export function Nullable(a?: any, b?: any): any {
    const fn = (prototype: Object, property: PropertyKey) => {
        mergeSchema(prototype, property, {nullable: true})
    }
    return a ? fn(a, b) : fn
}

export function Enum(...values: any[]) {
    return (prototype: Object, property: PropertyKey) => {
        mergeSchema(prototype, property, {enum: values})
    }
}

export function Const(value: any) {
    return (prototype: Object, property: PropertyKey) => {
        mergeSchema(prototype, property, {const: value})
    }
}

/**
 * --------------------------------------------------------------------
 * 参数修饰器，执行校验
 */

const DTOPrototype_validateFunction = new WeakMap<object, ValidateFunction>()

export function Validate(dto: ClassType, options?: ValidateOptions) {
    return (prototype: Object, property: PropertyKey | undefined, index: number) => {
        typeof property !== 'undefined' && registerDecorator(prototype, instance => {
            const oldMethod = instance[property]
            instance[property] = (...args: any[]) => {
                const argValue = args[index]
                if (typeof argValue === 'undefined' && options?.required === false) {
                    // 参数值为undefined，且options.required为false，则跳过校验
                    return oldMethod.apply(instance, args)
                }
                if (argValue === null && options?.nullable) {
                    // 允许为null，跳过校验
                    return oldMethod.apply(instance, args)
                }
                const schema = generateJSONSchemaRoot(dto.prototype)
                const validateFunction = getMapValue(DTOPrototype_validateFunction, dto.prototype, () => {
                    return ajv.compile(schema)
                })
                if (!validateFunction(argValue)) {
                    throw new Exception(validateFunction.errors?.[0]?.message, {
                        statusCode: 400,
                        code: 'INVALID_PARAMETER',
                        position: `${prototype.constructor.name}.${property.toString()}`,
                        parameter: index,
                        value: argValue,
                        error: ajv.errors?.[0]
                    })
                }
                return oldMethod.apply(instance, args)
            }
        })
    }
}

Validate.Optional = (dto: ClassType) => {
    return Validate(dto, {required: false})
}

Validate.Nullable = (dto: ClassType) => {
    return Validate(dto, {nullable: true})
}