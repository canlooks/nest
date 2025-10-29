import {Options as AjvOptions, JSONSchemaType} from 'ajv'
import {ClassType, PluginDefinition} from '@canlooks/nest'

declare namespace NestPluginDTO {
    const dtoPlugin: PluginDefinition<{}>

    /**
     * 设置全局选项
     * @param option 
     */
    function setGlobalOption(option: AjvOptions): void

    type SchemaItem<T = any> = JSONSchemaType<T> | ClassType

    type DTOOptions = {
        /** @see https://ajv.js.org/json-schema.html#additionalproperties */
        additionalProperties?: boolean | SchemaItem
        /** @see https://ajv.js.org/json-schema.html#unevaluatedproperties */
        unevaluatedProperties?: boolean | SchemaItem
        /** @see https://ajv.js.org/json-schema.html#patternproperties */
        patternProperties?: Record<string, SchemaItem>
        /** @see https://ajv.js.org/json-schema.html#maxproperties-minproperties */
        minProperties?: number
        maxProperties?: number
    }

    /**
     * 类修饰器，会生成一个type为"object"的JSONSchema作为根节点
     * @param options 
     */
    const DTO: ClassDecorator & {
        (options?: DTOOptions): ClassDecorator
        Obj: typeof Obj
        Num: typeof Num
        Int: typeof Int
        Str: typeof Str
        Bool: typeof Bool
        Arr: typeof Arr
        Required: typeof Required
        Enum: typeof Enum
        Const: typeof Const
    }

    function Obj<T = any>(schema: SchemaItem<T>): PropertyDecorator

    /** 数字类型 ---------------------------------------------------------------- */

    type NumberOptions = {
        minimum?: number
        maximum?: number
        exclusiveMinimum?: number
        exclusiveMaximum?: number
        multipleOf?: number
    }

    const Num: PropertyDecorator & ((options?: NumberOptions) => PropertyDecorator)
    const Int: PropertyDecorator & ((options?: NumberOptions) => PropertyDecorator)

    /** 字符串类型 ---------------------------------------------------------------- */

    type StringOptions = {
        minLength?: number
        maxLength?: number
        pattern?: string
        /**
         * 需要ajv-formats插件{@link https://github.com/ajv-validator/ajv-formats}
         * @see https://ajv.js.org/json-schema.html#format
         */
        format?: string
    }

    const Str: PropertyDecorator & ((options?: StringOptions) => PropertyDecorator)

    /** 布尔类型 ---------------------------------------------------------------- */

    const Bool: PropertyDecorator & (() => PropertyDecorator)

    /** 数组类型 ---------------------------------------------------------------- */

    type ArrayOptions = {
        items: SchemaItem | SchemaItem[]
        contains?: SchemaItem
        minItems?: number
        maxItems?: number
        minContains?: number
        maxContains?: number
        uniqueItems?: true
        additionalItems?: never
    }

    function Arr<T>(items: SchemaItem<T>): PropertyDecorator
    function Arr(options: ArrayOptions): PropertyDecorator

    /** 声明该属性是必须的 */
    const Required: PropertyDecorator & (() => PropertyDecorator)

    /** 声明该属性是枚举类型 */
    function Enum(...values: any[]): PropertyDecorator

    /** 声明该属性的值是唯一的，@example @Const('foo')，则该属性只能为"foo" */
    function Const(value: any): PropertyDecorator

    type ValidateOptions = {
        /** 是否允许为null，@default false */
        nullable?: boolean
        /** 是否禁止为undefined，@default true */
        required?: boolean
    }

    /**
     * 参数修饰器，被修饰的参数会经过dto类校验
     * @param dto 
     */
    const Validate: {
        (dto: ClassType, options?: ValidateOptions): ParameterDecorator
        /** @alias Validate Validate(dto, { required: false }) */
        Optional(dto: ClassType): ParameterDecorator
        /** @alias Validate Validate(dto, { nullable: true }) */
        Nullable(dto: ClassType): ParameterDecorator
    }
}

export = NestPluginDTO