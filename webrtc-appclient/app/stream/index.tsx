import React, { useEffect, useRef, useState } from "react";
import { Button, PermissionsAndroid, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  mediaDevices,
  MediaStream,
  registerGlobals,
  RTCView,
} from "react-native-webrtc";

registerGlobals();

let peerConstraints = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

let mediaConstraints = {
  audio: true,
  video: {
    frameRate: 30,
    facingMode: "user",
  },
};

let sessionConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true,
  voiceActivityDetection: true,
};

const SERVER_URL = `ws://${process.env.EXPO_PUBLIC_SERVER_URL}`;

const StreamScreen = () => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    createSocket();
    getLocalStream();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      setLocalStream(null);
      return;
    };
  }, []);

  async function requestAndroid() {
    console.log("PermissionsAndroid", PermissionsAndroid.PERMISSIONS);

    const cam = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA
    );

    const mic = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );

    return cam === "granted" && mic === "granted";
  }

  const getLocalStream = async () => {
    const hasPermission = await requestAndroid();
    if (hasPermission) {
      const localStream = await mediaDevices.getUserMedia(mediaConstraints);
      setLocalStream(localStream);
    }
  };

  const createSocket = () => {
    socketRef.current = new WebSocket(SERVER_URL);

    socketRef.current.onopen = () => {
      console.log("onopen");
    };

    socketRef.current.onmessage = async (message) => {
      const data = JSON.parse(message.data);

      if (data.type === "answer") {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(data.payload);
        }
      }
    };
  };

  const createPeerConnection = async () => {
    const pc = new RTCPeerConnection(peerConstraints);

    /* EVENTS HANDLERS */
    pc.onicecandidate = (event) => {
      console.log("/*_______________ ON ICECANDIDATE", event);
      if (event.candidate) {
        sendMessage({ type: "candidate", payload: event.candidate });
      }
    };
    pc.onicecandidateerror = (error) => {
      console.log("/*_______________ ON ICECANDIDATE ERROR", error);
    };
    pc.ontrack = (event) => {
      console.log("/*_______________ ON TRACK", event);
    };
    // pc.onnegotiationneeded = (event) => {
    //   console.log("/*_______________ ON NEGOTIATION", event);
    // }; ???

    /* STATE LISTENERS */
    pc.onconnectionstatechange = () => {
      console.log("/*_______________ STATE PEER", pc.connectionState);
    };
    pc.oniceconnectionstatechange = () => {
      console.log("/*_______________ STATE ICE", pc.iceConnectionState);
    };
    pc.onicegatheringstatechange = () => {
      console.log("/*_______________ STATE ICE GATHER", pc.iceGatheringState);
    };
    pc.onsignalingstatechange = () => {
      console.log("/*_______________ STATE SIGNALS", pc.signalingState);
    };

    /* Add tracks to peer */
    // if (localStream) {
    //   console.log("se agregan tracks");
    //   localStream.getTracks().forEach((track) => {
    //     // @ts-expect-error
    //     pc.addTrack(track, localStream);
    //   });
    // }

    const localStream = await mediaDevices.getUserMedia(mediaConstraints);
    localStream.getTracks().forEach((track) => {
      // @ts-expect-error
      pc.addTrack(track, localStream);
    });

    return pc;
  };

  const sendMessage = (message) => {
    console.log("sendMessage", message);
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify(message));
    }
  };

  const call = async () => {
    peerConnectionRef.current = await createPeerConnection();

    try {
      const offerDescription = await peerConnectionRef.current.createOffer(
        sessionConstraints
      );
      await peerConnectionRef.current.setLocalDescription(offerDescription);

      sendMessage({ type: "offer", payload: offerDescription });
    } catch (error) {
      console.log("ERROR EL LA OFFER", error);
    }
  };

  return (
    <SafeAreaView style={styles.flex} edges={["bottom"]}>
      {localStream && (
        <>
          <RTCView
            style={styles.flex}
            streamURL={localStream.toURL()}
            mirror={true}
            objectFit={"cover"}
            zOrder={0}
          />
          <Button title="Llamar" onPress={call} />
        </>
      )}
    </SafeAreaView>
  );
};

export default StreamScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
