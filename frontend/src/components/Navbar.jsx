// components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaComments, FaFolderOpen, FaHandsHelping, FaBell } from 'react-icons/fa';
import { logOut } from '../redux/authSlice';
import { addNotification } from '../redux/notificationSlice';

const Navbar = () => {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const notifications = useSelector((state) => state.notifications.notifications);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const wsRef = useRef(null);  // Use ref to persist WebSocket instance

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
                }
            };
            websocket.onerror = (e) => console.error("Notification WebSocket error:", e);
            websocket.onclose = (e) => {
                console.log("Notification WebSocket closed:", e.code);
                if (e.code !== 1000) setTimeout(connectWebSocket, 1000);  // Reconnect on abnormal close
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

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container">
                <Link className="navbar-brand" to="/">ElevateHub</Link>
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                    <li className="nav-item">
                        <Link className="nav-link" to="/discussions">
                            <FaComments /> Discussions
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to="/resources">
                            <FaFolderOpen /> Resources
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to="/help-requests">
                            <FaHandsHelping /> Project Help
                        </Link>
                    </li>
                </ul>
                {isAuthenticated ? (
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item dropdown">
                            <span className="nav-link dropdown-toggle" data-bs-toggle="dropdown">
                                <FaBell /> {notifications.length}
                            </span>
                            <ul className="dropdown-menu dropdown-menu-end">
                                {notifications.length > 0 ? (
                                    notifications.map((n, i) => (
                                        <li key={i} className="dropdown-item">
                                            {n.type === 'credit_added' ? `+${n.amount} credits added` : `${n.amount} credits spent`}
                                        </li>
                                    ))
                                ) : (
                                    <li className="dropdown-item">No notifications</li>
                                )}
                            </ul>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/profile">{user.username}</Link>
                        </li>
                        <li className="nav-item">
                            <button className="nav-link btn" onClick={handleLogout}>Logout</button>
                        </li>
                    </ul>
                ) : (
                    <Link className="nav-link" to="/login">Login</Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;