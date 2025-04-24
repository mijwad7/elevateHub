import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Alert, Spinner, Container, Row, Col, Card } from 'react-bootstrap';
import api from '../../apiRequests/api';
import Navbar from '../../components/Navbar';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const MentorshipRequest = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const profileId = query.get('profileId');
  const { user } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [credits, setCredits] = useState(user?.credits?.balance || 0);

  useEffect(() => {
    const fetchProfileAndCredits = async () => {
      setLoading(true);
      try {
        // Fetch profile details
        const profileRes = await api.get(`/api/skill-profiles/${profileId}/`);
        setProfile(profileRes.data);

        // Fetch current credits (ensure latest balance)
        const creditsRes = await api.get('/api/credits/');
        setCredits(creditsRes.data.balance);

        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load mentorship request details. Please try again.');
        setProfile(null); // Clear profile on error
      } finally {
        setLoading(false);
      }
    };

    if (profileId) {
      fetchProfileAndCredits();
    } else {
      setError('No skill profile specified.');
      setLoading(false);
    }
  }, [profileId]);

  const handleRequest = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await api.post('/api/mentorships/request/', { skill_profile_id: profileId });
      // Navigate to the newly created mentorship details page
      navigate(`/mentorships/${response.data.id}`); 
    } catch (err) {
      console.error('Error requesting mentorship:', err);
      setError(err.response?.data?.error || 'Failed to send mentorship request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container className="text-center mt-5">
          <Spinner animation="border" variant="primary" />
          <p>Loading request details...</p>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="shadow border-0 rounded-4">
              <Card.Header as="h4" className="text-center bg-light fw-bold rounded-top-4">Request Mentorship</Card.Header>
              <Card.Body className="p-4">
                {error && <Alert variant="danger">{error}</Alert>}
                
                {profile ? (
                  <>
                    <p className="mb-3">You are requesting mentorship from <strong>{profile.username}</strong> in the skill:</p>
                    <div className="mb-4 p-3 bg-light rounded-3 border">
                        <h5 className="text-primary mb-2"><i className="bi bi-code-slash me-2"></i>{profile.skill}</h5>
                        {/* Display Category */}
                        {profile.category_details && (
                           <p className="mb-1 text-muted">
                                <i className="bi bi-tags-fill me-2"></i>Category: <strong>{profile.category_details.name}</strong>
                           </p>
                        )}
                        <p className="mb-0 text-muted">
                            <i className="bi bi-bar-chart-line-fill me-2"></i>Proficiency Level: <strong>{profile.proficiency}</strong>
                        </p>
                    </div>

                    <div className="alert alert-info d-flex align-items-center shadow-sm border-info border-2">
                      <i className="bi bi-info-circle-fill me-3 fs-4"></i>
                      <div>
                        Requesting this mentorship will cost <strong>15 credits</strong>.
                        Your current balance is <strong>{credits} credits</strong>.
                      </div>
                    </div>

                    {credits < 15 && (
                      <Alert variant="warning" className="fw-bold text-center">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>Insufficient Credits
                      </Alert>
                    )}

                    <div className="d-grid gap-2 mt-4">
                      <Button 
                        variant="primary"
                        onClick={handleRequest}
                        disabled={submitting || credits < 15 || !profile}
                        className="rounded-pill shadow-sm py-2"
                      >
                        {submitting ? (
                          <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Sending Request...</>
                        ) : (
                          <><i className="bi bi-send-check-fill me-2"></i>Confirm Mentorship Request</>
                        )}
                      </Button>
                      <Button variant="outline-secondary" onClick={() => navigate('/skills')} className="rounded-pill py-2">
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  // Show error or specific message if profile failed to load but no general error set
                  !error && <Alert variant="warning">Could not load skill profile details.</Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default MentorshipRequest;