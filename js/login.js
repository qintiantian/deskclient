const Vue = require('./js/vue')
const {ipcRenderer, remote} = require('electron')
const messages = require("./js/message_pb")
const uuid = require('uuid')

let modelData = {
    'userId':'',
    'pwd':''

}

let vm = new Vue({
    el: '#app',
    data:modelData,
    methods:{
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
            ipcRenderer.send('index-show')
        }
    }
})

let client= remote.getGlobal("sharedObject").client
