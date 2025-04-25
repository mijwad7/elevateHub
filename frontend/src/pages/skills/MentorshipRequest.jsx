import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Alert, Spinner, Container, Row, Col, Card } from 'react-bootstrap';
import api from '../../apiRequests/api';
import Navbar from '../../components/Navbar';

const MentorshipRequest = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const profileId = new URLSearchParams(location.search).get('profileId');
    if (profileId) {
      fetchProfile(profileId);
    } else {
      setError('No mentor selected.');
      setLoading(false);
    }
  }, [isAuthenticated, navigate, location]);

  const fetchProfile = async (profileId) => {
    try {
      const response = await api.get(`/api/skill-profiles/${profileId}/`);
      setProfile(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch mentor profile.');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/mentorships/request/', {
        skill_profile_id: profile.id,
      });
      setSuccess('Mentorship request sent successfully!');
      setTimeout(() => navigate('/skills'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send mentorship request.');
      console.error('Error requesting mentorship:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <Spinner animation="border" variant="primary" style={{ width: '2.5rem', height: '2.5rem' }} />
        <span className="ms-3 fs-5 text-muted">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="shadow-sm rounded-3">
          <Alert.Heading>Oops! Something went wrong.</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container className="mt-5 text-center">
        <h5 className="text-muted fw-light">Mentor not found.</h5>
      </Container>
    );
  }

  return (
    <>
      <Navbar />
      <Container className="py-5" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <h2 className="mb-5 text-center fw-bold text-dark" style={{ letterSpacing: '1px', fontSize: '2.5rem' }}>
          Request Mentorship
        </h2>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            {success && (
              <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="shadow-sm rounded-3">
                <Alert.Heading>Success!</Alert.Heading>
                <p>{success}</p>
              </Alert>
            )}
            <Card className="shadow-lg border-0 rounded-4">
              <Card.Body className="p-4">
                <Card.Title className="text-primary fw-bold mb-4" style={{ fontSize: '1.75rem' }}>
                  {profile.skill}
                </Card.Title>
                <Card.Text className="text-muted mb-4">
                  <div className="mb-3">
                    <strong>Mentor:</strong> <span className="text-dark">{profile.username}</span>
                  </div>
                  <div className="mb-3">
                    <strong>Proficiency:</strong>{' '}
                    <span className="text-dark">{profile.proficiency.charAt(0).toUpperCase() + profile.proficiency.slice(1)}</span>
                  </div>
                  <div className="text-muted fst-italic">
                    Acceptance of this mentorship request will cost <span className="text-warning fw-medium">15 credits</span>.
                  </div>
                </Card.Text>
                <Button
                  variant="primary"
                  onClick={handleRequest}
                  disabled={loading}
                  className="w-100 rounded-pill py-2 shadow-sm"
                  style={{
                    transition: 'all 0.3s ease',
                    backgroundImage: 'linear-gradient(135deg, #0B2447 0%, #051124 100%)',
                  }}
                >
                  {loading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>
                      <i className="bi bi-person-plus me-2"></i>Send Request
                    </>
                  )}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default MentorshipRequest;