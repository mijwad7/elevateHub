// src/components/Navbar.jsx (updated snippet)
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaComments, FaFolderOpen, FaHandsHelping, FaBell } from 'react-icons/fa';
import { logOut } from '../redux/authSlice';
import { addNotification } from '../redux/notificationSlice';
import { Button } from 'react-bootstrap';
import VideoCall from './VideoCall';

const Navbar = () => {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const notifications = useSelector((state) => state.notifications.notifications);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const wsRef = useRef(null);
    const [pendingCallId, setPendingCallId] = useState(null); // Changed from callId
    const [activeCallId, setActiveCallId] = useState(null); // New state for active call

    useEffect(() => {
        if (!isAuthenticated) return;

        const connectWebSocket = () => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

            const websocket = new WebSocket('ws://127.0.0.1:8000/api/ws/notifications/');
            websocket.onopen = () => console.log("Notification WebSocket connected");
            websocket.onmessage = (e) => {
                const data = JSON.parse(e.data);
                if (data.type === 'notification') {
                    dispatch(addNotification(data.notification));
                    if (data.notification.description.includes("started a video call")) {
                        const callIdMatch = data.notification.description.match(/call ID (\d+)/);
                        if (callIdMatch) setPendingCallId(callIdMatch[1]); // Set pending, not active
                    }
                }
            };
            websocket.onerror = (e) => console.error("Notification WebSocket error:", e);
            websocket.onclose = (e) => {
                console.log("Notification WebSocket closed:", e.code);
                if (e.code !== 1000) setTimeout(connectWebSocket, 1000);
            };
            wsRef.current = websocket;
        };

        connectWebSocket();

        return () => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close(1000, "Navbar unmounted");
            }
        };
    }, [isAuthenticated, dispatch]);

    const handleLogout = () => {
        dispatch(logOut());
        navigate('/login');
    };

    const uniqueNotifications = Array.from(
        new Map(notifications.map(n => [`${n.amount}-${n.description}-${n.timestamp}`, n])).values()
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const handleJoinCall = (id) => {
        setActiveCallId(id); // Activate call only on click
    };

    const handleEndCall = () => {
        setActiveCallId(null);
        setPendingCallId(null); // Clear pending call
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container">
                <Link className="navbar-brand" to="/">ElevateHub</Link>
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                    <li className="nav-item"><Link className="nav-link" to="/discussions"><FaComments /> Discussions</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/resources"><FaFolderOpen /> Resources</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/help-requests"><FaHandsHelping /> Project Help</Link></li>
                </ul>
                {isAuthenticated ? (
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item dropdown">
                            <span className="nav-link dropdown-toggle" data-bs-toggle="dropdown">
                                <FaBell /> {uniqueNotifications.length}
                            </span>
                            <ul className="dropdown-menu dropdown-menu-end">
                                {uniqueNotifications.length > 0 ? (
                                    uniqueNotifications.map((n, i) => (
                                        <li key={i} className="dropdown-item">
                                            {n.description}
                                            {n.description.includes("started a video call") && (
                                                <Button variant="link" onClick={() => handleJoinCall(n.description.match(/call ID (\d+)/)[1])}>
                                                    Join
                                                </Button>
                                            )}
                                        </li>
                                    ))
                                ) : (
                                    <li className="dropdown-item">No notifications</li>
                                )}
                            </ul>
                        </li>
                        <li className="nav-item"><Link className="nav-link" to="/profile">Profile</Link></li>
                        <li className="nav-item"><button className="nav-link btn" onClick={handleLogout}>Logout</button></li>
                    </ul>
                ) : (
                    <Link className="nav-link" to="/login">Login</Link>
                )}
            </div>
            {activeCallId && <VideoCall callId={activeCallId} isHelper={false} onEndCall={handleEndCall} />}
        </nav>
    );
};

export default Navbar;