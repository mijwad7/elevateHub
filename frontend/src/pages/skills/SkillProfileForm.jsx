import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Alert, Spinner, Container, Row, Col, Card } from 'react-bootstrap';
import api from '../../apiRequests/api';
import Navbar from '../../components/Navbar';

const SkillProfileForm = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    skill: '',
    proficiency: 'beginner',
    is_mentor: false,
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formLoading, setFormLoading] = useState(!!id);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/categories/');
        setCategories(response.data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError('Could not load categories. Please try again later.');
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (id) {
      setFormLoading(true);
      const fetchProfile = async () => {
        try {
          const response = await api.get(`/api/skill-profiles/${id}/`);
          const profile = response.data;
          setFormData({
            skill: profile.skill,
            proficiency: profile.proficiency,
            is_mentor: profile.is_mentor,
            category: profile.category_details?.id || '',
          });
        } catch (err) {
          console.error('Failed to fetch skill profile:', err);
          setError('Failed to load skill profile data.');
        } finally {
          setFormLoading(false);
        }
      };
      fetchProfile();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.category) {
      setError('Please select a category.');
      setLoading(false);
      return;
    }

    const profileData = {
      skill: formData.skill,
      proficiency: formData.proficiency,
      is_mentor: formData.is_mentor,
      category: formData.category,
    };

    try {
      if (id) {
        await api.put(`/api/skill-profiles/${id}/`, profileData);
      } else {
        await api.post('/api/skill-profiles/', profileData);
      }
      setSuccess('Skill profile created successfully!');
      setFormData({ skill: '', proficiency: 'beginner', is_mentor: false, category: '' });
      navigate('/skills');
    } catch (err) {
      console.error('Error saving skill profile:', err);
      setError(err.response?.data?.detail || 'Failed to save skill profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <Container className="py-5" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <h2 className="mb-5 text-center fw-bold text-dark" style={{ letterSpacing: '1px', fontSize: '2.5rem' }}>
          {id ? 'Edit' : 'Create'} Skill Profile
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
                {formLoading ? (
                  <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                    <p>Loading profile...</p>
                  </div>
                ) : (
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
                      <Form.Label className="fw-medium text-dark">Category</Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="border-0 rounded-3 shadow-sm"
                        style={{ padding: '0.75rem 1.25rem', backgroundColor: '#fff' }}
                        required
                        disabled={categories.length === 0}
                      >
                        <option value="" disabled>Select a category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-medium text-dark">Proficiency</Form.Label>
                      <Form.Select
                        name="proficiency"
                        value={formData.proficiency}
                        onChange={handleChange}
                        className="border-0 rounded-3 shadow-sm"
                        style={{ padding: '0.75rem 1.25rem', backgroundColor: '#fff' }}
                        required
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
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default SkillProfileForm;