import {Nest, Initialize} from '@canlooks/nest'
import {app as electron, BrowserWindow} from 'electron'
import {electronPlugin} from '../src'

class MainWindow {
    @Initialize
    async _() {
        await electron.whenReady()
        const win = new BrowserWindow({
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        })
        await win.loadURL('http://localhost:5188')
        win.webContents.openDevTools({mode: 'undocked'})
    }
}

Nest
    .extend(electronPlugin)
    .create([MainWindow])
    .then()