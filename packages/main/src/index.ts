import { app, BrowserWindow, dialog, Menu, MenuItem, ipcMain } from 'electron'
import { join } from 'path'
import { URL } from 'url'
import Store from 'electron-store'
import robot from 'robotjs'
import { GoodsTypes, importGoods } from './utils'
const store = new Store()

function initStore() {
  if (store.has('goods')) {
    // 老版本
    const config = store.get('config')
    const goods = store.get('goods')
    store.set('userName', '默认账户')
    store.set('userMap', {
      默认账户: {
        config,
        goods,
      },
    })
    store.delete('config')
    store.delete('goods')
  } else if (!store.has('userMap')) {
    // 新用户
    store.set('userName', '默认账户')
    store.set('userMap', {
      默认账户: {
        config: {
          codeInput: {
            x: 1350,
            y: 165,
          },
          autoInventory: false,
          hintInventory: false,
          showList: false,
          priceLimit: 5,
        },
        goods: {},
      },
    })
  }
}
initStore()

const isSingleInstance = app.requestSingleInstanceLock()
const isDevelopment = import.meta.env.MODE === 'development'

if (!isSingleInstance) {
  app.quit()
  process.exit(0)
}

app.disableHardwareAcceleration()

// Install "Vue.js devtools"
if (isDevelopment) {
  app
    .whenReady()
    .then(() => import('electron-devtools-installer'))
    .then(({ default: installExtension, VUEJS3_DEVTOOLS }) =>
      installExtension(VUEJS3_DEVTOOLS, {
        loadExtensionOptions: {
          allowFileAccess: true,
        },
      }),
    )
    .catch(e => console.error('Failed install extension:', e))
}

let mainWindow: BrowserWindow

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    alwaysOnTop: true,
    // movable: false,
    // maximizable: false,
    x: 0,
    y: 0,
    height: 300,
    width: 447,
    show: false, // Use 'ready-to-show' event to show window
    webPreferences: {
      preload: join(__dirname, '../../preload/dist/index.cjs'),
    },
  })

  /**
   * If you install `show: true` then it can cause issues when trying to close the window.
   * Use `show: false` and listener events `ready-to-show` to fix these issues.
   *
   * @see https://github.com/electron/electron/issues/25012
   */
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  let isOpenDevTools = false
  function toggleDevTools() {
    isOpenDevTools = !isOpenDevTools
    isOpenDevTools ? mainWindow.webContents.openDevTools() : mainWindow.webContents.closeDevTools()
  }
  function openFile(type?: GoodsTypes) {
    dialog
      .showOpenDialog(mainWindow, {
        title: '选择要导入的商品文件',
        properties: ['openFile'],
        filters: [{ name: 'Excel文件', extensions: ['csv'] }],
      })
      .then(result => {
        if (!result.canceled) {
          const goods = importGoods(result.filePaths[0], type)
          store.set('goods', goods)
          mainWindow.webContents.send('updated')
        }
      })
  }

  const menu = new Menu()
  menu.append(
    new MenuItem({
      label: '工具',
      submenu: [
        {
          label: '设置',
          click() {
            mainWindow.webContents.send('config')
          },
        },
        {
          accelerator: 'F12',
          label: '切换控制台',
          click: toggleDevTools,
        },
      ],
    }),
  )
  menu.append(
    new MenuItem({
      label: '商品管理',
      submenu: [
        {
          label: '清空商品',
          click: () => {
            store.set('goods', {})
            mainWindow.webContents.send('updated')
          },
        },
        {
          label: '导入卷烟商品',
          click: () => {
            openFile(GoodsTypes.Cigarette)
          },
        },
        {
          label: '导入普通商品',
          click: () => {
            openFile(GoodsTypes.Normal)
          },
        },
        {
          label: '更新全部商品',
          click: () => {
            openFile()
          },
        },
      ],
    }),
  )
  menu.append(
    new MenuItem({
      label: '账户管理',
      click() {
        mainWindow.webContents.send('user')
      },
    }),
  )

  Menu.setApplicationMenu(menu)

  ipcMain.on('sellGoods', (e, codeList: string[]) => {
    const name = store.get('userName')
    const configKey = `userMap.${name}.config`
    const config = store.get(configKey) as any
    const curr = robot.getMousePos()
    robot.moveMouse(config.codeInput.x, config.codeInput.y)
    robot.mouseClick()
    codeList.forEach(async code => {
      robot.typeStringDelayed(code, 5e3)
      robot.keyTap('enter')
    })
    robot.keyTap('enter')
    setTimeout(() => {
      robot.moveMouse(curr.x, curr.y)
    }, 200)
  })
  ipcMain.on('relaunch', () => {
    app.relaunch()
  })

  /**
   * URL for main window.
   * Vite dev server for development.
   * `file://../renderer/index.html` for production and test
   */
  const pageUrl =
    isDevelopment && import.meta.env.VITE_DEV_SERVER_URL !== undefined
      ? import.meta.env.VITE_DEV_SERVER_URL
      : new URL('../renderer/dist/index.html', 'file://' + __dirname).toString()

  await mainWindow.loadURL(pageUrl)
}

app.on('browser-window-blur', (event, window) => {
  window.setOpacity(0.7)
})
app.on('browser-window-focus', (event, window) => {
  window.setOpacity(1)
})

app.on('second-instance', () => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app
  .whenReady()
  .then(createWindow)
  .catch(e => console.error('Failed create window:', e))

// Auto-updates
if (import.meta.env.PROD) {
  app
    .whenReady()
    .then(() => import('electron-updater'))
    .then(({ autoUpdater }) => autoUpdater.checkForUpdatesAndNotify())
    .catch(e => console.error('Failed check updates:', e))
}
