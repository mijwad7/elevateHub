// src/components/VideoCall.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Button } from 'react-bootstrap';
import { FaVideoSlash } from 'react-icons/fa';
import { ACCESS_TOKEN } from '../constants';
import axios from 'axios';

const VideoCall = ({ callId, isHelper, onEndCall }) => {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const pcRef = useRef(null);
    const wsRef = useRef(null);
    const [isCallActive, setIsCallActive] = useState(true);
    const [connectionState, setConnectionState] = useState('initial');
    const candidateQueue = useRef([]);
    const isRemoteDescriptionSet = useRef(false);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) return;

        const startVideoCall = async () => {
            pcRef.current = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            });

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localVideoRef.current.srcObject = stream;
                stream.getTracks().forEach(track => {
                    console.log(`Adding track: ${track.kind}`);
                    pcRef.current.addTrack(track, stream);
                });
            } catch (error) {
                console.error("Error accessing media devices:", error);
                return;
            }

            pcRef.current.ontrack = (event) => {
                console.log("Remote track received:", event.streams[0], "Track:", event.track);
                remoteVideoRef.current.srcObject = event.streams[0];
                setConnectionState('connected');
            };

            pcRef.current.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("Generated ICE candidate:", event.candidate);
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
                    } else {
                        candidateQueue.current.push(event.candidate);
                    }
                } else {
                    console.log("ICE candidate gathering complete");
                }
            };

            pcRef.current.oniceconnectionstatechange = () => {
                console.log("ICE connection state:", pcRef.current.iceConnectionState);
                setConnectionState(pcRef.current.iceConnectionState);
            };

            const token = localStorage.getItem(ACCESS_TOKEN);
            wsRef.current = new WebSocket(`ws://127.0.0.1:8000/api/ws/video-call/${callId}/?token=${token}`);
            wsRef.current.onopen = () => {
                console.log(`Video WebSocket connected for call ${callId}, isHelper: ${isHelper}`);
                if (isHelper) {
                    sendOffer();
                }
            };

            wsRef.current.onmessage = async (e) => {
                const data = JSON.parse(e.data);
                console.log(`Received WebSocket message (isHelper: ${isHelper}):`, data);

                if (data.status === 'call_ended') {
                    console.log("Call ended by other user");
                    setIsCallActive(false);
                    onEndCall();
                    return;
                }

                if (data.type === 'offer' && !isHelper) {
                    console.log("Processing offer...");
                    await pcRef.current.setRemoteDescription(new RTCSessionDescription({ type: data.type_sdp, sdp: data.sdp }));
                    isRemoteDescriptionSet.current = true;
                    const answer = await pcRef.current.createAnswer();
                    await pcRef.current.setLocalDescription(answer);
                    wsRef.current.send(JSON.stringify({ type: 'answer', sdp: answer.sdp, type_sdp: answer.type }));
                    flushCandidateQueue();
                    setConnectionState('answered');
                } else if (data.type === 'answer' && isHelper) {
                    console.log("Processing answer...");
                    await pcRef.current.setRemoteDescription(new RTCSessionDescription({ type: data.type_sdp, sdp: data.sdp }));
                    isRemoteDescriptionSet.current = true;
                    flushCandidateQueue();
                    setConnectionState('answer_received');
                } else if (data.type === 'candidate' && isRemoteDescriptionSet.current) {
                    try {
                        await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                        console.log("Added ICE candidate:", data.candidate);
                        setConnectionState('candidate_added');
                    } catch (error) {
                        console.error("Error adding ICE candidate:", error);
                    }
                } else if (data.type === 'candidate') {
                    console.log("Queuing candidate (remote description not set):", data.candidate);
                    candidateQueue.current.push(data.candidate);
                }
            };

            wsRef.current.onerror = (e) => console.error("WebSocket error:", e);
            wsRef.current.onclose = (e) => {
                console.log(`Video WebSocket closed for call ${callId}, code: ${e.code}`);
                setConnectionState('closed');
            };

            const sendOffer = async () => {
                const offer = await pcRef.current.createOffer();
                await pcRef.current.setLocalDescription(offer);
                console.log("Sending offer:", offer);
                wsRef.current.send(JSON.stringify({ type: 'offer', sdp: offer.sdp, type_sdp: offer.type }));
                flushCandidateQueue();
            };
        };

        const flushCandidateQueue = () => {
            while (candidateQueue.current.length > 0 && wsRef.current.readyState === WebSocket.OPEN) {
                const candidate = candidateQueue.current.shift();
                console.log("Sending queued ICE candidate:", candidate);
                wsRef.current.send(JSON.stringify({ type: 'candidate', candidate }));
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
    }, [isAuthenticated, callId, isHelper, onEndCall]);

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

    const toggleAudio = () => {
        const audioTracks = localVideoRef.current.srcObject.getAudioTracks();
        audioTracks.forEach(track => {
            track.enabled = !track.enabled;
        });
        setIsAudioEnabled(prev => !prev);
    };

    const toggleVideo = () => {
        const videoTracks = localVideoRef.current.srcObject.getVideoTracks();
        videoTracks.forEach(track => {
            track.enabled = !track.enabled;
        });
        setIsVideoEnabled(prev => !prev);
    };

    if (!isCallActive) return null;

    return (
        <div className="video-call-container d-flex flex-column justify-content-center align-items-center" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000 }}>
            <div className="d-flex justify-content-center align-items-center mb-3">
                <video ref={localVideoRef} autoPlay muted className="rounded border border-light" style={{ width: '500px', margin: '10px' }} />
                <video ref={remoteVideoRef} autoPlay className="rounded border border-light" style={{ width: '500px', margin: '10px' }} />
            </div>
            <div className="button-group" style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}>
                <Button variant="danger" onClick={handleEndCall} className="mx-2">
                    <FaVideoSlash /> End Call
                </Button>
                <Button variant="secondary" onClick={toggleAudio} className="mx-2">
                    {isAudioEnabled ? 'Mute Audio' : 'Unmute Audio'}
                </Button>
                <Button variant="secondary" onClick={toggleVideo} className="mx-2">
                    {isVideoEnabled ? 'Disable Video' : 'Enable Video'}
                </Button>
            </div>
        </div>
    );
};

export default VideoCall;