import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Spinner, Container, Row, Col } from 'react-bootstrap';
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
      <Container className="py-5" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <h2 className="mb-5 text-center fw-bold text-dark" style={{ letterSpacing: '1px', fontSize: '2.5rem' }}>
          Create Skill Profile
        </h2>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError(null)} className="shadow-sm rounded-3">
                <Alert.Heading>Oops! Something went wrong.</Alert.Heading>
                <p>{error}</p>
              </Alert>
            )}
            {success && (
              <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="shadow-sm rounded-3">
                <Alert.Heading>Success!</Alert.Heading>
                <p>{success}</p>
              </Alert>
            )}
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-body p-4">
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium text-dark">Skill</Form.Label>
                    <Form.Control
                      type="text"
                      name="skill"
                      value={formData.skill}
                      onChange={handleChange}
                      placeholder="e.g., Python"
                      required
                      className="border-0 rounded-3 shadow-sm"
                      style={{ padding: '0.75rem 1.25rem', backgroundColor: '#fff' }}
                    />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium text-dark">Proficiency</Form.Label>
                    <Form.Select
                      name="proficiency"
                      value={formData.proficiency}
                      onChange={handleChange}
                      className="border-0 rounded-3 shadow-sm"
                      style={{ padding: '0.75rem 1.25rem', backgroundColor: '#fff' }}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Check
                      type="switch"
                      id="mentor-switch"
                      name="is_mentor"
                      checked={formData.is_mentor}
                      onChange={handleChange}
                      label="I am available as a mentor"
                      className="text-muted fw-medium"
                    />
                  </Form.Group>
                  <Button
                    variant="primary"
                    type="submit"
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
                        <i className="bi bi-save me-2"></i>Save Profile
                      </>
                    )}
                  </Button>
                </Form>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default SkillProfileForm;