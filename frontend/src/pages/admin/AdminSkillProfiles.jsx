import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSkillProfiles,
  createSkillProfile,
  editSkillProfile,
  deleteSkillProfile,
} from "../../redux/skillProfileSlice";
import { fetchUsers } from "../../redux/adminSlice"; // Import fetchUsers
import { getCategories } from "../../apiRequests";
import AdminNavbar from "../../components/AdminNavbar";
import { Spinner, Container, Row, Col, Form, Button, Table, Card, Modal } from "react-bootstrap";

function AdminSkillProfiles() {
  const dispatch = useDispatch();
  const { skillProfiles, loading } = useSelector((state) => state.skillProfiles);
  const { users } = useSelector((state) => state.admin); // Get users from admin slice
  const [categories, setCategories] = useState([]); // State for categories
  const [newSkillProfileData, setNewSkillProfileData] = useState({
    user: "",
    skill: "",
    category: "",
    proficiency: "beginner",
    is_mentor: false,
  });
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showModal, setShowModal] = useState(false); // State for modal visibility

  // Fetch users and categories on component mount
  useEffect(() => {
    dispatch(fetchSkillProfiles());
    dispatch(fetchUsers()); // Fetch users
    // Fetch categories
    getCategories().then((data) => {
      if (data) {
        setCategories(data);
      }
    });
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewSkillProfileData({
      ...newSkillProfileData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleCreate = () => {
    if (
      newSkillProfileData.user &&
      newSkillProfileData.skill &&
      newSkillProfileData.category &&
      newSkillProfileData.proficiency
    ) {
      dispatch(createSkillProfile(newSkillProfileData));
      setNewSkillProfileData({
        user: "",
        skill: "",
        category: "",
        proficiency: "beginner",
        is_mentor: false,
      });
      setShowModal(false); // Close the modal
    }
  };

  const handleEdit = () => {
    if (editData) {
      dispatch(
        editSkillProfile({
          skillProfileId: editData.id,
          skillProfileData: newSkillProfileData,
        })
      );
      setEditData(null);
      setNewSkillProfileData({
        user: "",
        skill: "",
        category: "",
        proficiency: "beginner",
        is_mentor: false,
      });
      setShowModal(false); // Close the modal
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      dispatch(deleteSkillProfile(deleteId));
      setDeleteId(null);
    }
  };

  const openCreateModal = () => {
    setEditData(null);
    setNewSkillProfileData({
      user: "",
      skill: "",
      category: "",
      proficiency: "beginner",
      is_mentor: false,
    });
    setShowModal(true);
  };

  const openEditModal = (skillProfile) => {
    setEditData(skillProfile);
    setNewSkillProfileData({
      user: skillProfile.user,
      skill: skillProfile.skill,
      category: skillProfile.category_details.id,
      proficiency: skillProfile.proficiency,
      is_mentor: skillProfile.is_mentor,
    });
    setShowModal(true);
  };

  return (
    <>
      <AdminNavbar />
      <Container className="py-5" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
        <h2 className="mb-5 text-center fw-bold text-dark" style={{ letterSpacing: "1px", fontSize: "2.5rem" }}>
          Skill Profile Management
        </h2>

        {/* Button to open the create modal */}
        <Row className="mb-4">
          <Col className="text-end">
            <Button
              variant="primary"
              className="rounded-pill px-4 py-2 shadow-sm"
              onClick={openCreateModal}
              style={{
                transition: "all 0.3s ease",
                backgroundImage: "linear-gradient(135deg, #007bff, #0056b3)",
              }}
            >
              <i className="bi bi-plus-circle me-2"></i>Create Skill Profile
            </Button>
          </Col>
        </Row>

        {/* Create/Edit Modal */}
        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          centered
          backdrop="static"
          keyboard={false}
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>{editData ? "Edit Skill Profile" : "Create Skill Profile"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-4">
                <Form.Label className="fw-medium text-dark">User</Form.Label>
                <Form.Select
                  name="user"
                  value={newSkillProfileData.user}
                  onChange={handleInputChange}
                  className="border-0 rounded-3 shadow-sm"
                  style={{ padding: "0.75rem 1.25rem" }}
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="fw-medium text-dark">Skill</Form.Label>
                <Form.Control
                  type="text"
                  name="skill"
                  value={newSkillProfileData.skill}
                  onChange={handleInputChange}
                  placeholder="Enter skill"
                  className="border-0 rounded-3 shadow-sm"
                  style={{ padding: "0.75rem 1.25rem" }}
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="fw-medium text-dark">Category</Form.Label>
                <Form.Select
                  name="category"
                  value={newSkillProfileData.category}
                  onChange={handleInputChange}
                  className="border-0 rounded-3 shadow-sm"
                  style={{ padding: "0.75rem 1.25rem" }}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="fw-medium text-dark">Proficiency</Form.Label>
                <Form.Select
                  name="proficiency"
                  value={newSkillProfileData.proficiency}
                  onChange={handleInputChange}
                  className="border-0 rounded-3 shadow-sm"
                  style={{ padding: "0.75rem 1.25rem" }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Check
                  type="switch"
                  id="is-mentor-switch"
                  name="is_mentor"
                  checked={newSkillProfileData.is_mentor}
                  onChange={handleInputChange}
                  label="Available as Mentor"
                  className="text-muted fw-medium"
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              className="rounded-pill px-3"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant={editData ? "warning" : "primary"}
              className="rounded-pill px-3"
              onClick={editData ? handleEdit : handleCreate}
              style={{
                transition: "all 0.3s ease",
                backgroundImage: editData
                  ? "linear-gradient(135deg, #ffc107, #e0a800)"
                  : "linear-gradient(135deg, #007bff, #0056b3)",
              }}
            >
              {editData ? (
                <>
                  <i className="bi bi-pencil-square me-2"></i>Update
                </>
              ) : (
                <>
                  <i className="bi bi-plus-circle me-2"></i>Create
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {loading ? (
          <div className="d-flex justify-content-center align-items-center my-5">
            <Spinner animation="border" variant="primary" style={{ width: "2.5rem", height: "2.5rem" }} />
            <span className="ms-3 fs-5 text-muted">Loading skill profiles...</span>
          </div>
        ) : (
          <Table striped bordered hover className="shadow-sm rounded-3">
            <thead className="bg-primary text-white">
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Skill</th>
                <th>Category</th>
                <th>Proficiency</th>
                <th>Mentor</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {skillProfiles.map((skillProfile) => (
                <tr key={skillProfile.id}>
                  <td>{skillProfile.id}</td>
                  <td>{skillProfile.username}</td>
                  <td>{skillProfile.skill}</td>
                  <td>{skillProfile.category_details.name}</td>
                  <td>{skillProfile.proficiency.charAt(0).toUpperCase() + skillProfile.proficiency.slice(1)}</td>
                  <td>
                    <span
                      className={`badge rounded-pill ${skillProfile.is_mentor ? "bg-success" : "bg-secondary"}`}
                    >
                      {skillProfile.is_mentor ? "Yes" : "No"}
                    </span>
                  </td>
                  <td>{new Date(skillProfile.created_at).toLocaleDateString()}</td>
                  <td>
                    <Button
                      variant="info"
                      size="sm"
                      className="me-2 rounded-pill px-3"
                      onClick={() => openEditModal(skillProfile)}
                    >
                      <i className="bi bi-pencil me-1"></i>Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="rounded-pill px-3"
                      data-bs-toggle="modal"
                      data-bs-target="#deleteSkillProfileModal"
                      onClick={() => setDeleteId(skillProfile.id)}
                    >
                      <i className="bi bi-trash me-1"></i>Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {/* Delete Confirmation Modal */}
        <div
          className="modal fade"
          id="deleteSkillProfileModal"
          tabIndex="-1"
          aria-labelledby="deleteSkillProfileModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content rounded-3 shadow-lg">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title" id="deleteSkillProfileModalLabel">
                  Confirm Deletion
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                Are you sure you want to delete this skill profile? This action cannot be undone.
              </div>
              <div className="modal-footer">
                <Button variant="secondary" className="rounded-pill px-3" data-bs-dismiss="modal">
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="rounded-pill px-3"
                  data-bs-dismiss="modal"
                  onClick={handleDeleteConfirm}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}

export default AdminSkillProfiles;