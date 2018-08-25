const {app, BrowserWindow, ipcMain} = require('electron')
const net =  require('net')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win=[]

ipcMain.on('index-show', function () {
    win[1] = new BrowserWindow({width:850, height: 600, autoHideMenuBar: true, backgroundColor:'#F5F5F5'})
    let indexWin = win[1]
    indexWin.loadFile('index.html')
    indexWin.webContents.openDevTools()
    indexWin.on('closed', () => {
        client.destroy()
        win[1] = null
    })
     win[0].close()
})

function createWindow () {
    // 创建浏览器窗口。850 600
    win[0] = new BrowserWindow({width: 290, height: 410, autoHideMenuBar : true, backgroundColor:'#F5F5F5'})
    let mainWin = win[0]
    // 然后加载应用的 index.html。
    mainWin.loadFile('login.html')

    // 打开开发者工具
    mainWin.webContents.openDevTools()

    // 当 window 被关闭，这个事件会被触发。
    mainWin.on('closed', () => {
        win[0] = null
    })
}

// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', createWindow)

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活。
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // 在macOS上，当单击dock图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (win === null) {
        createWindow()
    }
})

var host='localhost'
var port='8090'
let client = new net.Socket()
client.connect(port, host, function () {
    console.log('connect')
})

global.sharedObject = {
    client: client
}