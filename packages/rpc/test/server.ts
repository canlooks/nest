import {Action, Controller, Nest} from '@canlooks/nest'
import {rpcServerPlugin} from '../src'

@Controller
class TestRPCServerController {
    @Action
    async hello(a: any) {
        console.log(7, a)
        await new Promise(resolve => setTimeout(resolve, 1000))
        return 'hi'
    }
}

Nest
    .use(rpcServerPlugin, {port: 5173})
    .create(TestRPCServerController)
    .then()