const {app, BrowserWindow, ipcMain} = require('electron')
const electron = require('electron')
const path = require('path')
const net =  require('net')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win={}

ipcMain.on('index-show', function () {
    win.mainWin = new BrowserWindow({width:850, height: 550, autoHideMenuBar: true, titleBarStyle: 'hiddenInset', frame:false})
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
    if(data) {
        v.webContents.on('did-finish-load', function () {
            v.webContents.send('info', data)
        })
    }
    v.webContents.send('info', 'aaa')
})

ipcMain.on('image-enlarge', function(event, data){
    /*win.imageEnlargeWin = new BrowserWindow({width: data.width+20, height: data.height+82, minWidth: 350, minHeight: 385,
        maxWidth: 930, maxHeight: 662, autoHideMenuBar: true, center: true, minimizable: false, maximizable: false})*/
    let naturalWidth = data.width
    let naturalHeight = data.height
    let iwidth = electron.screen.getPrimaryDisplay().workAreaSize.width;//屏幕宽度
    let minwidth = 340; //图片最小宽度
    var minheight = 390 //图片最小高度
    let maxwidth = 830;//图片最大宽度
    let boarderheight = 60 //底部高度+边框高度
    let width, height;
    if(naturalWidth > iwidth){
        width =  maxwidth;
        height = (naturalHeight * maxwidth) / naturalWidth + boarderheight;
    } else {
        if(naturalWidth < minwidth){
            width = minwidth
            height = minheight + boarderheight
        } else {
            width = naturalWidth
            height = naturalHeight + boarderheight
        }
    }
    win.imageEnlargeWin = new BrowserWindow({width: width, height: height, autoHideMenuBar: true, center: true})
    let imgV = win.imageEnlargeWin;
    imgV.setTitle('')
    imgV.loadFile('image-enlarge.html')
    imgV.webContents.openDevTools()
    imgV.webContents.on('did-finish-load', function () {
        imgV.webContents.send('image-src', data)
    })
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

let host='39.106.133.40'
// let host='localhost'
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
    pwd:''
}