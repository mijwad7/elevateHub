import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Form, Alert, Spinner, Card, Container, Row, Col, InputGroup, Modal } from 'react-bootstrap';
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
  const [showCompleteModal, setShowCompleteModal] = useState(false);
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
    let wsUrl = `wss://elevatehub-proxy.mijuzz007.workers.dev/api/ws/chat/${mentorship.chat_session_id}/`;
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
      setTimeout(connectWebSocket, 3000);
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
      await api.post(`/api/mentorships/${id}/complete/`, { feedback, rating });
      setMentorship({ ...mentorship, status: 'completed', feedback, rating });
      setError(null);
      setShowCompleteModal(false);
      setFeedback('');
      setRating('');
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
      await api.post(`/api/mentorships/${id}/accept/`);
      setMentorship({ ...mentorship, status: 'active' });
      setError(null);
      connectWebSocket();
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
      await api.post(`/api/mentorships/${id}/reject/`);
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
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
        <span className="ms-3 fs-5 text-muted">Loading...</span>
      </div>
    );
  }

  if (error && !isWsConnecting) {
    return (
      <Container className="mt-5">
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="shadow-sm rounded-3">
          <Alert.Heading>Oops! Something went wrong.</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  if (!mentorship) {
    return (
      <Container className="mt-5 text-center">
        <h5 className="text-muted fw-light">Mentorship not found.</h5>
      </Container>
    );
  }

  const isLearner = user.id === mentorship.mentee.id;
  const isMentor = user.id === mentorship.mentor.id;

  return (
    <>
      <Navbar />
      <Container className="py-5" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>

        <Row className="mb-5">
          <Col md={5} className="mb-4 mb-md-0">
            <Card className="shadow-lg border-0 rounded-4">
              <Card.Body className="p-4 d-flex flex-column">
                <Card.Title className="text-primary fw-bold mb-4" style={{ fontSize: '1.75rem' }}>
                  {mentorship.topic}
                </Card.Title>
                <Card.Text className="text-muted">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span><strong>Learner:</strong> {mentorship.mentee.username}</span>
                    <span className="badge bg-secondary rounded-pill">{isLearner ? 'You' : ''}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span><strong>Mentor:</strong> {mentorship.mentor.username}</span>
                    <span className="badge bg-secondary rounded-pill">{isMentor ? 'You' : ''}</span>
                  </div>
                  <div className="mb-3">
                    <strong>Status:</strong>{' '}
                    <span
                      className={`badge rounded-pill ${
                        mentorship.status === 'active'
                          ? 'bg-success'
                          : mentorship.status === 'completed'
                          ? 'bg-info text-dark'
                          : 'bg-warning text-dark'
                      }`}
                    >
                      {mentorship.status.charAt(0).toUpperCase() + mentorship.status.slice(1)}
                    </span>
                  </div>
                  {mentorship.feedback && (
                    <>
                      <div className="mb-3">
                        <strong>Feedback:</strong>{' '}
                        <span className="text-dark">{mentorship.feedback}</span>
                      </div>
                      <div className="mb-3">
                        <strong>Rating:</strong>{' '}
                        <span className="text-warning">
                          {[...Array(parseInt(mentorship.rating))].map((_, i) => (
                            <i key={i} className="bi bi-star-fill me-1"></i>
                          ))}
                          {[...Array(5 - parseInt(mentorship.rating))].map((_, i) => (
                            <i key={i} className="bi bi-star me-1"></i>
                          ))}
                        </span>
                      </div>
                    </>
                  )}
                </Card.Text>

                <div className="mt-auto">
                  {mentorship.status === 'active' && (
                    <div className="d-grid gap-2 d-sm-flex">
                      <Button
                        variant="primary"
                        onClick={handleStartCall}
                        className="rounded-pill px-4 py-2 shadow-sm"
                        style={{ transition: 'all 0.3s ease' }}
                      >
                        <i className="bi bi-camera-video me-2"></i>Start Video Call
                      </Button>
                      {isLearner && (
                        <Button
                          variant="outline-success"
                          onClick={() => setShowCompleteModal(true)}
                          className="rounded-pill px-4 py-2 shadow-sm flex-grow-1"
                          style={{ transition: 'all 0.3s ease' }}
                        >
                          <i className="bi bi-check-circle me-2"></i>Complete Mentorship
                        </Button>
                      )}
                    </div>
                  )}
                  {mentorship.status === 'pending' && isMentor && (
                    <div className="d-grid gap-2 d-sm-flex mt-4">
                      <Button
                        variant="success"
                        onClick={handleAcceptMentorship}
                        disabled={loading}
                        className="rounded-pill px-4 py-2 shadow-sm"
                        style={{ transition: 'all 0.3s ease' }}
                      >
                        {loading ? (
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        ) : (
                          <>
                            <i className="bi bi-check2 me-2"></i>Accept
                          </>
                        )}
                      </Button>
                      <Button
                        variant="danger"
                        onClick={handleRejectMentorship}
                        disabled={loading}
                        className="rounded-pill px-4 py-2 shadow-sm"
                        style={{ transition: 'all 0.3s ease' }}
                      >
                        {loading ? (
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        ) : (
                          <>
                            <i className="bi bi-x-lg me-2"></i>Reject
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {mentorship.status === 'active' && (
            <Col md={7}>
              {isWsConnecting && (
                <div className="d-flex justify-content-center align-items-center my-5 p-5 bg-light rounded-3 shadow-sm">
                  <Spinner animation="border" variant="primary" style={{ width: '2.5rem', height: '2.5rem' }} />
                  <span className="ms-3 fs-5 text-muted">Connecting to chat...</span>
                </div>
              )}

              {!isWsConnecting && error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)} className="shadow-sm rounded-3">
                  <Alert.Heading>Oops! Chat Connection Error.</Alert.Heading>
                  <p>{error}</p>
                </Alert>
              )}

              {!isWsConnecting && !error && (
                <Card className="shadow-lg border-0 rounded-4 h-100 d-flex flex-column">
                  <Card.Header className="bg-gradient bg-primary text-white rounded-top-4">
                    <h5 className="mb-0 fw-semibold">Chat Room</h5>
                  </Card.Header>
                  <Card.Body className="p-4 bg-light flex-grow-1" style={{ height: '450px', overflowY: 'auto' }}>
                    {messages.length === 0 ? (
                      <p className="text-muted text-center mb-0 fst-italic">Start the conversation...</p>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`d-flex mb-4 ${
                            msg.sender.username === user.username
                              ? 'justify-content-end'
                              : 'justify-content-start'
                          }`}
                        >
                          <div
                            className={`p-3 rounded-3 shadow-sm ${
                              msg.sender.username === user.username
                                ? 'bg-primary text-white'
                                : 'bg-white border border-light'
                            }`}
                            style={{
                              maxWidth: '70%',
                              transition: 'all 0.3s ease',
                              transform: msg.sender.username === user.username ? 'translateX(5px)' : 'translateX(-5px)',
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <strong>{msg.sender.username} </strong>
                            </div>
                            {msg.content && <p className="mb-1">{msg.content}</p>}
                            {msg.image_url && (
                              <img
                                src={msg.image_url}
                                alt="Chat image"
                                className="img-fluid rounded-3 mt-2"
                                style={{ maxHeight: '200px', objectFit: 'cover' }}
                              />
                            )}
                            <small
                              className={`d-block text-end mt-1 ${
                                msg.sender.username === user.username ? 'text-white-50' : 'text-muted'
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
                  </Card.Body>
                  <Card.Footer className="p-3 bg-white border-top-0 rounded-bottom-4">
                    <InputGroup className="mb-3 shadow-sm rounded-3">
                      <Form.Control
                        type="text"
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        className="border-0 rounded-start-3"
                        style={{ padding: '0.75rem 1.25rem' }}
                      />
                      <Button
                        variant="primary"
                        onClick={sendMessage}
                        disabled={!ws || ws.readyState !== WebSocket.OPEN || !message.trim()}
                        className="rounded-end-3 px-4"
                        style={{ transition: 'all 0.3s ease' }}
                      >
                        <i className="bi bi-send-fill"></i>
                      </Button>
                    </InputGroup>
                    <Form.Group controlId="formFile" className="mb-3">
                      <Form.Label className="visually-hidden">Upload Image</Form.Label>
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImage(e.target.files[0])}
                        className="border-0 rounded-3 shadow-sm"
                        style={{ padding: '0.75rem 1.25rem' }}
                      />
                    </Form.Group>
                    <Button
                      variant="secondary"
                      onClick={sendImage}
                      disabled={!ws || ws.readyState !== WebSocket.OPEN || !image}
                      className="w-100 rounded-3 shadow-sm py-2"
                      style={{ transition: 'all 0.3s ease' }}
                    >
                      <i className="bi bi-image me-2"></i>Send Image
                    </Button>
                  </Card.Footer>
                </Card>
              )}
            </Col>
          )}
        </Row>

        <Modal show={showCompleteModal} onHide={() => setShowCompleteModal(false)} centered>
          <Modal.Header closeButton className="bg-success text-white">
            <Modal.Title className="fw-semibold">Complete Mentorship</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="fw-medium">Feedback</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your experience..."
                  className="rounded-3 shadow-sm"
                  style={{ resize: 'none' }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-medium">Rating (1-5)</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="rounded-3 shadow-sm"
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCompleteModal(false)} className="rounded-pill px-4">
              Close
            </Button>
            <Button
              variant="success"
              onClick={handleCompleteMentorship}
              disabled={loading || !feedback || !rating}
              className="rounded-pill px-4"
            >
              {loading ? (
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              ) : (
                <>
                  <i className="bi bi-check-circle-fill me-2"></i>Submit Feedback
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {activeCallId && userRoleInCall && (
          <Row className="justify-content-center">
            <Col md={10} lg={8}>
              <Card className="shadow-lg border-0 rounded-4">
                <Card.Header className="bg-gradient bg-info text-dark rounded-top-4">
                  <h5 className="mb-0 fw-semibold">Video Call</h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <VideoCall
                    callId={activeCallId}
                    isHelper={userRoleInCall === 'helper'}
                    onEndCall={handleEndCall}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </>
  );
};

export default MentorshipDetails;