// src/components/VideoCall.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Button } from 'react-bootstrap';
import { FaVideo, FaVideoSlash } from 'react-icons/fa';
import { ACCESS_TOKEN } from '../constants';
import axios from 'axios';

const VideoCall = ({ callId, onEndCall }) => {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const pcRef = useRef(null);
    const wsRef = useRef(null);
    const [isCallActive, setIsCallActive] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) return;

        const startVideoCall = async () => {
            // Initialize WebRTC
            pcRef.current = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // Free STUN server
            });
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideoRef.current.srcObject = stream;
            stream.getTracks().forEach(track => pcRef.current.addTrack(track, stream));

            pcRef.current.ontrack = (event) => {
                remoteVideoRef.current.srcObject = event.streams[0];
            };
            pcRef.current.onicecandidate = (event) => {
                if (event.candidate) {
                    wsRef.current.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
                }
            };

            // Connect WebSocket
            const token = localStorage.getItem(ACCESS_TOKEN);
            wsRef.current = new WebSocket(`ws://127.0.0.1:8000/api/ws/video-call/${callId}/?token=${token}`);
            wsRef.current.onopen = () => console.log(`Video WebSocket connected for call ${callId}`);
            wsRef.current.onmessage = async (e) => {
                const data = JSON.parse(e.data);
                if (data.type === 'offer') {
                    await pcRef.current.setRemoteDescription(new RTCSessionDescription(data));
                    const answer = await pcRef.current.createAnswer();
                    await pcRef.current.setLocalDescription(answer);
                    wsRef.current.send(JSON.stringify({ type: 'answer', ...answer }));
                } else if (data.type === 'answer') {
                    await pcRef.current.setRemoteDescription(new RTCSessionDescription(data));
                } else if (data.type === 'candidate') {
                    await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                }
            };
            wsRef.current.onerror = (e) => console.error("WebSocket error:", e);
            wsRef.current.onclose = () => console.log(`Video WebSocket closed for call ${callId}`);

            // Start signaling (helper initiates offer)
            if (user.username === callId.helper) { // Assuming callId includes helper info; adjust as needed
                const offer = await pcRef.current.createOffer();
                await pcRef.current.setLocalDescription(offer);
                wsRef.current.send(JSON.stringify({ type: 'offer', ...offer }));
            }
        };

        startVideoCall();

        return () => {
            if (wsRef.current) wsRef.current.close();
            if (pcRef.current) {
                pcRef.current.getTracks?.().forEach(track => track.stop());
                pcRef.current.close();
            }
        };
    }, [isAuthenticated, callId, user]);

    const handleEndCall = async () => {
        try {
            await axios.post(`http://127.0.0.1:8000/api/end-video/${callId}/`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}` }
            });
            setIsCallActive(false);
            onEndCall();
        } catch (error) {
            console.error("Error ending call:", error);
        }
    };

    if (!isCallActive) return null;

    return (
        <div className="video-call-container" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000 }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <video ref={localVideoRef} autoPlay muted style={{ width: '300px', margin: '10px', borderRadius: '5px' }} />
                <video ref={remoteVideoRef} autoPlay style={{ width: '300px', margin: '10px', borderRadius: '5px' }} />
            </div>
            <Button variant="danger" onClick={handleEndCall} style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}>
                <FaVideoSlash /> End Call
            </Button>
        </div>
    );
};

export default VideoCall;