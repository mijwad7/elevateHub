import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Card, Spinner, Alert, Container, Row, Col } from 'react-bootstrap';
import api from '../../apiRequests/api';
import Navbar from '../../components/Navbar';

const SkillsLanding = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState('');
  const [isMentorFilter, setIsMentorFilter] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProfiles();
  }, [isAuthenticated, navigate, search, isMentorFilter]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('skill', search);
      params.append('is_mentor', isMentorFilter);
      const response = await api.get(`/api/skill-profiles/?${params.toString()}`);
      setProfiles(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch skill profiles.');
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMentorship = (profileId) => {
    navigate(`/mentorships/request?profileId=${profileId}`);
  };

  return (
    <>
      <Navbar />
      <Container className="py-5" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <h2 className="mb-5 text-center fw-bold text-dark" style={{ letterSpacing: '1px', fontSize: '2.5rem' }}>
          Upskill Requests
        </h2>

        <Row className="mb-5 justify-content-center">
          <Col md={10} lg={8}>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
              <Button
                variant="primary"
                onClick={() => navigate('/skills/profile')}
                className="rounded-pill px-4 py-2 shadow-sm w-50"
                style={{ transition: 'all 0.3s ease', backgroundImage: 'linear-gradient(135deg, #0B2447 0%, #051124 100%)' }}
              >
                <i className="bi bi-person-gear me-2"></i>Create/Edit Skill Profile
              </Button>
              <Form className="d-flex align-items-center gap-3 w-100 w-md-auto">
                <Form.Control
                  type="text"
                  placeholder="Search skills..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-0 rounded-pill shadow-sm"
                  style={{ padding: '0.75rem 1.25rem', backgroundColor: '#fff' }}
                />
                <Form.Check
                  type="switch"
                  id="mentor-filter"
                  label="Mentors Only"
                  checked={isMentorFilter}
                  onChange={() => setIsMentorFilter(!isMentorFilter)}
                  className="text-muted fw-medium"
                />
              </Form>
            </div>
          </Col>
        </Row>

        {loading && (
          <div className="d-flex justify-content-center align-items-center my-5">
            <Spinner animation="border" variant="primary" style={{ width: '2.5rem', height: '2.5rem' }} />
            <span className="ms-3 fs-5 text-muted">Loading profiles...</span>
          </div>
        )}

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)} className="shadow-sm rounded-3">
            <Alert.Heading>Oops! Something went wrong.</Alert.Heading>
            <p>{error}</p>
          </Alert>
        )}

        <Row className="justify-content-center">
          {profiles.length === 0 && !loading ? (
            <Col md={8} className="text-center">
              <p className="text-muted fst-italic fs-5">No profiles found. Try adjusting your search or filter.</p>
            </Col>
          ) : (
            profiles.map((profile) => (
              <Col key={profile.id} md={6} lg={4} className="mb-4">
                <Card
                  className="shadow-lg border-0 rounded-4 h-100"
                  style={{
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    backgroundColor: '#fff',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  <Card.Body className="p-4">
                    <Card.Title className="text-primary fw-bold mb-3" style={{ fontSize: '1.5rem' }}>
                      {profile.skill}
                    </Card.Title>
                    <Card.Subtitle className="mb-3 text-muted fw-medium">
                      {profile.username}
                    </Card.Subtitle>
                    <Card.Text className="text-muted mb-4">
                      <div className="mb-2">
                        <strong>Proficiency:</strong>{' '}
                        <span className="text-dark">{profile.proficiency}</span>
                      </div>
                      <div>
                        <strong>Mentor:</strong>{' '}
                        <span className={`badge rounded-pill ${profile.is_mentor ? 'bg-success' : 'bg-secondary'}`}>
                          {profile.is_mentor ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </Card.Text>
                    {profile.is_mentor && (
                      <Button
                        variant="primary"
                        onClick={() => handleRequestMentorship(profile.id)}
                        className="rounded-pill px-4 py-2 shadow-sm w-100"
                        style={{
                          transition: 'all 0.3s ease',
                          backgroundImage: 'linear-gradient(135deg, #0B2447 0%, #051124 100%)',
                        }}
                      >
                        <i className="bi bi-person-plus me-2"></i>Request Mentorship
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))
          )}
        </Row>
      </Container>
    </>
  );
};

export default SkillsLanding;