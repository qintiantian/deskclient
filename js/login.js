const Vue = require('./js/vue')
const {ipcRenderer, remote} = require('electron')
const message_pb = require("./js/message_pb")
const msgBuilder = require('./js/message_builder')

let sharedObject = remote.getGlobal("sharedObject")
let client = sharedObject.client

let modelData = {
    userId: '18062743820',
    pwd: 'konglk',
    options: [
        {text: '孔令凯', value: '18062743820', pwd: 'konglk'},
        {text: '秦田', value: '18062742155', pwd: 'qintian'},
        {text: '毛毛', value: '18510396861', pwd: 'maomao'},
        {text: '点点', value: '13477907301', pwd: 'diandian'}
    ],

}

let vm = new Vue({
    el: '#app',
    data: modelData,
    methods: {
        login: function () {
            let bytes = msgBuilder.loginMessage(this.userId, this.pwd)
            client.write(bytes)
        }
    },
    watch: {
        userId: function (val) {
            for (let i in this.options) {
                if (this.options[i].value == val)
                    this.pwd = this.options[i].pwd
            }
        }
    }
})

client.on("data", function (bytes) {
    let message = message_pb.ProtocolMessage.deserializeBinary(bytes)
    console.log(message)
    let response = message.getResponse()
    // let respType = response.getResptype()
    let resp = response.getResp();
    console.log(resp)
    if (resp.getCode() == 200) {
        sharedObject.userId = resp.getUserid()
        sharedObject.certificate = resp.getCertificate()
        sharedObject.username = modelData.userId
        sharedObject.pwd = modelData.pwd
        ipcRenderer.send('index-show')
    }
    else {
        remote.dialog.showErrorBox('error', '用户名密码错误')
    }
})
