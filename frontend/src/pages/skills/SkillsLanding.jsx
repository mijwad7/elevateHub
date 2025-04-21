import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Card, Spinner, Alert } from 'react-bootstrap';
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
      <div className="container py-5">
        <h2 className="mb-4 text-center fw-semibold">Upskill Requests</h2>
        <div className="d-flex justify-content-between mb-4">
        <Button
          variant="primary"
          onClick={() => navigate('/skills/profile')}
          className="rounded-3"
        >
          Create/Edit Skill Profile
        </Button>
        <Form className="d-flex">
          <Form.Control
            type="text"
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="me-2 rounded-3"
          />
          <Form.Check
            type="checkbox"
            label="Mentors Only"
            checked={isMentorFilter}
            onChange={() => setIsMentorFilter(!isMentorFilter)}
            className="align-self-center"
          />
        </Form>
      </div>

      {loading && (
        <div className="text-center my-5">
          <Spinner animation="border" />
        </div>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="row">
        {profiles.length === 0 && !loading && (
          <p className="text-center text-muted">No profiles found.</p>
        )}
        {profiles.map((profile) => (
          <div key={profile.id} className="col-md-4 mb-4">
            <Card className="shadow-sm skill-card">
              <Card.Body>
                <Card.Title>{profile.skill}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {profile.username}
                </Card.Subtitle>
                <Card.Text>
                  <strong>Proficiency:</strong> {profile.proficiency}<br />
                  <strong>Mentor:</strong> {profile.is_mentor ? 'Yes' : 'No'}
                </Card.Text>
                {profile.is_mentor && (
                  <Button
                    variant="primary"
                    onClick={() => handleRequestMentorship(profile.id)}
                    className="rounded-3"
                  >
                    Request Mentorship
                  </Button>
                )}
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
    </div>
    </>
  );
};

export default SkillsLanding;