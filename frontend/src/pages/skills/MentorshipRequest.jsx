import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Alert, Spinner } from 'react-bootstrap';
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
      const response = await api.post('/api/mentorship-request/', {
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

  if (!profile) {
    return <p className="text-center mt-5">Mentor not found.</p>;
  }

  return (
    <>
    <Navbar />
    <div className="container py-5">
      <h2 className="mb-4 text-center fw-semibold">Request Mentorship</h2>
      <div className="row justify-content-center">
        <div className="col-md-6">
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5>{profile.skill}</h5>
              <p>
                <strong>Mentor:</strong> {profile.username}<br />
                <strong>Proficiency:</strong> {profile.proficiency}
              </p>
              <p className="text-muted">
                Requesting mentorship will cost 15 credits.
              </p>
              <Button
                variant="primary"
                onClick={handleRequest}
                disabled={loading}
                className="w-100 rounded-3"
              >
                {loading ? <Spinner animation="border" size="sm" /> : 'Send Request'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default MentorshipRequest;