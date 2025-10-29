import {Action, Controller, Nest} from '@canlooks/nest'
import {Body, Post, httpPlugin} from '../src'

@Controller('/')
class TestController {
    @Post
    async upload(@Body body: any) {
        console.log(9, body)
        return {
            a: 0,
        }
    }
}

Nest.use(httpPlugin, {
    port: 3000
}).create([TestController])