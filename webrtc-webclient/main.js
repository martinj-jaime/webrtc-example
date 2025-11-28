const onload = () => {
  let socket = new WebSocket(`ws://${CONFIG.WS_URL}`);
  let peerConnection;

  socket.onopen = () => {
    console.log("WS conectado");
  };

  const handleOffer = async (offer) => {
    if (!peerConnection) {
      peerConnection = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      });
    }

    const remoteVideo = document.getElementById("video");

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      remoteVideo.srcObject = remoteStream;
    };

    await peerConnection.setRemoteDescription(offer);

    // Crear answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Enviar answer al backend
    socket.send(JSON.stringify({ type: "answer", payload: answer }));
  };

  socket.onmessage = async (event) => {
    let data = JSON.parse(event.data);

    if (data.type === "offer") {
      await handleOffer(data.payload);
    }

    if (data.type === "candidate") {
      try {
        await peerConnection.addIceCandidate(data.payload);
      } catch (e) {
        console.error(e);
      }
    }
  };
};

window.onload = onload;
