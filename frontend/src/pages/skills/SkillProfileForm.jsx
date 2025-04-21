import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import api from '../../apiRequests/api';
import Navbar from '../../components/Navbar';

const SkillProfileForm = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    skill: '',
    proficiency: 'beginner',
    is_mentor: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/api/skill-profiles/', formData);
      setSuccess('Skill profile created successfully!');
      setFormData({ skill: '', proficiency: 'beginner', is_mentor: false });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create skill profile.');
      console.error('Error creating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Navbar />
    <div className="container py-5">
      <h2 className="mb-4 text-center fw-semibold">Create Skill Profile</h2>
      <div className="row justify-content-center">
        <div className="col-md-6">
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Skill</Form.Label>
              <Form.Control
                type="text"
                name="skill"
                value={formData.skill}
                onChange={handleChange}
                placeholder="e.g., Python"
                required
                className="rounded-3"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Proficiency</Form.Label>
              <Form.Select
                name="proficiency"
                value={formData.proficiency}
                onChange={handleChange}
                className="rounded-3"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="is_mentor"
                checked={formData.is_mentor}
                onChange={handleChange}
                label="I am available as a mentor"
              />
            </Form.Group>
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              className="w-100 rounded-3"
            >
              {loading ? <Spinner animation="border" size="sm" /> : 'Save Profile'}
            </Button>
          </Form>
        </div>
      </div>
    </div>
    </>
  );
};

export default SkillProfileForm;