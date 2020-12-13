/**
 * @name handleFail
 * @param err - error thrown by any function
 * @description Helper function to handle errors
 */
let handleFail = function(err){
    console.log("Error : ", err);
};

// Queries the container in which the remote feeds belong
let remoteContainer = document.getElementById("remote-container");
var count = 0; // number of remote containers


// Reads value from a variable named `channelName` in our local storage 
var channelName = localStorage.getItem("channelName");

document.getElementById('disconnect_call').onclick = () =>  {
    disconnectCall();
}

/**
 * @name disconnectCall
 * @param null
 * @description function to disconnect the call for a local user
 */
function disconnectCall(){
    client.leave();
    if (client.leave) {
        window.location.href = 'index.html'
    }
}

document.getElementById('bg_song').onclick = () => {
    toggleMusic();
}

var isPlaying = false; 
var played = false; // Based on Agora documentation, only start playing effect once. Pause and unpause after

function toggleMusic() {
    if (!isPlaying) {
        isPlaying = true;
        if (!played) {
            globalstream.playEffect({
                soundId : 1,
                filePath : "https://web-demos-static.agora.io/agora/smlt.flac"
            }, function (err) {
                console.log(err);
            });
            played = true;
        } else {
            globalstream.resumeAllEffects();
        }
    } else {
        isPlaying = false;
        globalstream.pauseAllEffects(function(err){
            if (err){
                console.error("Failed to pause effects, reason: ", err);
            }else{
                console.log("Effects are paused successfully");
            }
        });
    }
}

var isMuted = false; //Default state of mic

document.getElementById('mute_mic').onclick = () =>  {
    toggleMic();
}

/**
 * @name toggleMic
 * @param null
 * @description function to switch between enabling and disabling a microphone
 */
function toggleMic() {
    if (isMuted) {
        isMuted = false;
        globalstream.unmuteAudio();
    } else {
        isMuted = true;
        globalstream.muteAudio();
    }
}

var isCameraOn = true; // Default state of camera

document.getElementById('disable_camera').onclick = () =>  {
    toggleCamera();
}

/**
 * @name toggleCamera
 * @param null
 * @description function to switch between enabling and disabling a camera
 */
function toggleCamera() {
    if (isCameraOn) {
        isCameraOn = false;
        globalstream.muteVideo();
    } else {
        isCameraOn = true;
        globalstream.unmuteVideo();
    }
}

/**
 * @name addVideoStream
 * @param streamId
 * @description Helper function to add the video stream to "remote-container"
 */
function addVideoStream(streamId){
    count = count + 1;
    let streamDiv=document.createElement("div"); // Create a new div for every stream
    streamDiv.id=streamId;                       // Assigning id to div
    streamDiv.style.transform="rotateY(180deg)"; // Takes care of lateral inversion (mirror image), flip camera
    streamDiv.style.marginBottom = "3vw";        // Creates some space between the remote containers
    remoteContainer.appendChild(streamDiv);      // Add new div to container
}

/**
 * @name removeVideoStream
 * @param evt - Remove event
 * @description Helper function to remove the video stream from "remote-container"
 */
function removeVideoStream (evt) {
    let stream = evt.stream;
    //let remDiv = document.getElementById('remote-container');
    var remDiv = document.getElementById('player_' + stream.getId());
    remDiv.remove();
    stream.stop();
    //remDiv.parentNode.removeChild(remDiv);
    console.log("Remote stream removed ");
}

// Starting video
//Creating client
let client = AgoraRTC.createClient({
    mode : 'live',
    codec : "h264"
});

var stream = AgoraRTC.createStream({
  streamID: 0,
  audio: true,
  video: true,
  screen: false
});

//Initializing client
client.init("<UID from Agora here>", function(){
    console.log("Initialized successfully!");
});


function delay(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
};

//Joining the client
client.join(null, channelName, null, function(uid){

    let localstream = AgoraRTC.createStream({
        streamID : uid,
        audio : true, // Disabling this disables speaking functionality
        video : true, // Disabling this disables video functionality
        screen : false
    });

    globalstream = localstream;

    // Printing logs in the console, if desired/needed

    // Session logs
    setInterval(() => {
        client.getSessionStats((stats) => {
          /*console.log(`Current Session Duration: ${stats.Duration}`);
          console.log(`Current Session UserCount: ${stats.UserCount}`);
          console.log(`Current Session SendBytes: ${stats.SendBytes}`);
          console.log(`Current Session RecvBytes: ${stats.RecvBytes}`);
          console.log(`Current Session SendBitrate: ${stats.SendBitrate}`);
          console.log(`Current Session RecvBitrate: ${stats.RecvBitrate}`);*/
        });
      }, 1000);

      // Network quality stats
      client.on("network-quality", function(stats) {
        /*console.log("downlinkNetworkQuality", stats.downlinkNetworkQuality);
        console.log("uplinkNetworkQuality", stats.uplinkNetworkQuality);*/
    });

    // Video stats from remote video 
    setInterval(() => {
        client.getRemoteVideoStats((remoteVideoStatsMap) => {
          for(var uid in remoteVideoStatsMap){
            //console.log(`Video End2EndDelay from ${uid}: ${remoteVideoStatsMap[uid].End2EndDelay}`);
            /*console.log(`Video End2EndDelay from ${uid}: ${remoteVideoStatsMap[uid].End2EndDelay}`);
            console.log(`Video MuteState from ${uid}: ${remoteVideoStatsMap[uid].MuteState}`);
            console.log(`Video PacketLossRate from ${uid}: ${remoteVideoStatsMap[uid].PacketLossRate}`);
            console.log(`Video TransportDelay from ${uid}: ${remoteVideoStatsMap[uid].TransportDelay}`);*/
          }
        });
      }, 1000);

    //Publishing the stream.
    localstream.init(function(){
        localstream.play('me');
        client.publish(localstream, handleFail);
        /*client.getRemoteVideoStats((remoteVideoStatsMap) => {
          for(var uid in remoteVideoStatsMap){
            client.subscribe(remoteVideoStatsMap);
            client.subscribe(stream.uid);
          }
        });*/ // No remote video object

        // Edit framing of video. Need to edit CSS after video element is created, since it
        // is created dynamically by Agora.
        var localVideoScreen = document.getElementById('video' + globalstream.getId());
        localVideoScreen.style.objectFit = 'contain';

        client.on('stream-added', (evt)=>{
            /*delay(5000).then(() => {
                client.subscribe(evt.stream, handleFail);
            });*/
            client.subscribe(evt.stream, handleFail);
        });

        /*client.on('peer-online', (evt)=>{
            client.subscribe(evt.stream, handleFail);
        });*/

        client.on('peer-leave', removeVideoStream);

        client.on('stream-subscribed', (evt)=>{
            let stream = evt.stream;
            addVideoStream(stream.getId());
            stream.play('remote-container');
            // Mute the remote user
            stream.setAudioVolume(0);
        });
        client.on('stream-removed', removeVideoStream); // May need to update with removeVideoStream div ID
    }, handleFail);

}, handleFail);