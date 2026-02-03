const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell } = require('electron')
const path = require('path')
const Store = require('electron-store')

const store = new Store()

let mainWindow
let tray = null

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-iconTemplate.png')
  const trayIcon = nativeImage.createFromPath(iconPath)
  
  tray = new Tray(trayIcon.isEmpty() ? nativeImage.createEmpty() : trayIcon)
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Project Control 열기',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    { type: 'separator' },
    {
      label: '대시보드',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.webContents.send('navigate', 'dashboard')
        }
      }
    },
    { type: 'separator' },
    {
      label: '종료',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setToolTip('Project Control')
  tray.setContextMenu(contextMenu)
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 외부 링크는 기본 브라우저에서 열기
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // 창 닫기 시 숨기기 (트레이에서 계속 실행)
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  createTray()
})

app.on('window-all-closed', () => {
  // Mac에서는 트레이에서 계속 실행
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 창 닫기 버튼 클릭 시 숨기기 (종료 대신)
app.on('before-quit', () => {
  app.isQuitting = true
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC handlers
ipcMain.handle('load-data', () => {
  return store.get('projectData', { projects: [] })
})

ipcMain.handle('save-data', (event, data) => {
  store.set('projectData', data)
  return true
})

ipcMain.handle('open-style-guide', () => {
  const stylePath = path.join(__dirname, '../STYLE_GUIDE.md')
  shell.openPath(stylePath)
})
