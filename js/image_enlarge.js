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
    imageUrl: '', widthData: '', heightData: '', enlargeSrc: 'imgs/enlarge.png', isEnlarge: true,
    narrowSrc: 'imgs/narrow.png', isNarrow: true
}

let vm = new Vue({
    el: '#app',
    data: d,
    created() {
        this.getImgUrl()
    },
    methods: {
        closeWin: function () {
            let curWin = remote.getCurrentWindow()
            curWin.close();
        },
        getImgUrl: function () {
            ipcRenderer.on('image-src', function (event, data) {
                d.imageUrl = data.src;
                console.info('data.imgUrl====' + data.src)
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
                    mainDivHeight = d.heightData = (image.height * maxWidth) / image.width
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
            if (flag) {
                d.widthData = img.width * 1.2
                d.heightData = img.height * 1.2
                enlargeClicks--, narrowClicks++
                if (enlargeClicks == 0) {
                    d.isEnlarge = false;
                    d.enlargeSrc = "imgs/enlarge-1.png";
                }
                if (d.narrowSrc == "imgs/narrow-1.png") {
                    d.narrowSrc = "imgs/narrow.png"
                    d.isNarrow = true;
                }
            } else {
                d.widthData = img.width / 1.2
                d.heightData = img.height / 1.2
                narrowClicks--, enlargeClicks++
                if (narrowClicks == 0) {
                    d.isNarrow = false;
                    d.narrowSrc = "imgs/narrow-1.png"
                }
                if (d.enlargeSrc == "imgs/enlarge-1.png") {
                    d.enlargeSrc = "imgs/enlarge.png"
                    d.isEnlarge = true;
                }
            }
        },
        //图片旋转
        rotation: function () {
            deg -= 90
            document.getElementById("img").style.transform = "rotate(" + deg + "deg)";
        }
    }
})

//lodash.debounce 防抖动函数，该函数会在100毫秒后调用resize方法
window.onresize = lodash.debounce(resize, 100)

function resize() {
    let windowWidth = $(window).width()
    let windowHeight = $(window).height()
    let curWin = remote.getCurrentWindow()
    if ((windowWidth > minWidth && windowWidth < screenWidth) || (windowHeight > minHeight + footerHeight + topHeight && windowHeight < screenHeight)) {
        $(".container, .main").width(windowWidth);
        $(".main").height(windowHeight - footerHeight - topHeight);
        $(".container").height(windowHeight);
    }
}
