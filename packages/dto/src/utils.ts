import {JSONSchemaType} from 'ajv'
import {Dict, getMapValue} from '@canlooks/nest'
import {SchemaItem} from '..'

const DTOPrototype_JSONSchema = new WeakMap<object, JSONSchemaType<Dict>>()

/**
 * 得到从根节点(对象)开始的JSONSchema
 * @param prototype 
 */
export function generateJSONSchemaRoot(prototype: object) {
    return getMapValue(DTOPrototype_JSONSchema, prototype, () => ({
        type: 'object',
        properties: {},
        required: []
    } as JSONSchemaType<Dict>))
}

/**
 * 将内部使用的shema类型转换成标准的JSONSchema
 * @param schema 
 */
export function schemaItemToJSONSchema<T>(schema: SchemaItem<T>): JSONSchemaType<T> {
    if (typeof schema === 'object') {
        return schema
    }
    const JSONSchema = DTOPrototype_JSONSchema.get(schema.prototype)
    !JSONSchema && generateJSONSchemaRoot(schema.prototype)
    return JSONSchema as JSONSchemaType<T>
}

/**
 * 各属性修饰器生成的schema向根节点合并
 * @param prototype 
 * @param property 
 * @param JSONSchema 
 * @param type 
 */
export function mergeSchema<T = any>(prototype: Object, property: PropertyKey, JSONSchema: Partial<JSONSchemaType<T>> = {}, type?: string) {
    const schemaRoot = generateJSONSchemaRoot(prototype)
    const propertyItem: JSONSchemaType<any> = schemaRoot.properties[property] ||= {}
    const {type: _type, ...rest} = JSONSchema
    Object.assign(propertyItem, rest)

    type ||= _type
    if (!type) {
        return
    }
    if (!propertyItem.type) {
        propertyItem.type = type
    } else if (typeof propertyItem.type === 'string') {
        propertyItem.type = [propertyItem.type, type]
    } else {
        // propertyItem.type为数组
        propertyItem.type.push(type)
    }
}