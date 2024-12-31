declare namespace Nest {
    type Dict<T = any> = {[P: PropertyKey]: T}
    type ClassType<T = any> = new (...args: any[]) => T
    type Instances<T> = {
        [K in keyof T]: T[K] extends ClassType<infer I> ? I : never
    }

    class Nest {
        ready: Promise<any>
        /**
         * 应用插件，需要在Nest.create()之前调用
         * @param plugin
         * @param options
         */
        static use<O>(plugin: PluginDefinition<O>, options?: Partial<O>): typeof Nest

        /**
         * 创建应用
         * @param component 入口组件
         */
        static create<T>(component: ClassType<T>): Promise<T>
        static create<T extends ClassType[]>(components: T): Promise<Instances<T>>
        static create<T extends ClassType[]>(...components: T): Promise<Instances<T>>
        static create<T extends Dict<ClassType>>(components: T): Promise<Instances<T>>
    }

    type StructuredComponents = ClassType | ClassType[] | Dict<ClassType>

    /**
     * 类修饰器，被修饰的组件当作一个模块
     * @param components 与模块共同注册的组件列表
     */
    function Module(components: StructuredComponents): ClassDecorator

    /**
     * 方法修饰器，被修饰的方法会在组件初始化时执行
     */
    const Initialize: MethodDecorator & (() => MethodDecorator)

    /**
     * 属性修饰器，被修饰的属性会注入对应组件的实例
     * @param component
     */
    function Inject(component: ClassType): PropertyDecorator

    /**
     * 组件容器，用于管理组件实例
     * @private 组件由框架内部管理，通常无需操作容器
     */
    class Container {
        static register<T>(component: ClassType<T>, instance: T): void
        static get<T>(component: ClassType<T>): T | undefined
    }

    /**
     * ----------------------------------------------------------------
     * Controller
     */

    type PatternObject = {[p: PropertyKey]: any}

    type Pattern = string | PatternObject

    type RouteItem = {
        children: Map<Pattern, RouteItem>
        prototype?: Object
        property?: PropertyKey
        action?(...args: any[]): any
    }

    /**
     * 类修饰器，生成一个路由控制器
     * @param path 路径模式，默认使用类名作为路径
     * @param pattern 对象模式
     */
    const Controller: ClassDecorator & {
        (path?: string): ClassDecorator
        (pattern?: PatternObject): ClassDecorator
    }

    /**
     * 方法修饰器，生成一个路由方法
     * @param path 路径模式，默认为函数名作为路径
     * @param pattern 对象模式
     */
    const Action: MethodDecorator & {
        (path?: string): MethodDecorator
        (pattern?: PatternObject): MethodDecorator
    }

    /**
     * 调用路由中的方法
     * @param pattern 支持路径与对象模式
     * @param args 
     */
    function invoke(pattern: Pattern, ...args: any[]): any

    /**
     * 参数修饰器，被修饰的参数会赋值为路径中的param或query，路径模式的路由有效
     */
    const Param: ParameterDecorator & (() => ParameterDecorator)
    const Query: ParameterDecorator & (() => ParameterDecorator)

    type MatchedRoute = {
        item: Required<RouteItem>,
        params: Record<string, string>
        search: string | undefined
    }

    /**
     * @private 给插件内部调用，查找匹配的路由
     * @param pattern 
     */
    function findMatchedRoute(pattern: Pattern): MatchedRoute

    /**
     * @private 给插件内部调用，执行匹配的动作
     */
    function implementMatchedAction(matchedRoute: MatchedRoute, ...args: any[]): any

    /**
     * ----------------------------------------------------------------
     * Middleware
     */

    type NextMethod = (...nextArgs: any[]) => any

    type MiddlewareFunction = (next: NextMethod, ...prevArgs: any[]) => any

    const Provide: MethodDecorator & (() => MethodDecorator)

    type MiddlewareItem = MiddlewareFunction | ClassType

    function defineMiddleware<T extends MiddlewareFunction>(provider: T): T

    /**
     * 类修饰器，被修饰的类所有方法都使用中间件
     * @param middlewares 
     */
    function Consume(...middlewares: MiddlewareItem[]): ClassDecorator

    /**
     * 方法修饰器，被修饰的方法使用中间件
     * @param middlewares 
     */
    function Use(...middlewares: MiddlewareItem[]): MethodDecorator

    /**
     * ----------------------------------------------------------------
     * Exception
     */

    interface Exception extends Error {
        statusCode?: number
        code?: string
    }

    type ExceptionConstructor = new (message?: string, info?: Dict) => Exception

    const Exception: ExceptionConstructor

    /**
     * ----------------------------------------------------------------
     * utils
     */

    /**
     * @private 创建类的单一实例，接管new方法，通常为内部使用
     * @param Component 
     */
    function registerComponent<T>(Component: ClassType<T>): T

    /**
     * 得到组件的初始化函数的返回值，通常初始化函数返回promise时非常有用
     * @param component 组件静态类或实例
     * @returns {Promise<any[]>} 返回一个数组，因为Initialize方法可能有多个
     */
    function whenReady(component: ClassType | object): Promise<any[]>

    /**
     * 获取组件初始化函数的返回值
     * @alias {@link whenReady}
     * @param component 组件静态类或实例
     * @returns {Promise<any[]>} 返回一个Promise数组，因为Initialize方法可能有多个
     */
    function getInitialValue(component: ClassType | object): Promise<any[]>

    /** @private 定义通用的参数修饰器 */
    function commonParameterDecorator(map: WeakMap<object, Map<PropertyKey, number>>): ParameterDecorator

    /** @private 获取Map的值，找不到时赋上默认值 */
    function getMapValue<K, V>(data: Map<K, V>, key: K, defaultValue: () => V): V
    function getMapValue<K extends object, V>(map: WeakMap<K, V>, key: K, defaultValue: () => V): V

    type MethodDecoratorCallback = (instance: any, ...args: any[]) => any

    /** @private 注册方法修饰器 */
    function registerDecorator(prototype: object, callback: MethodDecoratorCallback): void

    /** @private 截断路径 */
    function truncatePath(path: string, truncate: string): string

    /**
     * ----------------------------------------------------------------
     * plugin
     */

    type PluginDefinition<O = any> = {
        name?: string
        options?: O
        setOptions?(options: Partial<O>): void
        onAppCreate?(): any
        onControllerRegister?(): void
        onActionCall?(pattern: Pattern, ...args: any[]): any
    }

    /**
     * 使用函数形式定义插件
     * @param plugin 
     */
    function definePlugin<O>(plugin: PluginDefinition<O>): PluginDefinition<O>

    /**
     * 类修饰器，被修饰的类作为插件
     */
    const Plugin: ClassDecorator & (() => ClassDecorator)

    /**
     * 属性修饰器，被修饰的属性作为插件选项
     */
    const Options: PropertyDecorator & (() => PropertyDecorator)

    const SetOptions: MethodDecorator & (() => MethodDecorator)
    const OnAppCreate: MethodDecorator & (() => MethodDecorator)
    const OnControllerRegister: MethodDecorator & (() => MethodDecorator)
}

export = Nest
