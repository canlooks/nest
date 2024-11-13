import {Action, Controller, invoke, Nest, SubController} from '../src'

@Controller
class HelloController {
    @Action
    hi() {
        return 'haha'
    }
}

@Controller('index')
class IndexController {
    @Action
    @SubController(HelloController)
    sub() {
        return 'this is sub'
    }
}

Nest.create([HelloController, IndexController]).then(async () => {
    const res = await invoke('index/sub/hi')
    console.log(20, res)
})