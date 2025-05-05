import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Button } from 'react-bootstrap';
import { FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaVideo } from 'react-icons/fa';
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
    const [isRemoteAudioEnabled, setIsRemoteAudioEnabled] = useState(true);
    const [isRemoteVideoEnabled, setIsRemoteVideoEnabled] = useState(true);
    const [remoteStreamActive, setRemoteStreamActive] = useState(false);
    const [resetKey, setResetKey] = useState(0); // Key to force remount

    const connectWebSocket = () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        const wsUrl = `wss://elevatehub-proxy.mijuzz007.workers.dev/api/ws/video-call/${callId}/?token=${token}`;
        console.log(`Connecting to WebSocket: ${wsUrl}`);
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
            console.log(`Video WebSocket connected for call ${callId}, isHelper: ${isHelper}`);
            if (isHelper) {
                sendOffer();
            }
        };

        wsRef.current.onmessage = async (e) => {
            try {
                const data = JSON.parse(e.data);
                console.log(`Received WebSocket message (isHelper: ${isHelper}):`, data);

                if (data.status === 'call_ended') {
                    console.log("WebSocket received call_ended signal");
                    if (isCallActive) {
                        console.log("Processing call_ended: Setting isCallActive false and calling onEndCall.");
                        setIsCallActive(false);
                        onEndCall();
                    } else {
                        console.log("Ignoring call_ended signal as call is already inactive locally.");
                    }
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
                } else if (data.type === 'track_status') {
                    console.log("Received track status update:", data);
                    if (data.trackType === 'audio') {
                        setIsRemoteAudioEnabled(data.enabled);
                    } else if (data.trackType === 'video') {
                        setIsRemoteVideoEnabled(data.enabled);
                    }
                }
            } catch (error) {
                console.error("Error processing WebSocket message:", error);
            }
        };

        wsRef.current.onerror = (e) => {
            console.error("WebSocket error:", e);
            setConnectionState('error');
        };

        wsRef.current.onclose = (e) => {
            console.log(`Video WebSocket closed for call ${callId}, code: ${e.code}, retrying in 3s...`);
            setConnectionState('closed');
            setTimeout(connectWebSocket, 3000);
        };
    };

    const sendOffer = async () => {
        try {
            const offer = await pcRef.current.createOffer();
            await pcRef.current.setLocalDescription(offer);
            console.log("Sending offer:", offer);
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'offer', sdp: offer.sdp, type_sdp: offer.type }));
                flushCandidateQueue();
            } else {
                console.warn("WebSocket not ready, offer will be sent on reconnect");
            }
        } catch (error) {
            console.error("Error sending offer:", error);
        }
    };

    const flushCandidateQueue = () => {
        while (candidateQueue.current.length > 0 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const candidate = candidateQueue.current.shift();
            console.log("Sending queued ICE candidate:", candidate);
            wsRef.current.send(JSON.stringify({ type: 'candidate', candidate }));
        }
    };

    useEffect(() => {
        if (!isAuthenticated) return;

        const startVideoCall = async () => {
            pcRef.current = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                    // Add TURN server here
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
                setRemoteStreamActive(true);
                setConnectionState('connected');
                const audioTrack = event.streams[0].getAudioTracks()[0];
                const videoTrack = event.streams[0].getVideoTracks()[0];
                if (audioTrack) setIsRemoteAudioEnabled(audioTrack.enabled);
                if (videoTrack) setIsRemoteVideoEnabled(videoTrack.enabled);
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

            connectWebSocket();
        };

        startVideoCall();

        const checkRemoteStream = setInterval(() => {
            if (!remoteStreamActive && isCallActive && connectionState !== 'connected') {
                console.log('Remote stream not detected, resetting component...');
                setResetKey(prev => prev + 1); // Force remount
            } else {
                clearInterval(checkRemoteStream);
            }
        }, 5000);

        return () => {
            clearInterval(checkRemoteStream);
            if (wsRef.current) wsRef.current.close();
            if (pcRef.current) {
                pcRef.current.getTracks?.().forEach(track => track.stop());
                pcRef.current.close();
            }
        };
    }, [isAuthenticated, callId, isHelper, onEndCall, resetKey]);

    const handleEndCall = () => {
        setIsCallActive(false);
        onEndCall();
    };

    const toggleAudio = () => {
        const audioTracks = localVideoRef.current.srcObject.getAudioTracks();
        audioTracks.forEach(track => {
            track.enabled = !track.enabled;
        });
        setIsAudioEnabled(prev => {
            const newState = !prev;
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'track_status',
                    trackType: 'audio',
                    enabled: newState
                }));
            }
            return newState;
        });
    };

    const toggleVideo = () => {
        const videoTracks = localVideoRef.current.srcObject.getVideoTracks();
        videoTracks.forEach(track => {
            track.enabled = !track.enabled;
        });
        setIsVideoEnabled(prev => {
            const newState = !prev;
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'track_status',
                    trackType: 'video',
                    enabled: newState
                }));
            }
            return newState;
        });
    };

    const resetCall = () => {
        console.log('Manually resetting call...');
        setResetKey(prev => prev + 1); // Force remount
    };

    if (!isCallActive) return null;

    return (
        <div className="video-call-container d-flex flex-column justify-content-center align-items-center" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000 }} key={resetKey}>
            <div className="d-flex justify-content-center align-items-center mb-3">
                <div className="video-container position-relative">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        className="rounded border border-light"
                        style={{ width: '500px', margin: '10px' }}
                    />
                    <div className="icon-overlay position-absolute top-0 end-0 p-2 d-flex flex-column">
                        {!isAudioEnabled && (
                            <FaMicrophoneSlash size={24} color="white" className="mb-2" title="Audio Muted" />
                        )}
                        {!isVideoEnabled && (
                            <FaVideoSlash size={24} color="white" title="Video Disabled" />
                        )}
                    </div>
                </div>
                <div className="video-container position-relative">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        className="rounded border border-light"
                        style={{ width: '500px', margin: '10px' }}
                    />
                    <div className="icon-overlay position-absolute top-0 end-0 p-2 d-flex flex-column">
                        {!isRemoteAudioEnabled && (
                            <FaMicrophoneSlash size={24} color="white" className="mb-2" title="Remote Audio Muted" />
                        )}
                        {!isRemoteVideoEnabled && (
                            <FaVideoSlash size={24} color="white" title="Remote Video Disabled" />
                        )}
                    </div>
                </div>
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