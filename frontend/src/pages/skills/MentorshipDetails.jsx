import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Form, Alert, Spinner, Card } from 'react-bootstrap';
import api from '../../apiRequests/api';
import VideoCall from '../../components/VideoCall';
import Navbar from '../../components/Navbar';
import { ACCESS_TOKEN } from '../../constants';

const MentorshipDetails = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [mentorship, setMentorship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [image, setImage] = useState(null);
  const [ws, setWs] = useState(null);
  const [isWsConnecting, setIsWsConnecting] = useState(false);
  const [activeCallId, setActiveCallId] = useState(null);
  const [realCallId, setRealCallId] = useState(null);
  const [userRoleInCall, setUserRoleInCall] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState('');
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchMentorship();
  }, [isAuthenticated, navigate, id]);

  useEffect(() => {
    if (mentorship && mentorship.status === 'active') {
      connectWebSocket();
    }
    return () => {
      if (ws) ws.close(1000, 'Component unmounted');
    };
  }, [mentorship]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMentorship = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/mentorships/${id}/`);
      setMentorship(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch mentorship details.');
      console.error('Error fetching mentorship:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN);
    let wsUrl = `ws://127.0.0.1:8000/api/ws/chat/${mentorship.chat_session_id}/`;
    if (accessToken && accessToken !== 'undefined') {
      wsUrl += `?token=${accessToken}`;
    }
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected for mentorship chat:', mentorship.chat_session_id);
      setIsWsConnecting(false);
      setError(null);
      setWs(websocket);
    };

    websocket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.message === 'Connected to chat') return;
      if (data.content || data.image_url) {
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === data.id)) return prev;
          return [...prev, {
            id: data.id,
            content: data.content,
            image_url: data.image_url,
            sender: data.sender,
            timestamp: data.timestamp
          }];
        });
      }
    };

    websocket.onerror = (e) => {
      console.error('WebSocket error:', e);
      setIsWsConnecting(false);
      setError('Chat connection failed. Retrying...');
      setTimeout(connectWebSocket, 3000); // Retry after 3s
    };

    websocket.onclose = (e) => {
      console.log('WebSocket closed:', e.code);
      setIsWsConnecting(false);
      if (e.code !== 1000) {
        setError('Chat connection lost. Retrying...');
        setTimeout(connectWebSocket, 3000);
      }
    };

    setIsWsConnecting(true);
    setWs(websocket);
  };

  const sendMessage = () => {
    if (ws && ws.readyState === WebSocket.OPEN && message.trim()) {
      ws.send(JSON.stringify({ message }));
      setMessage('');
    }
  };

  const sendImage = () => {
    if (ws && ws.readyState === WebSocket.OPEN && image) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Image = reader.result.split(',')[1];
        ws.send(JSON.stringify({ image: base64Image }));
        setImage(null);
      };
      reader.readAsDataURL(image);
    }
  };

  const handleStartCall = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/api/mentorship-start-video/${id}/`);
      if (response.data && response.data.call_id) {
        setRealCallId(response.data.call_id);
        setActiveCallId(response.data.call_id);
        setUserRoleInCall(response.data.user_role);
        console.log("Video call started/joined, call ID:", response.data.call_id, "Role:", response.data.user_role);
      } else {
        throw new Error('Invalid response from server when starting video call.');
      }
    } catch (err) {
      setError('Failed to start video call.');
      console.error('Error starting video call:', err);
      setRealCallId(null);
      setActiveCallId(null);
      setUserRoleInCall(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEndCall = async () => {
    if (realCallId) {
      setLoading(true);
      try {
        await api.post(`/api/mentorship-end-video/${realCallId}/`);
      } catch (err) {
        setError('Failed to properly end video call on server.');
        console.error('Error ending video call:', err);
      } finally {
        setLoading(false);
      }
    }
    setActiveCallId(null);
    setRealCallId(null);
    setUserRoleInCall(null);
  };

  const handleCompleteMentorship = async () => {
    setLoading(true);
    try {
      await api.post(`/api/mentorship-complete/${id}/`, { feedback, rating });
      setMentorship({ ...mentorship, status: 'completed', feedback, rating });
      setError(null);
    } catch (err) {
      setError('Failed to complete mentorship.');
      console.error('Error completing mentorship:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptMentorship = async () => {
    setLoading(true);
    try {
      await api.post(`/api/mentorship-accept/${id}/`);
      setMentorship({ ...mentorship, status: 'active' });
      setError(null);
      connectWebSocket(); // Connect to chat after accepting
    } catch (err) {
      setError('Failed to accept mentorship.');
      console.error('Error accepting mentorship:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectMentorship = async () => {
    setLoading(true);
    try {
      await api.post(`/api/mentorship-reject/${id}/`);
      setMentorship({ ...mentorship, status: 'rejected' });
      setError(null);
    } catch (err) {
      setError('Failed to reject mentorship.');
      console.error('Error rejecting mentorship:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error && !isWsConnecting) {
    return (
      <Alert variant="danger" dismissible onClose={() => setError(null)}>
        {error}
      </Alert>
    );
  }

  if (!mentorship) {
    return <p className="text-center mt-5">Mentorship not found.</p>;
  }

  const isLearner = user.id === mentorship.learner;
  const isMentor = user.id === mentorship.mentor;

  return (
    <>
      <Navbar />
      <div className="container py-5">
        <style>{`
          .chat-card {
            transition: box-shadow 0.2s ease;
          }
          .chat-card:hover {
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          }
          .message-bubble {
            border-radius: 0.75rem;
            max-width: 70%;
            word-wrap: break-word;
          }
          .user-message {
            background: linear-gradient(135deg, #0B2447 0%, #051124 100%);
            color: white;
          }
          .other-message {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
          }
          .chat-image {
            max-width: 100%;
            max-height: 200px;
            border-radius: 0.5rem;
          }
        `}</style>

        <h2 className="mb-4 text-center fw-semibold">Mentorship Details</h2>
        <Card className="shadow-sm mb-4">
          <Card.Body>
            <Card.Title>{mentorship.skill_name}</Card.Title>
            <Card.Text>
              <strong>Learner:</strong> {mentorship.learner_username}<br />
              <strong>Mentor:</strong> {mentorship.mentor_username}<br />
              <strong>Status:</strong> {mentorship.status}<br />
              {mentorship.feedback && (
                <>
                  <strong>Feedback:</strong> {mentorship.feedback}<br />
                  <strong>Rating:</strong> {mentorship.rating}/5
                </>
              )}
            </Card.Text>
            {mentorship.status === 'active' && (
              <div className="d-flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleStartCall}
                  className="rounded-3"
                >
                  Start Video Call
                </Button>
                {isLearner && (
                  <Button
                    variant="success"
                    onClick={() => setShowCompleteForm(true)}
                    className="rounded-3"
                  >
                    Complete Mentorship
                  </Button>
                )}
              </div>
            )}
            {mentorship.status === 'pending' && isMentor && (
              <div className="d-flex gap-2 mt-2">
                <Button
                  variant="success"
                  onClick={handleAcceptMentorship}
                  disabled={loading}
                  className="rounded-3"
                >
                  {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Accept'}
                </Button>
                <Button
                  variant="danger"
                  onClick={handleRejectMentorship}
                  disabled={loading}
                  className="rounded-3"
                >
                  {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Reject'}
                </Button>
              </div>
            )}
            {mentorship.status === 'completed' && (
              <div className="mt-3 border-top pt-3">
                <h5>Mentorship Feedback</h5>
                <p><strong>Feedback:</strong> {mentorship.feedback || 'No feedback provided.'}</p>
                <p><strong>Rating:</strong> {mentorship.rating ? `${mentorship.rating}/5` : 'Not rated.'}</p>
              </div>
            )}
          </Card.Body>
        </Card>

        {mentorship.status === 'active' && (
          <>
            {isWsConnecting && (
              <div className="d-flex justify-content-center my-5">
                <Spinner animation="border" />
                <span className="ms-2">Connecting to chat...</span>
              </div>
            )}

            {!isWsConnecting && error && (
              <Alert variant="danger" dismissible onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {!isWsConnecting && (
              <div
                className="card border-0 shadow-sm chat-card mb-4"
                style={{ height: '500px', overflowY: 'auto' }}
              >
                <div className="card-body p-4">
                  {messages.length === 0 ? (
                    <p className="text-muted text-center fs-5">No messages yet.</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`d-flex mb-3 ${
                          msg.sender.username === user.username
                            ? 'justify-content-end'
                            : 'justify-content-start'
                        }`}
                      >
                        <div
                          className={`p-3 message-bubble ${
                            msg.sender.username === user.username
                              ? 'user-message'
                              : 'other-message'
                          }`}
                        >
                          <strong className="d-block mb-1">{msg.sender.username}</strong>
                          {msg.content && <p className="mb-1">{msg.content}</p>}
                          {msg.image_url && (
                            <img
                              src={`http://localhost:8000${msg.image_url}`}
                              alt="Chat image"
                              className="chat-image mt-2 d-block"
                            />
                          )}
                          <small
                            className={`d-block text-end ${
                              msg.sender.username === user.username ? 'text-white' : 'text-muted'
                            }`}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </small>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}

            {!isWsConnecting && (
              <>
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button
                    variant="primary"
                    onClick={sendMessage}
                    disabled={!ws || ws.readyState !== WebSocket.OPEN || !message.trim()}
                    className="rounded-3"
                  >
                    Send
                  </Button>
                </div>

                <div className="mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control rounded-3"
                    onChange={(e) => setImage(e.target.files[0])}
                  />
                  <Button
                    variant="secondary"
                    className="rounded-3 w-100 mt-2"
                    onClick={sendImage}
                    disabled={!ws || ws.readyState !== WebSocket.OPEN || !image}
                  >
                    Send Image
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {isLearner && mentorship.status === 'active' && (
          <Card className="shadow-sm">
            <Card.Body>
              <h5>Complete Mentorship</h5>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Feedback</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share your experience..."
                    className="rounded-3"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Rating (1-5)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="rounded-3"
                  />
                </Form.Group>
                <Button
                  variant="success"
                  onClick={handleCompleteMentorship}
                  disabled={loading || !feedback || !rating}
                  className="rounded-3"
                >
                  {loading ? <Spinner animation="border" size="sm" /> : 'Submit'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        )}

        {activeCallId && userRoleInCall && (
          <VideoCall
            callId={activeCallId}
            isHelper={userRoleInCall === 'helper'}
            onEndCall={handleEndCall}
          />
        )}
      </div>
    </>
  );
};

export default MentorshipDetails;