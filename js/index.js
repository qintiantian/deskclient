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

    },
    unReadMsgCnt: {

    },
    is_fresh: false,
    isShow: true,//会话列表展示
    isShow2: false,//好友列表展示
    isOpen: false,//联系人列表展示
    isOpenDetail: false,//联系人详细信息展示
    isFloat: false//用户详情展示
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
            event.preventDefault()
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
            this.getConversations()
            this.scrollToEnd()
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
                if(!modelData.is_fresh) {
                    for(let i in res) {
                        let c = res[i]
                        modelData.destId2Message[c.destId] = []
                    }
                    vm.$nextTick(function(){
                        this.showHistoryMessageByClick(modelData.conversations[0])
                    })
                    modelData.is_fresh = true
                }
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
            modelData.unReadMsgCnt[conversation.destId]=0
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
        unReadMsgCount: function(sendId){
            for(let i in modelData.conversations){
                let c = modelData.conversations[i];
                if(c.destId == sendId && sendId != modelData.chatPerson.destId){
                    let unReadMsgCnt = modelData.unReadMsgCnt[sendId]
                    if(unReadMsgCnt == undefined || unReadMsgCnt == null){
                        modelData.unReadMsgCnt[sendId] = 1
                    }else {
                        if(modelData.unReadMsgCnt[sendId] < 99 && modelData.unReadMsgCnt[sendId] != '99+'){
                            modelData.unReadMsgCnt[sendId]++
                        }else{
                            modelData.unReadMsgCnt[sendId] = '99+'
                        }
                    }
                }
            }
        },
        flash:function(){
            let curWin = remote.getCurrentWindow()
            curWin.showInactive();
            curWin.flashFrame(true);
        },
        updateShow: function(data){
            this.isShow = data.isShow;
            this.isShow2 = data.isShow2;
            this.isOpen = false;//关闭联系人列表
            this.isOpenDetail = false;//关闭联系人详情
        },
        openContact: function(data){
            this.isOpen = !data;
        },
        openDetail: function(){
            this.isOpenDetail = true
        },
        sendMsgFromRelationship: function(){
            let d = {
                isShow: true,
                isShow2: false
            }
            this.updateShow(d)
            //TODO 会话列表第一条展示当前好友会话
        },
        showUserDtl: function(data){
            this.isFloat = data
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
    if(response.getResptype() == messages.ProtocolMessage.RequestType.LOGIN){
        let resp = response.getResp();
        if (resp.getCode()== 200) {
            sharedObject.userId = resp.getUserid()
            sharedObject.certificate = resp.getCertificate()
            sharedObject.username = modelData.userId
            sharedObject.pwd = modelData.pwd
        }
        return
    }
    let chat = response.getChat()
    let decoder = new TextDecoder('utf8')
    let m = {
        "sendId": chat.getUserid(),
        "destId": chat.getDestid(),
        "content": decoder.decode(chat.getContent_asU8()),
        "createtime": chat.getTs(),
        "msgId": chat.getMsgid()
    }
    modelData.destId2Message[m.sendId].push(m)
    vm.scrollToEnd()
 	vm.getConversations()
    vm.unReadMsgCount(m.sendId)
    vm.flash()

})
let reconnet_count = 3
client.on('close', function () {
    reconnet_count--
    if(reconnet_count <= 0)
        return
    console.log("connection closed")
    client.connect(sharedObject.tcpport, sharedObject.host,function () {
        console.log("断线后重连")
        let message = new messages.ProtocolMessage()
        let req = new messages.ProtocolMessage.TRequest()
        req.setReqtype(messages.ProtocolMessage.RequestType.LOGIN)
        let clogin = new messages.CLogin()
        clogin.setMsgid(uuid.v1())
        clogin.setUserid(sharedObject.username)
        clogin.setPwd(sharedObject.pwd)
        clogin.setDevicetype(messages.CLogin.DeviceType.WINDOWS)
        clogin.setTs(new Date().getTime())
        clogin.setVersion(1)
        req.setLogin(clogin)
        message.setRequest(req)
        let bytes = message.serializeBinary()
        client.write(Buffer.from(bytes))
    })
})
let leftWidth=60, median=252, topHeight=60, bottomHeight=130
$(function(){
    $(".left, .median, .right").height($(window).height()-1);
});
window.onresize=function () {
    $(".left, .median, .right").height($(window).height()-1);
    $(".right").width($(window).width()-leftWidth-median-1);
    $(".chat-area").height($(window).height()-topHeight-bottomHeight-1)
}



