import {Action, Controller, Nest} from '@canlooks/nest'
import {Rpc, RpcClient} from '../src'

@Controller
class TestRPCServerController {
    @Action
    async hello(msg: string) {
        console.log(7, msg)
        await new Promise(resolve => setTimeout(resolve, 1000))
        return 'hi'
    }
}

@RpcClient('http://localhost:5173')
@Controller
class TestRPCClientController {
    @Rpc(TestRPCServerController)
    testRPC!: TestRPCServerController

    @Action
    async sayHello(msg: string) {
        return await this.testRPC.hello(msg)
    }
}

Nest
    .create(TestRPCClientController)
    .then(async rpcClientController => {
        const res = await rpcClientController.sayHello('canlooks')
        console.log(25, res)
    })