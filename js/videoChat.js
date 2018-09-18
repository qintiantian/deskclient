const {remote, ipcRenderer} = require('electron')

let sharedObject = remote.getGlobal("sharedObject")
var userId;
let destId;
let connectedUser
var yourConn;
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

ipcRenderer.on('info', function (event, data) {
    console.log("videoChat="+data)
    destId = data
})

//alias for sending JSON encoded messages
function send(message) {
    //attach the other peer username to our messages
    if (connectedUser) {
        message.name = connectedUser;
    }
    conn.send(JSON.stringify(message));
};

//connecting to our signaling server
let conn =  new WebSocket("ws://39.106.133.40:3000")
conn.onopen = function() {
    console.log("Connected to the signaling server");
    let msg = {
        'type':'login',
        'name': sharedObject.userId,
    }
    conn.send(JSON.stringify(msg))
}

//when we got a message from a signaling server
conn.onmessage = function (msg) {
    console.log("Got message", msg.data);
    var data = JSON.parse(msg.data);
    switch(data.type) {
        case "login":
            handleLogin(data.success);
            break;
        //when somebody wants to call us
        case "offer":
            handleOffer(data.offer, data.name);
            break;
        case "answer":
            handleAnswer(data.answer);
            break;
        //when a remote peer sends an ice candidate to us
        case "candidate":
            handleCandidate(data.candidate);
            break;
        case "leave":
            handleLeave();
            break;
        default:
            break;
    }
};


function handleLogin(success) {
    if(success) {
        //getting local video stream
        navigator.webkitGetUserMedia({ video: true, audio: true }, function (myStream) {
            //displaying local video stream on the page
            localVideo.src = window.URL.createObjectURL(myStream);
            //using Google public stun server
            var configuration = {
                "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
            };
            yourConn = new webkitRTCPeerConnection(configuration);
            // setup stream listening
            yourConn.addStream(myStream);
            //when a remote user adds stream to the peer connection, we display it
            yourConn.onaddstream = function (e) {
                remoteVideo.src = window.URL.createObjectURL(e.stream);
            };
            // Setup ice handling
            yourConn.onicecandidate = function (event) {
                if (event.candidate) {
                    send({
                        type: "candidate",
                        candidate: event.candidate,
                    });
                }
            };

        }, function (error) {
            console.log(error);
        });
        // if(destId){
        //     createOffer()
        // }
    }
}

function createOffer() {
    console.log('create offer to'+destId)
    connectedUser = destId
    yourConn.createOffer(function (offer) {
        send({
            type: "offer",
            offer: offer
        });
        yourConn.setLocalDescription(offer);
    }, function (error) {
        alert("Error when creating an offer");
    });
}


//when somebody sends us an offer
function handleOffer(offer, name) {
    connectedUser = name
    yourConn.setRemoteDescription(new RTCSessionDescription(offer));
    //create an answer to an offer
    console.log("Send answer to"+name)
    yourConn.createAnswer(function (answer) {
        yourConn.setLocalDescription(answer);
        send({
            type: "answer",
            answer: answer,
        });
    }, function (error) {
        alert("Error when creating an answer");
    });
};

//when we got an answer from a remote user
function handleAnswer(answer) {
    yourConn.setRemoteDescription(new RTCSessionDescription(answer));
};

//when we got an ice candidate from a remote user
function handleCandidate(candidate) {
    yourConn.addIceCandidate(new RTCIceCandidate(candidate));
};

function handleLeave() {
    remoteVideo.src = null;
    connectedUser = null;
    yourConn.close();
    yourConn.onicecandidate = null;
    yourConn.onaddstream = null;
};

conn.onclose = function() {
    console.log('leave')
}


conn.onerror = function (err) {
    console.log("Got error", err);
};



