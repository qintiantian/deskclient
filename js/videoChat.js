navigator.getUserMedia({video:true, audio:true}, stream => {
    //获取video的dom对象
    let myVideo = document.getElementById("myVideo");
    //为媒体流创建一个url指向
    if(window.URL){
        myVideo.src = window.URL.createObjectURL(stream);
    }
    rtVideo.autoplay = true;
}, error => {
    console.log(error)
})