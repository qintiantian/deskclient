const Vue = require('./js/vue')
const message_pb = require("./js/message_pb")
const $ = require('jquery')
const uuid = require('uuid')
const {ipcRenderer, remote, shell} = require('electron')
const os = require('os')
const fs = require('fs')
const msgBuilder = require('./js/message_builder')
const lodash = require('lodash')

let sharedObject = remote.getGlobal("sharedObject")
let client = sharedObject.client
const modelData = {
    user: {
        'userId': '',
        'nickname': '',
        'imgUrl': ''
    },
    chatPerson: {
        'destId': '',
        'nickname': '',
        'imgUrl': ''
    },
    conversations: [],
    messages: [],
    pageSize: 30,
    unReadMsgCnt: {},
    destIdMap:{},
    is_fresh: false,
    isShow: true,//会话列表展示
    isShow2: false,//好友列表展示
    isOpen: false,//联系人列表展示
    isOpenDetail: false,//联系人详细信息展示
    isOpenNewFriend: false,//新朋友列表展示
    isFloat: false,//用户详情展示
    filepaths:[],
    newFriends:[],
    newFriendsCount:0,
    relationships: {},
    fPinyinList:[],
    relationshipList: [],
    relationshipsCount:0,
    friend: {
        'userId': '',
        'nickname': '',
        'imgUrl': '',
        'remark':''
    },
    btn:'',
    sendMessage:''//发送的消息
};

let header = {
    'userId': sharedObject.userId,
    'certificate': sharedObject.certificate
}
function loadMoreData(e) {
    if (document.getElementById("chat-area").scrollTop <= 5 && !modelData.destIdMap[this.chatPerson.destId].scrollEnd) {
        vm.showMore()
    }
}
let vm = new Vue({
    el: '#app',
    data: modelData,
    created() {
        this.init();
    },
    computed: {
    },
    methods: {
        scrollEvent: lodash.debounce(loadMoreData, 500),
        clearMsg: function() {
          if(!this.sendMessage && this.filepaths.length>0){
              this.filepaths.pop()

          }
        },
        sendMsg: function () {
            let content = ''
            let msgType = 0
            if($('.img-area img').length > 0) {
                for(let i in modelData.filepaths) {
                    let filepath = modelData.shift()
                    let data = fs.readFileSync(filepath,'binary')
                    let chatMsg = {
                        userId: this.user.userId,
                        destId: this.chatPerson.destId,
                        content: Buffer.from(data,'binary'),
                        dataType: message_pb.CPrivateChat.DataType.IMG,
                        extName: filepath.substring(filepath.lastIndexOf('\.')+1)
                    }
                    let bytes = msgBuilder.chatMessage(chatMsg)
                    client.write(bytes)
                    msgType = message_pb.CPrivateChat.DataType.IMG
                }
            }else{
                if(!this.sendMessage)
                    return
                let chatMsg = {
                    userId: this.user.userId,
                    destId: this.chatPerson.destId,
                    content: this.sendMessage,
                    dataType: message_pb.CPrivateChat.DataType.TXT
                }
                let bytes = msgBuilder.chatMessage(chatMsg)
                client.write(bytes)
            }
            let m = {
                "msgId": this.chatPerson.msgId,
                "sendId": this.user.userId,
                "destId": this.chatPerson.destId,
                "content": this.sendMessage,
                "createtime": new Date(),
                "msgType": msgType
            }
            if(m.msgType == message_pb.CPrivateChat.DataType.IMG){
            }else{
                modelData.messages.push(m)
            }
            this.sendMessage = ''
            this.getConversations()
            this.scrollToEnd()
        },
        getUserProfile: function () {
            let path = '/user/profile/' + sharedObject.userId + '/' + sharedObject.certificate
            $.get({
                url: sharedObject.url + path,
                timeout: sharedObject.timeout,
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
            let path = '/user/conversation/' + sharedObject.userId
            $.get({
                url: sharedObject.url + path,
                timeout: sharedObject.timeout,
                headers: header
            }).done(function (res) {
                modelData.conversations = res;
                if (!modelData.is_fresh) {
                    for (let i in res) {
                        let c = res[i]
                        let m = modelData.destIdMap[c.destId] = {}
                        m.messages = []
                        m.scrollEnd = false
                    }
                    vm.showHistoryMessageByClick(modelData.conversations[0])
                    modelData.is_fresh = true
                }
            })
        },
        showHistoryMessageByClick: function (conversation) {
            this.sendMessage = ''
            document.getElementById('sendArea').focus()
            this.chatPerson.destId = conversation.destId;
            this.chatPerson.imgUrl = conversation.imgUrl;
            this.chatPerson.nickname = conversation.nickname;
            if (modelData.destIdMap[conversation.destId].messages.length == 0) {
                let path = '/user/historymessage/' + sharedObject.userId + '/' + conversation.destId + '/' + conversation.msgId + '/' + modelData.pageSize + '?' + 'direct=-2'
                $.get({
                    url: sharedObject.url + path,
                    timeout: sharedObject.timeout,
                    headers: header
                }).done(function (res) {
                    if (res == null || res == []) {
                        modelData.destIdMap[conversation.destId].messages.scrollEnd = true
                    } else {
                        modelData.messages = modelData.destIdMap[conversation.destId].messages = res.reverse()
                    }
                    vm.scrollToEnd()
                })
            }
            else {
                modelData.messages = this.destIdMap[conversation.destId].messages
            }
            vm.scrollToEnd()
            modelData.unReadMsgCnt[conversation.destId] = 0
        },
        showMore: function(){
            let conversation = {'destId': this.chatPerson.destId, 'msgId': modelData.messages[0].msgId}
            this.showHistoryMessage(conversation);
        },
        showHistoryMessage: function (conversation) {
            let path = '/user/historymessage/' + sharedObject.userId + '/' + conversation.destId + '/' + conversation.msgId + '/' + modelData.pageSize + '?' + 'direct=-1'
            $.get({
                url: sharedObject.url + path,
                timeout: sharedObject.timeout,
                headers: header
            }).done(function (res) {
                if (res == null || res.length==0) {
                    modelData.destIdMap[conversation.destId].scrollEnd = true
                } else {
                    let r = res.reverse()
                    modelData.destIdMap[conversation.destId].messages = r.concat(modelData.destIdMap[conversation.destId].messages)
                }
                modelData.messages = modelData.destIdMap[conversation.destId].messages
            })
        },
        scrollToEnd: function () {
            vm.$nextTick(function () {
                // console.log($('.chat-area')[0].scrollHeight)
                $('.chat-area')[0].scrollTop = $('.chat-area')[0].scrollHeight;   //这样就能将事件执行在界面渲染之后啦
            })
        },
        unReadMsgCount: function (sendId) {
            for (let i in modelData.conversations) {
                let c = modelData.conversations[i];
                if (c.destId == sendId && sendId != modelData.chatPerson.destId) {
                    let unReadMsgCnt = modelData.unReadMsgCnt[sendId]
                    if (unReadMsgCnt == undefined || unReadMsgCnt == null) {
                        modelData.unReadMsgCnt[sendId] = 1
                    } else {
                        if (modelData.unReadMsgCnt[sendId] < 99 && modelData.unReadMsgCnt[sendId] != '99+') {
                            modelData.unReadMsgCnt[sendId]++
                        } else {
                            modelData.unReadMsgCnt[sendId] = '99+'
                        }
                    }
                }
            }
        },
        flash: function () {
            let curWin = remote.getCurrentWindow()
            curWin.showInactive();
            curWin.flashFrame(true);
        },
        updateShow: function (data) {
            this.isShow = data.isShow;
            this.isShow2 = data.isShow2;
            this.isOpen = false;//关闭联系人列表
            this.isOpenDetail = false;//关闭联系人详情
        },
        openContact: function (data) {
            this.isOpen = !data;
            if(this.isOpen){
                this.selectRelationships();
            }
        },
        openNewFriends: function (data) {
            this.isOpenNewFriend = !data;
            if(this.isOpenNewFriend){
                this.selectNewFriends();
            }
        },
        /**
         * 获取新朋友
         */
        selectNewFriends: function(){
            let path = '/user/' + sharedObject.userId + '/relationships/new'
            $.get({
                url: sharedObject.url + path,
                timeout: sharedObject.timeout,
                headers: header
            }).done(function (res) {
                modelData.newFriends = res
                modelData.newFriendsCount = res.length;
            })
        },
        /**
         * 获取好友列表
         */
        selectRelationships: function(){
            let path = '/user/' + sharedObject.userId + '/relationships'
            $.get({
                url: sharedObject.url + path,
                timeout: sharedObject.timeout,
                headers: header
            }).done(function (res) {
                modelData.relationships = res
                modelData.fPinyinList = [];
                modelData.relationshipList = [];
                modelData.relationshipsCount = 0;
                for(let fPinyin in modelData.relationships){
                    modelData.fPinyinList.push(fPinyin);
                    modelData.relationshipList.push(modelData.relationships[fPinyin]);
                    modelData.relationshipsCount += modelData.relationships[fPinyin].length;
                }
            })
        },
        /**
         * 获取好友详情
         */
        openDetail: function (userId, status) {
            status == '1' ? modelData.btn = '通过验证' : modelData.btn = '发消息'
            this.isOpenDetail = true
            let path = '/user/' + sharedObject.userId + '/relationships/'+userId+'/detail'
            $.get({
                url: sharedObject.url + path,
                timeout: sharedObject.timeout,
                headers: header
            }).done(function (res) {
                modelData.friend = res
            })
        },
        /**
         * 好友详情发消息
         */
        sendMsgFromRelationship: function () {
            let d = {
                isShow: true,
                isShow2: false
            }
            this.updateShow(d)
            //TODO 会话列表第一条展示当前好友会话
        },
        /**
         * 通过好友验证
         */
        pass: function(fromUser) {
            let path = '/user/' + sharedObject.userId + '/relationships/'+fromUser+'/pass'
            let t = this;
            $.post({
                url: sharedObject.url + path,
                timeout: sharedObject.timeout,
                headers: header
            }).done(function (res) {
                //验证通过
                if(res == 1){
                    t.selectNewFriends()//重新加载新朋友
                    t.openDetail(fromUser, '2')//重新加载好友详情
                    if(modelData.isOpen){
                        t.selectRelationships()//如果联系人列表展开，则重新加载好友列表
                    }
                }
            })
        },
        showUserDtl: function (data) {
            this.isFloat = data
        },
        propFile: function () {
            remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
                filters: [
                    {name: '图片', extensions: ['jpg', 'png', 'gif']},
                    {name: '所有文件（*.*）', extensions: ['*']}],
                properties: ['openFile', 'multiSelections']
            }, function (filePaths) {
                if(filePaths) {
                    // for(let i in filePaths)
                    //     $('.img-area').append("<img class='send-img' src='"+filePaths[i]+"'>")
                    console.log(filePaths)
                    modelData.filepaths = modelData.filepaths.concat(filePaths)
                }
                document.getElementById('sendArea').focus()
            });
        },
        videoChat: function() {
            sharedObject.chatPerson =  this.chatPerson
            ipcRenderer.send('video-chat', this.chatPerson.destId)
        },
        init: function () {
            this.getUserProfile()
            this.getConversations()

        }
    }
})

client.on('data', function (bytes) {
    let message = message_pb.ProtocolMessage.deserializeBinary(bytes)
    let response = message.getResponse()
    if (response.getResptype() == message_pb.ProtocolMessage.RequestType.LOGIN) {
        let resp = response.getResp();
        if (resp.getCode() == 200) {
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
        "msgId": chat.getMsgid(),
        "msgType": chat.getDatatype()

    }
    let destId = m.sendId == modelData.user.userId ? m.destId : m.sendId
    modelData.destIdMap[destId].messages.push(m)
    vm.scrollToEnd()
    vm.getConversations()
    vm.unReadMsgCount(m.sendId)
    vm.flash()

})

let reconnect_time = 5
client.on('close', function () {
    console.log('断线了')
    if(--reconnect_time == 0)
        return
    console.log("connection closed")
    setTimeout(function () {
        client.connect(sharedObject.tcpport, sharedObject.host, function () {
            console.log("断线后重连")
            let bytes = msgBuilder.loginMessage(sharedObject.username, sharedObject.pwd)
            client.write(bytes)
        })
    }, 5000)
})


let leftWidth = 60, median = 252, topHeight = 60, bottomHeight = 130

$(function () {
    $(".left, .median, .right").height($(window).height()-1)
})

window.onresize = lodash.debounce(function () {
    $(".left, .median, .right").height($(window).height()-1);
    $(".right").width($(window).width() - leftWidth - median-1 );
    $(".chat-area").height($(window).height() - topHeight - bottomHeight-1)
}, 50)



