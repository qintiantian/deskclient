const Vue = require('./js/vue')
const messages = require("./js/message_pb")
const $ = require('jquery')
const uuid = require('uuid')
const remote = require('electron').remote

let client = remote.getGlobal("sharedObject").client
const modelData = {
    user: {
        "nickname": "千里阵云",
        "userId": "konglk",
        "imgUrl": "imgs/konglk.jpg"
    },
    chatPerson: {
        "nickname": "左耳",
        "userId": "qintian",
        "imgUrl": "imgs/qintian.jpg"
    },
    conversations: [
        {
            "imgUrl": "imgs/qintian.jpg",
            "nickname": "秦田",
            "lastMsg": "我到家了",
            "lastDate": "星期三"
        },
        {
            "imgUrl": "imgs/qintian.jpg",
            "nickname": "老婆",
            "lastMsg": "放假，我到家了",
            "lastDate": "星期五"
        }
    ],
    messages: [
        {
            "userId": "konglk",
            "destId": "qintian",
            "content": "吃饭了吗？",
            "createtime": "2018-08-17",
            "msgType": ""
        },
        {
            "userId": "qintiant",
            "destId": "kong",
            "content": "吃了，你呢？",
            "createtime": "2018-08-17",
            "msgType": ""
        },
        {
            "userId": "konglk",
            "destId": "qintian",
            "content": "我吃了，马上回家",
            "createtime": "2018-08-17",
            "msgType": ""
        },
        {
            "userId": "qintiant",
            "destId": "kong",
            "content": "好的",
            "createtime": "2018-08-17",
            "msgType": ""
        }
    ]

};

let vm = new Vue({
    el: '#app',
    data: modelData,
    methods:{
        sendMsg: function (event) {
            let content = $('.content').val()
            let message = new messages.ProtocolMessage()
            let req = new messages.ProtocolMessage.TRequest()
            req.setReqtype(messages.ProtocolMessage.RequestType.CHAT)
            let chat = new messages.CPrivateChat()
            chat.setMsgid(uuid.v1())
            chat.setContent(Buffer.from(content))
            chat.setDestid(destId)
            chat.setUserid(this.user.userId)
            chat.setChattype(messages.CPrivateChat.ChatType.ONE2ONE)
            chat.setDatatype(messages.CPrivateChat.DataType.TXT)
            req.setChat(chat)
            message.setRequest(req)
            let bytes = message.serializeBinary()
            client.write(Buffer.from(bytes))
            $('.content').val('')
            let m = {
                    "userId": this.user.userId,
                    "destId": this.chatPerson.userId,
                    "content": content,
                    "createtime": new Date()
                }
            modelData.messages.push(m)
        }
    }
})

var destId='qintian'



client.on('data', function (bytes) {
    let message = messages.ProtocolMessage.deserializeBinary(bytes)
    console.log(message)
    let response = message.getResponse()
    let chat = response.getChat()
    let decoder = new TextDecoder('utf8')
    let m = {
        "userId": chat.getUserid(),
        "destId": chat.getDestid(),
        "content": decoder.decode(chat.getContent_asU8()),
        "createtime": chat.getTs()
    }
    modelData.messages.push(m)

})
client.on('close', function () {
    console.log("connection closed")
})



