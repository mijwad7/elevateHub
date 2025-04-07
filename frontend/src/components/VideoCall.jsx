// src/components/VideoCall.jsx
import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Button } from "react-bootstrap";
import { FaVideoSlash } from "react-icons/fa";
import { ACCESS_TOKEN } from "../constants";
import axios from "axios";

const VideoCall = ({ callId, isHelper, onEndCall }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const [isCallActive, setIsCallActive] = useState(true);
  const candidateQueue = useRef([]); // Queue for ICE candidates
  const isRemoteDescriptionSet = useRef(false); // Corrected: single ref object

  useEffect(() => {
    if (!isAuthenticated) return;

    const startVideoCall = async () => {
      // Initialize WebRTC
      pcRef.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // Get local stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localVideoRef.current.srcObject = stream;
        stream
          .getTracks()
          .forEach((track) => pcRef.current.addTrack(track, stream));
      } catch (error) {
        console.error("Error accessing media devices:", error);
        return;
      }

      // Handle remote stream
      pcRef.current.ontrack = (event) => {
        console.log("Remote track received:", event.streams[0]);
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      // Queue ICE candidates until WebSocket is ready
      pcRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Generated ICE candidate:", event.candidate);
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            console.log("Sending ICE candidate:", event.candidate);
            wsRef.current.send(
              JSON.stringify({ type: "candidate", candidate: event.candidate })
            );
          } else {
            console.log("Queuing ICE candidate:", event.candidate);
            candidateQueue.current.push(event.candidate);
          }
        }
      };

      // Connect WebSocket
      const token = localStorage.getItem(ACCESS_TOKEN);
      wsRef.current = new WebSocket(
        `ws://127.0.0.1:8000/api/ws/video-call/${callId}/?token=${token}`
      );
      wsRef.current.onopen = () => {
        console.log(`Video WebSocket connected for call ${callId}`);
        // Send queued candidates only after signaling is complete (handled below)
      };

      wsRef.current.onmessage = async (e) => {
        const data = JSON.parse(e.data);
        console.log("Received WebSocket message:", data);

        if (data.type === "offer" && !isHelper) {
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription({ type: data.type_sdp, sdp: data.sdp })
          );
          isRemoteDescriptionSet.current = true; // Corrected: update ref directly
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          wsRef.current.send(
            JSON.stringify({
              type: "answer",
              sdp: answer.sdp,
              type_sdp: answer.type,
            })
          );
          // Send any queued candidates after answer
          flushCandidateQueue();
        } else if (data.type === "answer" && isHelper) {
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription({ type: data.type_sdp, sdp: data.sdp })
          );
          isRemoteDescriptionSet.current = true; // Corrected: update ref directly
          // Send queued candidates after answer received
          flushCandidateQueue();
        } else if (
          data.type === "candidate" &&
          isRemoteDescriptionSet.current
        ) {
          await pcRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
          console.log("Added ICE candidate:", data.candidate);
        } else if (data.type === "candidate") {
          console.log(
            "Queuing received ICE candidate (remote description not set):",
            data.candidate
          );
          candidateQueue.current.push(data.candidate);
        }
      };

      wsRef.current.onerror = (e) => console.error("WebSocket error:", e);
      wsRef.current.onclose = () =>
        console.log(`Video WebSocket closed for call ${callId}`);

      // Helper initiates offer
      if (isHelper) {
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        console.log("Sending offer:", offer);
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "offer",
              sdp: offer.sdp,
              type_sdp: offer.type,
            })
          );
          flushCandidateQueue(); // Send any early candidates after offer
        } else {
          console.log("WebSocket not ready, offer will be sent on connect");
          wsRef.current.onopen = () => {
            console.log(`Video WebSocket connected for call ${callId}`);
            wsRef.current.send(
              JSON.stringify({
                type: "offer",
                sdp: offer.sdp,
                type_sdp: offer.type,
              })
            );
            flushCandidateQueue();
          };
        }
      }
    };

    // Flush queued candidates when ready
    const flushCandidateQueue = () => {
      while (candidateQueue.current.length > 0) {
        const candidate = candidateQueue.current.shift();
        console.log("Sending queued ICE candidate:", candidate);
        wsRef.current.send(JSON.stringify({ type: "candidate", candidate }));
      }
    };

    startVideoCall();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (pcRef.current) {
        pcRef.current.getTracks?.().forEach((track) => track.stop());
        pcRef.current.close();
      }
    };
  }, [isAuthenticated, callId, isHelper, user]);

  const handleEndCall = async () => {
    try {
      await axios.post(
        `http://127.0.0.1:8000/api/end-video/${callId}/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`,
          },
        }
      );
      setIsCallActive(false);
      onEndCall();
    } catch (error) {
      console.error("Error ending call:", error);
    }
  };

  if (!isCallActive) return null;

  return (
    <div
      className="video-call-container"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.8)",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <video
          ref={localVideoRef}
          autoPlay
          muted
          style={{ width: "300px", margin: "10px", borderRadius: "5px" }}
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          style={{
            width: "300px",
            margin: "10px",
            borderRadius: "5px",
            border: "2px solid #fff",
          }}
        />
      </div>
      <Button
        variant="danger"
        onClick={handleEndCall}
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <FaVideoSlash /> End Call
      </Button>
    </div>
  );
};

export default VideoCall;
