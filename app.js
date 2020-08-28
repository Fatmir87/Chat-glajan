const peerOnOpen = (id) => {
    document.querySelector(".my-peer-id").innerHTML = id;
};

const peerOnError = (error) => {
    console.log(error)
};

// Connect to Peer
let myPeerId = location.hash.slice(1);

peer = new Peer(myPeerId, {
    host: "glajan.com",
    port: 8443,
    path: "/myapp",
    secure: true,
});

// Handel Peer Event.
peer.on("open", peerOnOpen);
peer.on("error", peerOnError)

document
.querySelector('.list-all-peers-button')
.addEventListener('click', () => {
    const peersEl = document.querySelector(".peers")
        const ul = document.createElement('ul');
        peer.listAllPeers((peers) => {
            peers
                .filter((p) => p !== myPeerId)
                .forEach((peerId) => {
                    const li = document.createElement("li");
                    const button = document.createElement("button");
                    button.innerText = peerId;
                    button.classList.add("connect-button");
                    button.classList.add(`peerId-${peerId}`);
                    li.appendChild(button);
                    ul.appendChild(li);
                })
                    peersEl.appendChild(ul);
            });
        });
