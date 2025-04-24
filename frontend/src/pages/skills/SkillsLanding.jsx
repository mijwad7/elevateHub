import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Card, Spinner, Alert, Container, Row, Col } from 'react-bootstrap';
import api from '../../apiRequests/api';
import Navbar from '../../components/Navbar';
import CategoryFilter from '../../components/CategoryFilter';

const SkillsLanding = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState('');
  const [isMentorFilter, setIsMentorFilter] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProfiles();
  }, [isAuthenticated, navigate, search, isMentorFilter, selectedCategory]);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const params = new URLSearchParams();
      if (search) params.append('skill', search);
      params.append('is_mentor', isMentorFilter);
      if (selectedCategory) params.append('category_id', selectedCategory);
      const response = await api.get(`/api/skill-profiles/?${params.toString()}`);
      setProfiles(response.data);
    } catch (err) {
      setError('Failed to fetch skill profiles. Please try again later.');
      console.error('Error fetching profiles:', err);
      setProfiles([]); // Clear profiles on error
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
        <h2 className="mb-4 text-center fw-bold text-dark" style={{ letterSpacing: '1px', fontSize: '2.5rem' }}>
          Find Mentors & Skills
        </h2>
        <p className="text-center text-muted mb-5">Explore skill profiles or create your own to connect with others.</p>

        {/* Create Profile Button */}
        <Row className="mb-5 justify-content-center">
            <Col md={10} lg={12} className="text-center">
                 <Button
                    variant="primary"
                    onClick={() => navigate('/skills/profile')}
                    className="rounded-pill px-5 py-2 shadow-sm"
                    style={{ transition: 'all 0.3s ease', backgroundImage: 'linear-gradient(135deg, #11346B 0%, #0B2447 100%)' }}
                 >
                    <i className="bi bi-person-gear me-2"></i>Manage My Skill Profile
                 </Button>
            </Col>
        </Row>

        {/* Filters and Search Section */}
        <Row className="mb-5 justify-content-center">
          <Col md={10} lg={12}>
            <Card className="p-4 shadow-sm border-0 rounded-4" style={{ backgroundColor: '#fff' }}>
              <Row className="g-3 align-items-center">
                {/* Category Filter */}
                <Col xs={12}>
                  <CategoryFilter 
                    selectedCategory={selectedCategory} 
                    onSelectCategory={setSelectedCategory} 
                  />
                </Col>
                {/* Search and Mentor Toggle */}
                <Col md={8}>
                  <Form.Group controlId="skillSearch">
                    <Form.Label className="visually-hidden">Search Skills</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search skills (e.g., Python, React)..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="rounded-pill shadow-sm border-0"
                      style={{ padding: '0.75rem 1.25rem' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex justify-content-md-end">
                  <Form.Check
                    type="switch"
                    id="mentor-filter"
                    label="Mentors Only"
                    checked={isMentorFilter}
                    onChange={() => setIsMentorFilter(!isMentorFilter)}
                    className="text-muted fw-medium mt-2 mt-md-0"
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        
        {/* Loading State */}
        {loading && (
          <div className="d-flex flex-column justify-content-center align-items-center my-5 py-5">
            <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
            <span className="mt-3 fs-5 text-muted">Loading profiles...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Row className="justify-content-center">
            <Col md={8}>
              <Alert variant="warning" className="shadow-sm rounded-3 text-center">
                <Alert.Heading><i className="bi bi-exclamation-triangle-fill me-2"></i>Oops!</Alert.Heading>
                <p>{error}</p>
              </Alert>
            </Col>
          </Row>
        )}

        {/* Profiles Grid */}
        {!loading && !error && (
          <Row className="justify-content-center g-4">
            {profiles.length === 0 ? (
              <Col md={8} className="text-center mt-4">
                <p className="text-muted fst-italic fs-5">No profiles found matching your criteria.</p>
                <p className="text-muted">Try adjusting the category, search term, or mentor filter.</p>
              </Col>
            ) : (
              profiles.map((profile) => (
                <Col key={profile.id} md={6} lg={4}>
                  <Card
                    className="shadow-lg border-0 rounded-4 h-100"
                    style={{
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      backgroundColor: '#ffffff', // Ensure white background
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.08)';
                    }}
                  >
                    <Card.Body className="p-4 d-flex flex-column">
                      <Card.Title className="text-primary fw-bolder mb-2" style={{ fontSize: '1.4rem' }}>
                        <i className="bi bi-code-slash me-2"></i>{profile.skill}
                      </Card.Title>
                      <Card.Subtitle className="mb-3 text-muted fw-medium d-flex align-items-center">
                        <i className="bi bi-person-circle me-2"></i>{profile.username}
                      </Card.Subtitle>
                      
                      <div className="mb-3 flex-grow-1">
                        {profile.category_details && (
                          <div className="mb-2 d-flex align-items-center">
                            <i className="bi bi-tags-fill me-2 text-secondary"></i>
                            <strong>Category:</strong>&nbsp;
                            <span className="text-dark">{profile.category_details.name}</span>
                          </div>
                        )}
                        <div className="mb-2 d-flex align-items-center">
                           <i className="bi bi-bar-chart-line-fill me-2 text-secondary"></i>
                          <strong>Proficiency:</strong>&nbsp;
                          <span className="text-dark">{profile.proficiency}</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <i className={`bi ${profile.is_mentor ? 'bi-mortarboard-fill' : 'bi-person-workspace'} me-2 text-secondary`}></i>
                          <strong>Role:</strong>&nbsp;
                          <span className={`badge rounded-pill ${profile.is_mentor ? 'bg-success-subtle text-success-emphasis' : 'bg-info-subtle text-info-emphasis'}`}>
                            {profile.is_mentor ? 'Mentor Available' : 'Looking for Mentor'}
                          </span>
                        </div>
                      </div>

                      {profile.is_mentor && (
                        <Button
                          variant="outline-primary"
                          onClick={() => handleRequestMentorship(profile.id)}
                          className="rounded-pill px-4 py-2 shadow-sm w-100 mt-auto align-self-start"
                          style={{ transition: 'all 0.3s ease' }}
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
        )}
      </Container>
    </>
  );
};

export default SkillsLanding;