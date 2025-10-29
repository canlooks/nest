import {ipcMain, IpcMainInvokeEvent} from 'electron'
import {findMatchedRoute, implementMatchedAction, Pattern} from '@canlooks/nest'
import {transformInvokeArgs} from './parameter'

export class ElectronIpcMain {
    static listen(channel: string) {
        ipcMain.handle(channel, this.listener)
    }

    private static listener(e: IpcMainInvokeEvent, pattern: Pattern, ...args: any[]) {
        const matchedRoute = findMatchedRoute(pattern)
        const newArgs = transformInvokeArgs(matchedRoute.item, e, ...args)
        return implementMatchedAction(matchedRoute, ...newArgs)
    }
}