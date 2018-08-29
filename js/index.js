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
            'msgId':'',
            'destId':'',
            'nickname':'',
            'username':'',
            'lastDate':'',
            'lastMsg':'',
            'isActive': false
        }
    ],
    messages: [],
    pageSize: 30,
    scrollEnd: false
};

let header = {
    'userId': sharedObject.userId,
    'certificate': sharedObject.certificate
}

let vm = new Vue({
    el: '#app',
    data: modelData,
    created(){
        this.init();
    },
    methods: {
        scrollEvent: function(event) {
            if(event.srcElement.scrollTop == 0 && !modelData.scrollEnd){
                let conversation = {destId: this.chatPerson.destId, msgId: modelData.pageNo+1}
                modelData.pageNo++
                this.showHistoryMessage(conversation);
            }
        },
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
                timeout:sharedObject.timeout,
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
                timeout:sharedObject.timeout,
                headers:header
            }).done(function (res) {
                modelData.conversations = res;
                modelData.conversations[0].isActive = true;
                vm.$nextTick(function(){
                    this.showHistoryMessageByClick(modelData.conversations[0])
                })
            })
        },
        showHistoryMessageByClick: function (conversation) {
            $(".conversations li").removeClass('active')
            console.info(conversation)
            this.chatPerson.destId = conversation.destId;
            this.chatPerson.imgUrl = conversation.imgUrl;
            this.chatPerson.nickname = conversation.nickname;
            let path = '/user/historymessage/'+sharedObject.userId+'/'+conversation.destId+'/'+conversation.msgId+'/'+modelData.pageSize+'?'+'direct=-1'
            $.get({
                url: sharedObject.url+path,
                timeout:sharedObject.timeout,
                headers:header
            }).done(function (res) {
                if(res == null || res == []){
                    modelData.scrollEnd = true
                    modelData.pageNo--
                } else {
                    modelData.messages = res.reverse()
                }
                vm.$nextTick(function(){
                    $('.chat-area')[0].scrollTop=$('.chat-area')[0].scrollHeight;   //这样就能将事件执行在界面渲染之后啦
                })
            })
        },
        showHistoryMessage: function (conversation) {
            this.chatPerson.destId = conversation.destId;
            this.chatPerson.imgUrl = conversation.imgUrl;
            this.chatPerson.nickname = conversation.nickname;
            let path = '/user/historymessage/'+sharedObject.userId+'/'+conversation.destId+'/'+conversation.msgId+'/'+modelData.pageSize+'?'+'direct=-1'
            $.get({
                url: sharedObject.url+path,
                timeout:sharedObject.timeout,
                headers:header
            }).done(function (res) {
                if(res == null || res == []){
                    modelData.scrollEnd = true
                    modelData.pageNo--
                } else {
                    modelData.messages = (res.reverse()).concat(modelData.messages.reverse())
                }
            })
        },
        init:function () {
            console.info("init")
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



