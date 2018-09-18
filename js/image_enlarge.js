const {ipcRenderer, remote} = require('electron')
const electron = require('electron')
const Vue = require('./js/vue')
const lodash = require('lodash')

let d = { imageUrl: '', widthData: '', heightData: ''}

let vm = new Vue({
    el: '#app',
    data: d,
    created(){
        this.getImgUrl()
    },
    methods: {
        getImgUrl: function () {
            ipcRenderer.on('image-src', function (event, data) {
                d.imageUrl = data.src;
                console.info('data.imgUrl===='+data.src)
            })
        },
        drawImage: function (event) {
            let imgD = event.target
            var image = new Image();
            //屏幕宽度
            var iwidth = electron.screen.getPrimaryDisplay().workAreaSize.width;
            //屏幕高度
            var iheight = electron.screen.getPrimaryDisplay().workAreaSize.height;
            let minwidth = 340; //图片最小宽度
            let minheight = 390 //图片最小高度
            let maxwidth = 830;//图片最大宽度
            let footerheight = 40 //底部高度
            image.src = imgD.src;
            //假如图片长宽都不为零
            if (image.width > 0 && image.height > 0) {
                    //如果图片要比屏幕宽
                    if (image.width > iwidth) {
                        d.widthData =  maxwidth;
                        d.heightData = (image.height * maxwidth) / image.width
                        document.getElementsByTagName("body")[0].style.width = d.widthData+'px';
                        document.getElementsByTagName("body")[0].style.height = d.heightData+footerheight+'px';
                        document.getElementById("mainDiv").style.width = d.widthData+'px';
                        document.getElementById("mainDiv").style.height = d.heightData+'px';
                    } else {
                        if (image.width < minwidth){
                           d.widthData = image.width;
                           d.heightData = image.height;
                           document.getElementsByTagName("body")[0].style.width = minwidth+'px';
                           document.getElementsByTagName("body")[0].style.height = minheight+footerheight+'px';
                           document.getElementById("mainDiv").style.width = minwidth+'px';
                           document.getElementById("mainDiv").style.height = minheight+'px';
                        } else {
                            d.widthData = image.width;
                            d.heightData = image.height;
                            document.getElementsByTagName("body")[0].style.width = d.widthData+'px';
                            document.getElementsByTagName("body")[0].style.height = d.heightData+footerheight+'px';
                            document.getElementById("mainDiv").style.width = d.widthData+'px';
                            document.getElementById("mainDiv").style.height = d.heightData+'px';
                        }
                    }
                }

            }
        }
})

window.onresize = lodash.debounce(function () {
    resize()
}, 100)

function resize(){
    $(".right").width($(window).width() - leftWidth - median);
    $(".left, .median, .right").height($(window).height())
    $(".chat-area").height($(window).height() - topHeight - bottomHeight)
}