const Vue = require('./js/vue')
const {ipcRenderer, remote} = require('electron')
const messages = require("./js/message_pb")
const uuid = require('uuid')

let sharedObject = remote.getGlobal("sharedObject")
let client = sharedObject.client

let modelData = {
    'userId': '18062743820',
    'pwd': 'konglk'

}

let vm = new Vue({
    el: '#app',
    data: modelData,
    methods: {
        login: function () {
            let message = new messages.ProtocolMessage()
            let req = new messages.ProtocolMessage.TRequest()
            req.setReqtype(messages.ProtocolMessage.RequestType.LOGIN)
            let clogin = new messages.CLogin()
            clogin.setMsgid(uuid.v1())
            clogin.setUserid(this.userId)
            clogin.setPwd(this.pwd)
            clogin.setDevicetype(messages.CLogin.DeviceType.WINDOWS)
            clogin.setTs(new Date().getTime())
            clogin.setVersion(1)
            req.setLogin(clogin)
            message.setRequest(req)
            let bytes = message.serializeBinary()
            client.write(Buffer.from(bytes))
        }
    }
})

client.on("data", function (bytes) {
    let message = messages.ProtocolMessage.deserializeBinary(bytes)
    console.log(message)
    let response = message.getResponse()
    // let respType = response.getResptype()
    let resp = response.getResp();
    console.log(resp)
    if (resp.getCode()== 200) {
        sharedObject.userId = resp.getUserid()
        sharedObject.certificate = resp.getCertificate()
        ipcRenderer.send('index-show')
    }
    else {
        remote.dialog.showErrorBox('error','用户名密码错误')
    }
})
