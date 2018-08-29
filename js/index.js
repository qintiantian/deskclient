const Vue = require('./js/vue')
const messages = require("./js/message_pb")
const $ = require('jquery')
const uuid = require('uuid')
const {ipcRenderer, remote} = require('electron')

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
    conversations: [],
    messages: [],
    pageSize: 30,
    scrollEnd: false,
    destId2Message: {

    }
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
            if(event.srcElement.scrollTop <= 10 && !modelData.scrollEnd){
                let conversation = {'destId': this.chatPerson.destId, 'msgId': modelData.messages[0].msgId}
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
                for(let i in res) {
                    let c = res[i]
                    modelData.destId2Message[c.destId] = []
                }
                vm.$nextTick(function(){
                    this.showHistoryMessageByClick(modelData.conversations[0])
                })
            })
        },
        showHistoryMessageByClick: function (conversation) {
            this.chatPerson.destId = conversation.destId;
            this.chatPerson.imgUrl = conversation.imgUrl;
            this.chatPerson.nickname = conversation.nickname;
            if(modelData.destId2Message[conversation.destId].length == 0) {
                let path = '/user/historymessage/'+sharedObject.userId+'/'+conversation.destId+'/'+conversation.msgId+'/'+modelData.pageSize+'?'+'direct=-2'
                $.get({
                    url: sharedObject.url+path,
                    timeout:sharedObject.timeout,
                    headers:header
                }).done(function (res) {
                    if(res == null || res == []){
                        modelData.scrollEnd = true
                    } else {
                        modelData.messages = modelData.destId2Message[conversation.destId] = res.reverse()
                    }
                    vm.scrollToEnd()
                })
            }
            else {
                modelData.messages = this.destId2Message[conversation.destId]
            }
            vm.scrollToEnd()

        },
        showHistoryMessage: function (conversation) {
            let path = '/user/historymessage/'+sharedObject.userId+'/'+conversation.destId+'/'+conversation.msgId+'/'+modelData.pageSize+'?'+'direct=-1'
            $.get({
                url: sharedObject.url+path,
                timeout:sharedObject.timeout,
                headers:header
            }).done(function (res) {
                if(res == null || res == []){
                    modelData.scrollEnd = true
                } else {
                    let r = res.reverse()
                    modelData.destId2Message[conversation.destId] = r.concat(modelData.destId2Message[conversation.destId])
                }
                modelData.messages =  modelData.destId2Message[conversation.destId]
            })
        },
        scrollToEnd:function(){
            vm.$nextTick(function(){
                $('.chat-area')[0].scrollTop=$('.chat-area')[0].scrollHeight;   //这样就能将事件执行在界面渲染之后啦
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
        "sendId": chat.getUserid(),
        "destId": chat.getDestid(),
        "content": decoder.decode(chat.getContent_asU8()),
        "createtime": chat.getTs(),
        "msgId": chat.getMsgid()
    }
    modelData.destId2Message[m.destId].push(m)
    // modelData.messages.push(m)
    vm.scrollToEnd()
    ipcRenderer.send('flash')

})
client.on('close', function () {
    console.log("connection closed")
})



