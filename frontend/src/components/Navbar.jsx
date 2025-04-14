// src/components/Navbar.jsx (updated snippet)
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaComments, FaFolderOpen, FaHandsHelping, FaBell } from 'react-icons/fa';
import { logoutUser } from '../redux/authSlice';
import { addNotification, fetchNotifications, markNotificationAsRead, markAllAsRead, clearNotifications } from '../redux/notificationSlice';
import { Button } from 'react-bootstrap';
import VideoCall from './VideoCall';
import { ACCESS_TOKEN } from '../constants';

const Navbar = () => {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const { notifications = [], status } = useSelector((state) => state.notifications);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const wsRef = useRef(null);
    const [pendingCallId, setPendingCallId] = useState(null); // Changed from callId
    const [activeCallId, setActiveCallId] = useState(null); // New state for active call

    // Safely calculate unread count
    const unreadCount = Array.isArray(notifications) 
        ? notifications.filter(n => !n.is_read).length 
        : 0;

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchNotifications());
            
            const connectWebSocket = () => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

                const token = localStorage.getItem(ACCESS_TOKEN);
                if (!token) {
                    console.error("No access token found");
                    return;
                }

                const websocket = new WebSocket(`ws://127.0.0.1:8000/api/ws/notifications/?token=${encodeURIComponent(token)}`);
                
                websocket.onopen = () => {
                    console.log("Notification WebSocket connected");
                    dispatch(clearNotifications());
                };
                
                websocket.onmessage = (e) => {
                    try {
                        console.log("Received WebSocket message:", e.data);  // Debug log
                        const data = JSON.parse(e.data);
                        if (data.type === 'notification') {
                            console.log("Processing notification:", data.notification);  // Debug log
                            dispatch(addNotification(data.notification));
                            if (data.notification.notification_type === 'video_call_started') {
                                console.log("Video call notification received, callId:", data.notification.callId);
                                setPendingCallId(data.notification.callId || null);
                            }
                        } else if (data.type === 'error') {
                            console.error("WebSocket error:", data.message);  // Debug log
                        }
                    } catch (error) {
                        console.error("Error parsing WebSocket message:", error);  // Debug log
                        console.error("Raw message data:", e.data);  // Log the raw message data
                    }
                };
                
                websocket.onerror = (e) => {
                    console.error("Notification WebSocket error:", e);
                    setTimeout(connectWebSocket, 5000);
                };
                
                websocket.onclose = (e) => {
                    console.log("Notification WebSocket closed:", e.code);
                    if (e.code !== 1000) {
                        setTimeout(connectWebSocket, 5000);
                    }
                };
                
                wsRef.current = websocket;
            };

            connectWebSocket();
        }

        return () => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close(1000, "Navbar unmounted");
            }
        };
    }, [isAuthenticated, dispatch]);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/login');
    };

    const handleMarkAsRead = (notificationId) => {
        dispatch(markNotificationAsRead(notificationId));
    };

    const handleMarkAllAsRead = () => {
        dispatch(markAllAsRead());
    };

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
                                <FaBell />
                                {unreadCount > 0 && (
                                    <span className="badge bg-danger rounded-pill ms-1">
                                        {unreadCount}
                                    </span>
                                )}
                            </span>
                            <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: '300px' }}>
                                <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
                                    <h6 className="mb-0">Notifications</h6>
                                    {unreadCount > 0 && (
                                        <button
                                            className="btn btn-sm btn-link"
                                            onClick={handleMarkAllAsRead}
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                </div>
                                {status === 'loading' ? (
                                    <li className="dropdown-item text-center">
                                        <div className="spinner-border spinner-border-sm" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </li>
                                ) : Array.isArray(notifications) && notifications.length > 0 ? (
                                    notifications.map((notification) => (
                                        <li
                                            key={notification.id}
                                            className={`dropdown-item ${!notification.is_read ? 'bg-light' : ''}`}
                                        >
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    {notification.message}
                                                    {notification.link && (
                                                        <a
                                                            href={notification.link}
                                                            className="ms-2"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            View
                                                        </a>
                                                    )}
                                                    {notification.notification_type === 'video_call_started' && (
                                                        <Button
                                                            variant="link"
                                                            className="ms-2 p-0"
                                                            onClick={() => handleJoinCall(notification.callId)}
                                                            disabled={!notification.callId}
                                                        >
                                                            Join Call
                                                        </Button>
                                                    )}
                                                </div>
                                                {!notification.is_read && (
                                                    <button
                                                        className="btn btn-sm btn-link"
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                    >
                                                        Mark as read
                                                    </button>
                                                )}
                                            </div>
                                            <small className="text-muted d-block">
                                                {new Date(notification.created_at).toLocaleString()}
                                            </small>
                                        </li>
                                    ))
                                ) : (
                                    <li className="dropdown-item text-center text-muted">
                                        No notifications
                                    </li>
                                )}
                            </ul>
                        </li>
                        <li className="nav-item"><Link className="nav-link" to="/profile">Profile</Link></li>
                        <li className="nav-item"><button className="nav-link btn" onClick={handleLogout}>Logout</button></li>
                    </ul>
                ) : (
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                            <Link className="nav-link btn btn-outline-primary me-2" to="/login">Login</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link btn btn-outline-primary" to="/register">Register</Link>
                        </li>
                    </ul>
                )}
            </div>
            {activeCallId && <VideoCall callId={activeCallId} isHelper={false} onEndCall={handleEndCall} />}
        </nav>
    );
};

export default Navbar;