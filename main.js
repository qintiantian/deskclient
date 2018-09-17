const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const net =  require('net')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win={}

ipcMain.on('index-show', function () {
    win.mainWin = new BrowserWindow({width:850, height: 600, autoHideMenuBar: true, backgroundColor:'#F5F5F5'})
    let indexWin = win.mainWin
    indexWin.setMinimumSize(720,500)
    indexWin.setTitle('')
    indexWin.loadFile('index.html')
    indexWin.webContents.openDevTools()
    indexWin.on('closed', () => {
        client.destroy()
        win[1] = null
    })
     win.loginWin.close()
})

ipcMain.on('video-chat', function(event, data) {
    let v = new BrowserWindow({width:600,height:500,autoHideMenuBar: true})
    win.videoChatWin = v
    v.loadFile('video-chat.html')
    // v.loadFile('client.html')
    v.webContents.openDevTools()
    v.webContents.send('info', 'aaa')
})

function createWindow () {
    // 创建浏览器窗口。850 600
    win.loginWin = new BrowserWindow({width: 290, height: 410, autoHideMenuBar : true, backgroundColor:'#F5F5F5'})
    let loginWin = win.loginWin
    // 然后加载应用的 index.html。
    loginWin.loadFile('login.html')

    // 打开开发者工具
    // mainWin.webContents.openDevTools()

    // 当 window 被关闭，这个事件会被触发。
    loginWin.on('closed', () => {
        win.loginWin = null
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

// let host='39.106.133.40'
let host='localhost'
let tcpport='8090'
let client = new net.Socket()
client.connect(tcpport, host, function () {
    console.log('connect')
})

global.sharedObject = {
    client: client,
    userId:'',
    certificate:'',
    url:'http://'+host+'/ims',
    imgUrl:'http://39.106.133.40',
    host:host,
    tcpport:tcpport,
    timeout:5000,
    username:'',
    pwd:'',
    chatPerson:{}
}