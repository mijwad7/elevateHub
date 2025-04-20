import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaComments, FaFolderOpen, FaHandsHelping, FaBell, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { logoutUser } from '../redux/authSlice';
import { addNotification, fetchNotifications, markNotificationAsRead, markAllAsRead, clearNotifications } from '../redux/notificationSlice';
import { Button, Badge, Dropdown, Spinner } from 'react-bootstrap';
import VideoCall from './VideoCall';
import { ACCESS_TOKEN } from '../constants';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { notifications = [], status } = useSelector((state) => state.notifications);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const [pendingCallId, setPendingCallId] = useState(null);
  const [activeCallId, setActiveCallId] = useState(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(true);
  const [expandedNotificationId, setExpandedNotificationId] = useState(null);

  // Filter duplicates (same timestamp and message) and sort by timestamp
  const filteredNotifications = Array.isArray(notifications)
    ? [...new Map(
        notifications
          .filter(n => showUnreadOnly ? !n.is_read : true)
          .map(n => [`${n.created_at}_${n.message}`, n])
      ).values()]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    : [];

  const unreadCount = filteredNotifications.filter(n => !n.is_read).length;

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
            console.log("Received WebSocket message:", e.data);
            const data = JSON.parse(e.data);
            if (data.type === 'notification') {
              console.log("Processing notification:", data.notification);
              dispatch(addNotification(data.notification));
              if (data.notification.notification_type === 'video_call_started') {
                console.log("Video call notification received, callId:", data.notification.callId);
                setPendingCallId(data.notification.callId || null);
              }
            } else if (data.type === 'error') {
              console.error("WebSocket error:", data.message);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
            console.error("Raw message data:", e.data);
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

  const toggleExpandNotification = (id) => {
    setExpandedNotificationId(expandedNotificationId === id ? null : id);
  };

  const handleJoinCall = (id) => {
    setActiveCallId(id);
  };

  const handleEndCall = () => {
    setActiveCallId(null);
    setPendingCallId(null);
  };

  const toggleShowUnread = () => {
    setShowUnreadOnly(!showUnreadOnly);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">ElevateHub</Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/discussions">
                <FaComments className="me-1" /> Discussions
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/resources">
                <FaFolderOpen className="me-1" /> Resources
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/help-requests">
                <FaHandsHelping className="me-1" /> Project Help
              </NavLink>
            </li>
          </ul>
          {isAuthenticated ? (
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              <li className="nav-item d-flex align-items-center">
                <Dropdown>
                  <Dropdown.Toggle
                    variant="link"
                    className="nav-link text-white p-0"
                    id="notifications-dropdown"
                  >
                    <FaBell size={20} />
                    {unreadCount > 0 && (
                      <Badge bg="danger" pill className="ms-1">
                        {unreadCount}
                      </Badge>
                    )}
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end" className="notification-dropdown p-3 animate__animated animate__fadeIn">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0 fw-bold">Notifications</h6>
                      <div>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={toggleShowUnread}
                          className="me-2 text-decoration-none"
                        >
                          {showUnreadOnly ? 'Show All' : 'Show Unread'}
                        </Button>
                        {unreadCount > 0 && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="text-decoration-none"
                          >
                            Mark All Read
                          </Button>
                        )}
                      </div>
                    </div>
                    {status === 'loading' ? (
                      <div className="text-center py-3">
                        <Spinner animation="border" size="sm" />
                      </div>
                    ) : filteredNotifications.length > 0 ? (
                      filteredNotifications.map((notification) => (
                        <Dropdown.Item
                          key={notification.id}
                          as="div"
                          className={`notification-item py-2 px-3 mb-1 rounded animate__animated animate__fadeInUp ${
                            !notification.is_read ? 'bg-light' : ''
                          }`}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div
                              className={`notification-message ${
                                expandedNotificationId === notification.id ? 'expanded' : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandNotification(notification.id);
                              }}
                            >
                              <span>{notification.message}</span>
                              <div className="mt-1">
                                {notification.link && (
                                  <a
                                    href={notification.link}
                                    className="text-primary me-2"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    View
                                  </a>
                                )}
                                {notification.notification_type === 'video_call_started' && (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleJoinCall(notification.callId);
                                    }}
                                    disabled={!notification.callId}
                                    className="btn-join-call"
                                  >
                                    Join Call
                                  </Button>
                                )}
                              </div>
                            </div>
                            {!notification.is_read && (
                              <Button
                                variant="link"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="text-muted p-0 btn-mark-read"
                              >
                                Mark Read
                              </Button>
                            )}
                          </div>
                          <small className="text-muted d-block mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </small>
                        </Dropdown.Item>
                      ))
                    ) : (
                      <div className="text-center text-muted py-3">
                        No {showUnreadOnly ? 'unread' : ''} notifications
                      </div>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              </li>
              <li className="nav-item ms-lg-2  d-flex align-items-center">
                <NavLink className="nav-link text-white" to="/profile">
                  <FaUserCircle size={20} />
                </NavLink>
              </li>
              <li className="nav-item ms-lg-2 d-flex align-items-center">
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={handleLogout}
                  className="ms-0 ms-lg-2"
                >
                  <FaSignOutAlt className="me-1" /> Logout
                </Button>
              </li>
            </ul>
          ) : (
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <NavLink className="nav-link btn btn-primary me-2" to="/login">
                  Login
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link btn btn-primary" to="/register">
                  Register
                </NavLink>
              </li>
            </ul>
          )}
        </div>
      </div>
      {activeCallId && (
        <VideoCall callId={activeCallId} isHelper={false} onEndCall={handleEndCall} />
      )}
    </nav>
  );
};

export default Navbar;