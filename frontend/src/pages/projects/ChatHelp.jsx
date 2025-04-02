// src/pages/project_help/ChatHelp.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { endChat } from '../../apiRequests/helpRequests';
import Navbar from '../../components/Navbar';

const ChatHelp = () => {
    const { requestId, chatId } = useParams();
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [ws, setWs] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        console.log("Auth state on mount:", { user, isAuthenticated, localAccess: localStorage.getItem('access') });
        if (!isAuthenticated) {
            console.log("Not authenticated, redirecting...");
            navigate('/login');
            return;
        }

        const connectWebSocket = () => {
            const accessToken = localStorage.getItem('access');
            let wsUrl = `ws://127.0.0.1:8000/api/ws/chat/${chatId}/`;
            if (accessToken && accessToken !== 'undefined') {
                wsUrl += `?token=${accessToken}`;
            }
            const websocket = new WebSocket(wsUrl);
            websocket.onopen = () => console.log("WebSocket connected");
            websocket.onmessage = (e) => {
                const data = JSON.parse(e.data);
                console.log("Received:", data);
                if (data.content && data.sender) {
                    setMessages((prev) => {
                        if (prev.some((msg) => msg.id === data.id)) return prev;
                        return [...prev, data];
                    });
                }
            };
            websocket.onerror = (e) => console.error("WebSocket error:", e);
            websocket.onclose = (e) => {
                console.log("WebSocket closed:", e.code, e.reason);
                if (e.code === 4001) {
                    console.error("Authentication failed, redirecting...");
                    navigate('/login');
                } else if (e.code !== 1000) {
                    setTimeout(connectWebSocket, 1000);
                }
            };
            setWs(websocket);
            return websocket;
        };

        const websocket = connectWebSocket();
        return () => {
            if (websocket) {
                console.log("Cleaning up WebSocket");
                websocket.close(1000, "Component unmounted");
            }
        };
    }, [chatId, isAuthenticated, navigate]);

    const sendMessage = () => {
        if (ws && ws.readyState === WebSocket.OPEN && message.trim()) {
            ws.send(JSON.stringify({ message }));
            setMessage('');
        } else {
            console.warn("WebSocket not open:", ws?.readyState);
        }
    };

    const handleEndChat = async () => {
        if (ws) ws.close(1000, "Chat ended");
        const result = await endChat(chatId);
        if (result) navigate(`/project-help/${requestId}`);
    };

    if (!isAuthenticated) return <p>Please log in.</p>;

    return (
        <>
            <Navbar />
            <div className="container mt-5">
                <h2>Chat Help</h2>
                <div className="card mb-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <div className="card-body">
                        {messages.map((msg) => (
                            <p key={msg.id}><strong>{msg.sender.username}:</strong> {msg.content}</p>
                        ))}
                    </div>
                </div>
                <div className="input-group mb-3">
                    <input
                        type="text"
                        className="form-control"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <button className="btn btn-primary" onClick={sendMessage}>Send</button>
                </div>
                <button className="btn btn-danger" onClick={handleEndChat}>End Chat</button>
            </div>
        </>
    );
};

export default ChatHelp;