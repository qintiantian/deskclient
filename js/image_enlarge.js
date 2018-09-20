const {ipcRenderer, remote} = require('electron')
const electron = require('electron')
const Vue = require('./js/vue')
const lodash = require('lodash')
const $ = require('jquery')

//图片最小宽度、图片最小高度、图片最大宽度、底部高度
let minWidth = 340, minHeight = 390, maxWidth = 830, footerHeight = 50, topHeight = 30
//屏幕宽度
let screenWidth = electron.screen.getPrimaryDisplay().workAreaSize.width;
//屏幕高度
let screenHeight = electron.screen.getPrimaryDisplay().workAreaSize.height;

let deg = 0 //旋转角度

let enlargeClicks = 12, narrowClicks = 6 //放大点击次数、缩小点击次数

let d = {
    imageUrl: '', widthData: '', heightData: '', prev: [], next: [],
    isLeft: true, isRight: true, isEnlarge: true, isNarrow: true
}

let vm = new Vue({
    el: '#app',
    data: d,
    created() {
        this.listenImage()
    },
    methods: {
        closeWin: function () {
            let curWin = remote.getCurrentWindow()
            curWin.close();
        },
        resetBrowserWindow: function(data) {
            let curWin = remote.getCurrentWindow()
            let naturalWidth = data.width
            let naturalHeight = data.height
            let screenWidth = electron.screen.getPrimaryDisplay().workAreaSize.width;//屏幕宽度
            let minWidth = 340; //图片最小宽度
            var minHeight = 390 //图片最小高度
            let maxWidth = 830;//图片最大宽度
            let borderHeight = 80 //顶部高度+底部高度 50+30
            let width, height;
            if(naturalWidth > screenWidth){
                width =  maxWidth;
                height = parseInt((naturalHeight * maxWidth) / naturalWidth + borderHeight);
            } else {
                if(naturalWidth < minWidth){
                    width = minWidth
                    height = minHeight + borderHeight
                } else {
                    width = naturalWidth
                    height = naturalHeight + borderHeight
                }
            }
            curWin.setSize(width, height)
            curWin.center()
        },
        setupData: function(data){
            d.imageUrl = data.src;
            d.prev = data.prev;
            d.next = data.next;
            d.prev == [] || d.prev.length == 0 ? d.isLeft = false : d.isLeft = true
            d.next == [] || d.next.length == 0 ? d.isRight = false : d.isRight = true
            console.info("src==" + data.src)
            console.info("prev==" + data.prev)
            console.info("next==" + data.next)
        },
        listenImage: function () {
            let _t = this;
            ipcRenderer.on('image-src', function (event, data) {
                _t.resetBrowserWindow(data)
                _t.setupData(data)
            })
        },
        //图片放大
        drawImage: function (event) {
            let imgD = event.target
            let image = new Image();
            image.src = imgD.src;
            let mainDivWidth, mainDivHeight;
            //假如图片长宽都不为零
            if (image.width > 0 && image.height > 0) {
                //如果图片要比屏幕宽
                if (image.width > screenWidth) {
                    mainDivWidth = d.widthData = maxWidth;
                    mainDivHeight = d.heightData = parseInt((image.height * maxWidth) / image.width)
                } else {
                    if (image.width < minWidth) {
                        d.widthData = image.width;
                        d.heightData = image.height;
                        mainDivWidth = minWidth
                        mainDivHeight = minHeight
                    } else {
                        mainDivWidth = d.widthData = image.width;
                        mainDivHeight = d.heightData = image.height;
                    }
                }
                document.getElementById("mainDiv").style.width = mainDivWidth + 'px';
                document.getElementById("mainDiv").style.height = mainDivHeight + 'px';
            }
        },
        enlarge: function (flag) {
            let img = document.getElementById("img")
            //放大
            if (flag) {
                d.widthData = img.width * 1.2
                d.heightData = img.height * 1.2
                enlargeClicks--, narrowClicks++
                if (enlargeClicks == 0) {
                    d.isEnlarge = false;
                }
                if (!d.isNarrow) {
                    d.isNarrow = true;
                }
                //缩小
            } else {
                d.widthData = img.width / 1.2
                d.heightData = img.height / 1.2
                narrowClicks--, enlargeClicks++
                if (narrowClicks == 0) {
                    d.isNarrow = false;
                }
                if (!d.isEnlarge) {
                    d.isEnlarge = true;
                }
            }
        },
        //图片旋转
        rotation: function () {
            deg -= 90
            document.getElementById("img").style.transform = "rotate(" + deg + "deg)";
        },
        //图片翻页
        page: function (flag) {
            //获取原始尺寸
            let image = new Image()
            //上一页
            if (flag) {
                image.src = d.prev[d.prev.length - 1];
                d.prev.pop();//删除最后一个元素
                d.next.unshift(d.imageUrl);//添加当前图片为第一个元素
                if (d.prev == [] || d.prev.length == 0) d.isLeft = false
                //下一页
            } else {
                image.src = d.next[0]
                d.prev.push(d.imageUrl) //添加当前图片为最后一个元素
                d.next.shift() //删除第一个元素
                if (d.next == [], d.next.length == 0) d.isRight = false;

            }
            let _t = this
            image.onload = function() {
                //callback(image.width, image.height);
                let naturalWidth = image.width
                let naturalHeight = image.height
                let data = {
                    width: naturalWidth, height: naturalHeight, src: image.src,
                    prev: d.prev, next: d.next
                }
                //ipcRenderer.send('image-enlarge', data)
                _t.resetBrowserWindow(data)
                _t.setupData(data)
            }
        }
    }
})

//lodash.debounce 防抖动函数，该函数会在100毫秒后调用resize方法
/*window.onresize = lodash.debounce(resize, 100)

function resize() {
    let windowWidth = $(window).width()
    let windowHeight = $(window).height()
    let curWin = remote.getCurrentWindow()
    if ((windowWidth > minWidth && windowWidth < screenWidth) || (windowHeight > minHeight + footerHeight + topHeight && windowHeight < screenHeight)) {
        $(".container, .main").width(windowWidth);
        $(".main").height(windowHeight - footerHeight - topHeight);
        $(".container").height(windowHeight);
    }
}*/
