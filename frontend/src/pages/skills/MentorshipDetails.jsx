import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Form, Alert, Spinner, Card } from 'react-bootstrap';
import api from '../../apiRequests/api';
import VideoCall from '../../components/VideoCall';
import { ACCESS_TOKEN } from '../../constants';
import Navbar from '../../components/Navbar';
const MentorshipDetails = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [mentorship, setMentorship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [ws, setWs] = useState(null);
  const [isWsConnecting, setIsWsConnecting] = useState(false);
  const [activeCallId, setActiveCallId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState('');
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
    const wsUrl = `ws://127.0.0.1:8000/api/ws/video-call/${mentorship.chat_session_id}/?token=${accessToken}`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected for mentorship chat:', mentorship.chat_session_id);
      setIsWsConnecting(false);
      setWs(websocket);
    };

    websocket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'chat') {
        setMessages((prev) => [...prev, {
          id: Date.now(),
          content: data.content,
          sender: { username: data.sender },
          timestamp: data.timestamp
        }]);
      }
    };

    websocket.onerror = (e) => {
      console.error('WebSocket error:', e);
      setIsWsConnecting(false);
      setError('Chat connection failed.');
    };

    websocket.onclose = (e) => {
      console.log('WebSocket closed:', e.code);
      setIsWsConnecting(false);
    };

    setIsWsConnecting(true);
    setWs(websocket);
  };

  const sendMessage = () => {
    if (ws && ws.readyState === WebSocket.OPEN && message.trim()) {
      ws.send(JSON.stringify({ type: 'chat', content: message }));
      setMessage('');
    }
  };

  const handleStartCall = () => {
    setActiveCallId(mentorship.chat_session_id);
  };

  const handleEndCall = () => {
    setActiveCallId(null);
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

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
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

  return (
    <>
    <Navbar />
    <div className="container py-5">
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
        </Card.Body>
      </Card>

      {mentorship.status === 'active' && (
        <>
          <div
            className="card border-0 shadow-sm chat-card mb-4"
            style={{ height: '400px', overflowY: 'auto' }}
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
                      <p className="mb-1">{msg.content}</p>
                      <small
                        className={`d-block text-end ${
                          msg.sender.username === user.username ? 'text-white' : 'text-muted'
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </small>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

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

      {activeCallId && (
        <VideoCall
          callId={activeCallId}
          isHelper={user.id === mentorship.mentor}
          onEndCall={handleEndCall}
        />
      )}
    </div>
    </>
  );
};

export default MentorshipDetails;