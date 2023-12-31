/*
* Software Name : abcdesktop.io
* Version: 0.2
* SPDX-FileCopyrightText: Copyright (c) 2020-2021 Orange
* SPDX-License-Identifier: GPL-2.0-only
*
* This software is distributed under the GNU General Public License v2.0 only
* see the "license.txt" file for more details.
*
* Author: abcdesktop.io team
* Software description: cloud native desktop service
*/

/*
 * Javascript app for negotiating and streaming a sendrecv webrtc stream
 * with a GStreamer app. Runs only in passive mode, i.e., responds to offers
 * with answers, exchanges ICE candidates, and streams.
 */
import * as launcher from '../launcher.js';
import { broadcastEvent } from '../broadcastevent.js';
import * as notificationSystem from '../notificationsystem.js';


var default_constraints = {video: false, audio: true};
var connect_attempts = 0;
var peer_connection;
var send_channel;
var ws_conn;
// Promise for local stream after constraints are approved by the user
var local_stream_promise;

const state = {
  soundIsEnabled: false,
  rtc_configuration: {}
};

export const isSecured = () => {
    // if we use https then return true else return false
    if (window.location.protocol.substring(0, 5) === 'https') {
      return true;
    }
    return false;
}


export const isEnabled = async () => {
  try {
    const { id }  = await launcher.getkeyinfo('webrtc.enable');
    return !!id;
  } catch(e) {
    console.error(e);
    return false;
  }
};


const configureSpeaker = async () => {
  if (!state.soundIsEnabled) {
    if (isSecured()) {
      launcher.getkeyinfo('webrtc.enable').done((msg) => {
        if (msg.id && msg.id === true ) {  
            launcher.coturn_rtcconfiguration().done(
              (msg) => { 
                state.rtc_configuration = msg.result;
                //  state.rtc_configuration = { 
		            // iceServers: [ 
                // { urls: "stun:stun.l.google.com:19302"},
                // { urls: "turn:nturn.pepins.net:3478", username: "username2", credential: "superkey2"} 
                // ] 
                // };
                console.log(state.rtc_configuration );
                // state.rtc_configuration = { iceServers: [ {urls: "stun:stun.l.google.com:19302"} ] };
                launcher.isPulseAvailable().then((res) => {
                  if (res.status === 200) {
                      websocketServerConnect();
                  }
                });
              } 
            );
        }
	else
            console.log('Sound is disable in your configuration file');
      });
    }
    else
      displayNotificationNoSound('Please use secure https to enable sound');
  }
}

export const init = () => {
  document.addEventListener('broadway.connected', configureSpeaker);
};

export const updateIconVolumLevel = () => {
  const volumeLevel = document.getElementById('volume_level');
  if (volumeLevel) {
    const value = Number(volumeLevel.value);
    let srcImg = '';
    // find a icon using the volumeLevel.value 
    if (value > 0.66) {
      srcImg = '../img/top/Volume_High.svg';
    } else if (value > 0.33) {
      srcImg = '../img/top/Volume_Mid.svg';
    } else if (value > 0) {
      srcImg = '../img/top/Volume_Low.svg';
    } else {
      srcImg = '../img/top/Volume_None.svg';
    }
    // change the icon 
    $('#speakers-logo').attr('src', srcImg);
  }

  /*
  const audio = document.getElementById('audioplayer');
  if (audio) {
    if (value === 0 )
      audio.pause();
    else
      audio.play();
  }
  */
};

const setLevelSound = () => {
  const audio = document.getElementById('audioplayer');
  if (audio && !audio.paused) {
    updateIconVolumLevel();
  }
};

export const enableSoundIcon = (level) => {
  const audio = document.getElementById('audioplayer');
  if (audio) {
      $('#speakers').css('display', 'block');
      const volumeLevel = document.getElementById('volume_level');
      volumeLevel.value = (Number.isInteger(level)) ? level : 1;
      var promise = audio.play();
      if (promise !== undefined) {
	      promise.then( _ => { 
		      // autoplay started
		      setLevelSound();
	      }).catch( error => {
		      // autoplay was preventes.
		      // show a message information 
		      // so that user can start sound interact with the document 
		      displayNotificationNoSound( 'Click on sound icon to enable sound');
	      });
      }
  }
};

export const enablePlaySound = () => {
  const audio = document.getElementById('audioplayer');
  if (audio) {
      var promise = audio.play();
      if (promise !== undefined) {
              promise.then( _ => {
                      // autoplay started
                      console.log('starting audio.play()');
              }).catch( error => {
                      // autoplay was preventes.
                      // show a message information 
                      // so that user can start sound interact with the document
		      console.log(error);
              });
      }
  }
};



function displayNotificationNoSound(notification_desc)
{
  // In this case the user did not make any interaction.
  // Thus we print a notification.
  const title = 'Sound disabled';
  const desc = (notification_desc) ? notification_desc : 'Please use secure https to enable sound';
  const type = '';
  const img = '../img/top/Volume_None.svg';
  const url = '';
  const duration = 5000;
  notificationSystem.displayNotification(title, desc, type, img, url, duration);
}


function displayNotificationWebRTCError( msg )
{
  // In this case the user did not make any interaction.
  // Thus we print a notification ti display error message.
  const title = 'WebRTC error';
  const desc = msg;
  const type = '';
  const img = '../img/top/Volume_None.svg';
  const url = '';
  const duration = 5000;
  notificationSystem.displayNotification(title, desc, type, img, url, duration);
}



broadcastEvent.addEventListener('speaker.available', async ({ detail: { available } }) => {
  if (available) {
    websocketServerConnect();
  }
});


function getOurId() {
  return Math.floor(Math.random() * (9000 - 10) + 10).toString();
}

function resetState() {
  // This will call onServerClose()
  ws_conn.close();
  ws_conn = null;
}

function handleIncomingError(error) {
  // This will call onServerClose()
  setError("ERROR: " + error);
  resetState();
}

function getVideoElement() {
  return document.getElementById("audioplayer");
}

function setStatus(text) {
  console.log(text);
}

function setError(text) {
  console.error(text);
  displayNotificationWebRTCError( text );
}

function setErrortoConsole(text) {
  console.log(text);
}


function resetVideo() {
  // Release the webcam and mic
  if (local_stream_promise)
      local_stream_promise.then(stream => {
          if (stream) {
              stream.getTracks().forEach(function (track) { track.stop(); });
          }
      });

  // Reset the video element and stop showing the last received frame
  var videoElement = getVideoElement();
  videoElement.pause();
  videoElement.src = "";
  videoElement.load();
}

// SDP offer received from peer, set remote description and create an answer
function onIncomingSDP(sdp) {
  peer_connection.setRemoteDescription(sdp).then(() => {
      setStatus("Remote SDP set");
      if (sdp.type != "offer")
          return;
      setStatus("Got SDP offer");
      local_stream_promise.then((stream) => {
          setStatus("Got local stream, creating answer");
          peer_connection.createAnswer()
          .then(onLocalDescription).catch(setError);
      }).catch(setError);
  }).catch(setError);
}

// Local description was set, send it to peer
function onLocalDescription(desc) {
  console.log("Got local description: " + JSON.stringify(desc));
  peer_connection.setLocalDescription(desc).then(function() {
      setStatus("Sending SDP " + desc.type);
      let sdp = {'sdp': peer_connection.localDescription}
      ws_conn.send(JSON.stringify(sdp));
  });
}

function generateOffer() {
  peer_connection.createOffer().then(onLocalDescription).catch(setError);
}

// ICE candidate received from peer, add it to the peer connection
function onIncomingICE(ice) {
  console.log('onIncomingICE ', ice )
  var candidate = new RTCIceCandidate(ice);
  /*
  if (ice.candidate.indexOf("srflx")>=0 ) {
    console.log( 'adding ', candidate )
    peer_connection.addIceCandidate(candidate).catch(setError);
  }
  */
  console.log( 'candidate.address', candidate.address,  'foundation', candidate.foundation );
  peer_connection.addIceCandidate(candidate).catch(setError);
}

function onServerMessage(event) {
  console.log("Received " + event.data);
  switch (event.data) {
      case "HELLO":
          setStatus("Registered with server, waiting for call");
          return;
      case "SESSION_OK":
          setStatus("Starting negotiation");
          if (wantRemoteOfferer()) {
              ws_conn.send("OFFER_REQUEST");
              setStatus("Sent OFFER_REQUEST, waiting for offer");
              return;
          }
          if (!peer_connection)
              createCall(null).then (generateOffer);
          return;
      case "OFFER_REQUEST":
          // The peer wants us to set up and then send an offer
          if (!peer_connection)
              createCall(null).then (generateOffer);
          return;
      default:
          if (event.data.startsWith("ERROR")) {
              handleIncomingError(event.data);
              return;
          }
          let msg;
          // Handle incoming JSON SDP and ICE messages
          try {
              msg = JSON.parse(event.data);
          } catch (e) {
              if (e instanceof SyntaxError) {
                  handleIncomingError("Error parsing incoming JSON: " + event.data);
              } else {
                  handleIncomingError("Unknown error parsing response: " + event.data);
              }
              return;
          }

          // Incoming JSON signals the beginning of a call
          if (!peer_connection)
              createCall(msg);

          if (msg.sdp != null) {
              onIncomingSDP(msg.sdp);
          } else if (msg.ice != null) {
              onIncomingICE(msg.ice);
          } else {
              handleIncomingError("Unknown incoming JSON: " + msg);
          }
  }
}

function onServerClose(event) {
  state.soundIsEnabled = false;
  setStatus('Disconnected from server');
  resetVideo();
  if (peer_connection) {
      setStatus('peer_connection will disconnect from server');
      peer_connection.close();
      peer_connection = null;
      setStatus('peer_connection is disconnected from server');
  }

  // Reset after a second
  window.setTimeout( configureSpeaker, 1000);
  $('#speakers').css('display', 'none');
}

function onServerError(event) {
  setError("Unable to connect to server")
  // Retry after 3 seconds
  window.setTimeout(websocketServerConnect, 3000);
}

function getLocalStream() {
  // Add local stream
  if (navigator.mediaDevices.getUserMedia) {
      return navigator.mediaDevices.getUserMedia(default_constraints);
  } else {
      errorUserMediaHandler();
  }
}

function websocketServerConnect() {
  connect_attempts++;
  if (connect_attempts > 3) {
      setError("Too many connection attempts, aborting. Refresh page to try again");
      return;
  }

  /*
  // check if ws_conn is already a WebSocket
  if ( ws_conn instanceof WebSocket ) {
    // check if ws_conn.readyState is OPEN or CONNECTING
    if ( ws_conn.readyState == ws_conn.CONNECTING || ws_conn.readyState == ws_conn.OPEN )
      console.error( 'WebSocket is already OPEN or CONNECTING, readyState=', ws_conn.readyState );
      return;
  }
  */
  
  // Fetch the peer id to use
  let peer_id = window.od.currentUser.userid || 'front.abcdesktop'; // getOurId();
  let path = `signalling?jwt_token=${window.od.currentUser.authorization}`;
  let ws_url = window.od.net.getwsurl(path);
  setStatus("Connecting to webrtc signalling server " + ws_url);
  ws_conn = new WebSocket(ws_url);
  // When connected, immediately register with the server
  ws_conn.addEventListener('open', (event) => {
      ws_conn.send('HELLO ' + peer_id);
      setStatus("Registering with webrtc signalling server");
  });
  ws_conn.addEventListener('error', onServerError);
  ws_conn.addEventListener('message', onServerMessage);
  ws_conn.addEventListener('close', onServerClose);
}

function onRemoteTrack(event) {
  if (getVideoElement().srcObject !== event.streams[0]) {
      console.log('Incoming webrtc stream');
      getVideoElement().srcObject = event.streams[0];
  }
}

function errorUserMediaHandler() {
  setError("Browser doesn't support getUserMedia!");
}

const handleDataChannelOpen = (event) =>{
  console.log("dataChannel.OnOpen", event);
};

const handleDataChannelMessageReceived = (event) =>{
  console.log("dataChannel.OnMessage:", event, event.data.type);

  setStatus("Received data channel message");
  if (typeof event.data === 'string' || event.data instanceof String) {
      console.log('Incoming string message: ' + event.data);
  } else {
      console.log('Incoming data message');
  }
  send_channel.send("Hi! (from browser)");
};

const handleDataChannelError = (error) =>{
  console.log("dataChannel.OnError:", error);
};

const handleDataChannelClose = (event) =>{
  console.log("dataChannel.OnClose", event);
};

function onDataChannel(event) {
  setStatus("Data channel created");
  let receiveChannel = event.channel;
  receiveChannel.onopen = handleDataChannelOpen;
  receiveChannel.onmessage = handleDataChannelMessageReceived;
  receiveChannel.onerror = handleDataChannelError;
  receiveChannel.onclose = handleDataChannelClose;
}

function createCall(msg) {
  // Reset connection attempts because we connected successfully
  connect_attempts = 0;
  console.log('Creating RTCPeerConnection');
  console.log('rtc_configuration=', state.rtc_configuration);
  peer_connection = new RTCPeerConnection(state.rtc_configuration);
  send_channel = peer_connection.createDataChannel('label', null);
  send_channel.onopen = handleDataChannelOpen;
  send_channel.onmessage = handleDataChannelMessageReceived;
  send_channel.onerror = handleDataChannelError;
  send_channel.onclose = handleDataChannelClose;
  peer_connection.ondatachannel = onDataChannel;
  peer_connection.ontrack = onRemoteTrack;

  /* Send our video/audio to the other peer */
  local_stream_promise = getLocalStream().then((stream) => {
      console.log('Adding local stream');
      peer_connection.addStream(stream);
      return stream;
  }).catch(setErrortoConsole); // catch no local stream microphone or access is denied by user

  if (msg != null && !msg.sdp) {
      console.log("WARNING: First message wasn't an SDP message!?");
  }

  peer_connection.onicecandidate = (event) => {
      
      if (event.candidate == null) {
	// this should be the last event ?
        console.log("ICE Candidate was null, done");
	// if we get some candidates before this event then enableSoundIcon
	if (state.soundIsEnabled)
		enableSoundIcon();
        return;
      }

      if (event.candidate && event.candidate.candidate) {
	// we get a candidate 
	state.soundIsEnabled = true;
        console.log( event.candidate.candidate );
        /* 
	 * just a filter on relay or srflx
        if (event.candidate.candidate.indexOf("srflx")<0 ) {
          console.log('no relay address is found, assuming it means no TURN server');
          return;
        }
        else
          console.log('relay address is found ' );
        */
      }
      ws_conn.send(JSON.stringify({'ice': event.candidate}));
  };

  if (msg != null)
      setStatus("Created peer connection for call, waiting for SDP");

  return local_stream_promise;
}

