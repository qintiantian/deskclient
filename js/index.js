const Vue = require('./js/vue')
const messages = require("./js/message_pb")
const $ = require('jquery')
const uuid = require('uuid')
const remote = require('electron').remote

let sharedObject = remote.getGlobal("sharedObject")
let client = sharedObject.client
const modelData = {
    user: {
        'userId':'',
        'nickname':'',
        'imgUrl':''
    },
    chatPerson: {
        'destId':'',
        'nickname':'',
        'imgUrl':''
    },
    conversations: [
        {
            'nickname':'',
            'lastDate':'',
            'lastMsg':'',
            'isActive': false
        }
    ],
    messages: []
};

let header = {
    'userId': sharedObject.userId,
    'certificate': sharedObject.certificate
}

let vm = new Vue({
    el: '#app',
    data: modelData,
    watch: {
        messages() {
            $(".chat-area").scrollTop($(".chat-area").prop('scrollHeight')+$(".chat-area li").height()+40);
            //document.getElementById('chat-area').scrollTop = document.getElementById('chat-area').scrollHeight+$(".chat-area li").height;
        }
    },
    methods: {
        sendMsg: function (event) {
            let content = $('.content').val()
            let message = new messages.ProtocolMessage()
            let req = new messages.ProtocolMessage.TRequest()
            req.setReqtype(messages.ProtocolMessage.RequestType.CHAT)
            let chat = new messages.CPrivateChat()
            chat.setMsgid(uuid.v1())
            chat.setContent(Buffer.from(content))
            chat.setDestid(this.chatPerson.destId)
            chat.setUserid(this.user.userId)
            chat.setChattype(messages.CPrivateChat.ChatType.ONE2ONE)
            chat.setDatatype(messages.CPrivateChat.DataType.TXT)
            req.setChat(chat)
            message.setRequest(req)
            let bytes = message.serializeBinary()
            client.write(Buffer.from(bytes))
            $('.content').val('')
            let m = {
                "msgId": this.chatPerson.msgId,
                "sendId": this.user.userId,
                "destId": this.chatPerson.destId,
                "content": content,
                "createtime": new Date()
            }
            modelData.messages.push(m)
        },
        getUserProfile: function () {
            let path = '/user/profile/' + sharedObject.userId + '/' + sharedObject.certificate
            $.get({
                url: sharedObject.url + path,
                headers: header
            }).done(function (res) {
                modelData.user.userId = res.userId
                modelData.user.nickname = res.nickname
                modelData.user.imgUrl = res.imgUrl
            }).fail(function (err) {
                console.log('获取用户信息失败')
            })
        },
        getConversations: function () {
            let path = '/user/conversation/'+sharedObject.userId
            $.get({
                url: sharedObject.url+path,
                headers:header
            }).done(function (res) {
                modelData.conversations = res;
            })
        },
        showHistoryMessage: function (conversation) {
            $(".conversations li").removeClass('active')
            conversation.isActive = true;
            this.chatPerson = conversation
            let path = '/user/historymessage/'+sharedObject.userId+'/'+conversation.destId
            $.get({
                url: sharedObject.url+path,
                headers:header
            }).done(function (res) {
                modelData.messages = []
                modelData.messages = res
            })
        },
        init:function () {
            this.getUserProfile()
            this.getConversations()
        }
    }
})

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

vm.init()






