// Self invoked anonymous function
(function () {
  let peer = null;
  let conn = null;
  let messageBox = document.querySelector(".new-message");
  let mediaConn = null;

  const consoleLog = (e) => {};

  const peerOnOpen = (id) => {
    document.querySelector(".my-peer-id").innerHTML = id;
  };

  // Handle 'connection' event from remote
  const peerOnConnection = (dataConnection) => {
    conn && conn.close();
    conn = dataConnection;

    // Dispach custom event here
    const event = new CustomEvent("peer-changed", {
      detail: { peerId: conn.peer },
    });
    document.dispatchEvent(event);

    conn.on("data", (data) => printMessage(data, "them"));
  };
  // On peer event: "call" when they are calling you
  const peerOnCall = (incomingCall) => {
    mediaConn && mediaConn.close();
    // Answer icoming call.
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((myStream) => {
        mediaConn = incomingCall;
        incomingCall.answer(myStream);
        mediaConn.on("stream", mediaConnOnStream);
      });
  };

  const peerOnError = (error) => {
    console.log(error);
  };

  // Connect to peer
  const connectToPeerClick = (el) => {
    const peerId = el.target.textContent;
    conn && conn.close();
    conn = peer.connect(peerId);
    conn.on("open", () => {
      console.log("connection open");
      const event = new CustomEvent("peer-changed", {
        detail: { peerId: peerId },
      });
      document.dispatchEvent(event);

      conn.on("data", (data) => {
        console.log(data);
        printMessage(data, "them");
      });
    });
    conn.on("error", consoleLog);
  };

  // Print message
  function printMessage(message, writer) {
    const messagesDiv = document.querySelector(".messages");
    const messageWrapperDiv = document.createElement("div");
    const newMessageDiv = document.createElement("div");

    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();
    m = checkTime(m);
    s = checkTime(s);
    function checkTime(i) {
      if (i < 10) {
        i = "0" + i;
      }
      return i;
    }

    if (writer === "them") {
      newMessageDiv.innerText = "(" + h + ":" + m + ":" + s + ") " + message;
    } else {
      newMessageDiv.innerText = message + " (" + h + ":" + m + ":" + s + ") ";
    }
    messageWrapperDiv.classList.add("message");
    messageWrapperDiv.classList.add(writer);
    messageWrapperDiv.appendChild(newMessageDiv);
    messagesDiv.appendChild(messageWrapperDiv);
    messagesDiv.scrollTo(0, messagesDiv.scrollHeight);
  }

  // Connect to Peer Server
  let myPeerId = location.hash.slice(1);

  peer = new Peer(myPeerId, {
    host: "glajan.com",
    port: 8443,
    path: "/myapp",
    secure: true,
    // config: {
    //   iceServers: [
    //     { url: ["stun:eu-turn7.xirsys.com"] },
    //     {
    //       username:
    //         "1FOoA8xKVaXLjpEXov-qcWt37kFZol89r0FA_7Uu_bX89psvi8IjK3tmEPAHf8EeAAAAAF9NXWZnbGFqYW4=",
    //       credential: "83d7389e-ebc8-11ea-a8ee-0242ac140004",
    //       url: "turn:eu-turn7.xirsys.com:80?transport=udp",
    //     },
    //   ],
    // },
  });

  // Handel Peer Event.
  peer.on("open", peerOnOpen);
  peer.on("error", peerOnError);
  peer.on("connection", peerOnConnection);
  peer.on("call", peerOnCall);

  // Display video of me
  navigator.mediaDevices
    .getUserMedia({ audio: false, video: true }) // Promise
    .then((stream) => {
      const video = document.querySelector(".video-container.me .video video");
      video.muted = true;
      video.srcObject = stream;
    });

  const mediaConnOnStream = (theirStream) => {
    const video = document.querySelector(".video-container.them video");
    video.muted = true;
    video.srcObject = theirStream;
  };

  // Start video click handler
  const startVideoCallClick = () => {
    const video = document.querySelector(".video-container.them");
    const startButton = video.querySelector(".start");
    const stopButton = video.querySelector(".stop");
    startButton.classList.remove("active");
    stopButton.classList.add("active");

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((myStream) => {
        mediaConn && mediaConn.close();
        mediaConn = peer.call(conn.peer, myStream);
        mediaConn.on("stream", mediaConnOnStream);
      });
  };
  document
    .querySelector(".video-container.them .start")
    .addEventListener("click", startVideoCallClick);

  // Stop video click handler
  const stopVideoCallClick = () => {
    const video = document.querySelector(".video-container.them");
    const startButton = video.querySelector(".start");
    const stopButton = video.querySelector(".stop");
    stopButton.classList.remove("active");
    startButton.classList.add("active");
  };

  document
    .querySelector(".video-container.them .stop")
    .addEventListener("click", stopVideoCallClick);

  document
    .querySelector(".list-all-peers-button")
    .addEventListener("click", () => {
      const peersEl = document.querySelector(".peers");
      peersEl.firstChild && peersEl.firstChild.remove();
      const ul = document.createElement("ul");
      peer.listAllPeers((peers) => {
        peers
          .filter((p) => p !== myPeerId)
          .forEach((peerId) => {
            const li = document.createElement("li");
            const button = document.createElement("button");
            button.innerText = peerId;
            button.classList.add("connect-button");
            button.classList.add(`peerId-${peerId}`);
            button.addEventListener("click", connectToPeerClick);
            li.appendChild(button);
            ul.appendChild(li);
          });
        peersEl.appendChild(ul);
      });
    });

  //Peer changed
  document.addEventListener("peer-changed", (e) => {
    // Update connect button
    const peerId = e.detail.peerId;
    console.log("peerid: ", peerId);
    document.querySelectorAll(".connect-button.connected").forEach((e) => {
      e.classList.remove("connected");
    });
    const button = document.querySelector(`.connect-button.peerId-${peerId}`);
    button && button.classList.add("connected");

    // Update video subtext
    const video = document.querySelector(".video-container.them");
    video.querySelector(".name").innerHTML = peerId;
    video.classList.add("connected");
    video.querySelector(".stop").classList.remove("active");
    video.querySelector(".start").classList.add("active");
  });

  // Send Message
  const sendMessage = (message) => {
    let newMessage = document.querySelector(".new-message").value;
    conn.send(newMessage);
    // Print Message
    printMessage(newMessage, "me");
    messageBox.value = "";
  };

  document
    .querySelector(".send-new-message-button")
    .addEventListener("click", sendMessage);

  document.querySelector(".new-message").addEventListener("keyup", (e) => {
    if (e.key === "Enter") sendMessage();
  });
})();
