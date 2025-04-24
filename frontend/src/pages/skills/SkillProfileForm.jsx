import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';

const SkillProfileForm = ({ initialData, onSubmit, onCancel, categories }) => {
  const [formData, setFormData] = useState({
    skill: '',
    category: '',
    proficiency: 'beginner',
    is_mentor: false,
  });
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        skill: initialData.skill || '',
        category: initialData.category?.id || initialData.category_details?.id || initialData.category || '',
        proficiency: initialData.proficiency || 'beginner',
        is_mentor: initialData.is_mentor || false,
      });
    } else {
      setFormData({
        skill: '',
        category: '',
        proficiency: 'beginner',
        is_mentor: false,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (validationError) setValidationError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError(null);

    if (!formData.skill.trim()) {
      setValidationError("Skill name cannot be empty.");
      return;
    }
    if (!formData.category) {
      setValidationError("Please select a category.");
      return;
    }
    
    const dataToSubmit = {
        ...formData,
        category: formData.category
    };

    onSubmit(dataToSubmit);
  };

  return (
    <Form onSubmit={handleSubmit}>
      {validationError && (
        <Alert variant="danger" className="mb-3">
           <i className="bi bi-exclamation-triangle-fill me-2"></i> 
           {validationError}
        </Alert>
      )}

      <Form.Group className="mb-3">
        <Form.Label className="fw-medium">Skill <span className="text-danger">*</span></Form.Label>
        <Form.Control
          type="text"
          name="skill"
          value={formData.skill}
          onChange={handleChange}
          placeholder="e.g., React, Python, Project Management"
          required
          className="shadow-sm"
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label className="fw-medium">Category <span className="text-danger">*</span></Form.Label>
        <Form.Select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="shadow-sm"
        >
          <option value="" disabled>-- Select a Category --</option>
          {(categories || []).map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Form.Select>
        {(!categories || categories.length === 0) && 
           <Form.Text className="text-muted">Loading categories...</Form.Text>
        }
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label className="fw-medium">Proficiency</Form.Label>
        <Form.Select
          name="proficiency"
          value={formData.proficiency}
          onChange={handleChange}
          className="shadow-sm"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Check
          type="switch"
          id="mentor-switch-modal"
          name="is_mentor"
          checked={formData.is_mentor}
          onChange={handleChange}
          label="Available as Mentor for this skill"
          className="fw-medium"
        />
      </Form.Group>

      <div className="d-flex justify-content-end gap-2">
        <Button variant="outline-secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
           {initialData?.id ? 'Save Changes' : 'Add Skill'} 
        </Button>
      </div>
    </Form>
  );
};

export default SkillProfileForm;