import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMentorships,
  createMentorship,
  editMentorship,
  deleteMentorship,
} from "../../redux/mentorshipSlice";
import { fetchSkillProfiles } from "../../redux/skillProfileSlice";
import { fetchUsers } from "../../redux/adminSlice";
import AdminNavbar from "../../components/AdminNavbar";
import { Spinner, Container, Row, Col, Form, Button, Table, Card, Modal } from "react-bootstrap";

function AdminMentorships() {
  const dispatch = useDispatch();
  const { mentorships, loading } = useSelector((state) => state.mentorships);
  const { users } = useSelector((state) => state.admin);
  const { skillProfiles } = useSelector((state) => state.skillProfiles);
  const [newMentorshipData, setNewMentorshipData] = useState({
    mentor_id: "", // Changed to mentor_id
    learner_id: "", // Changed to learner_id
    skill_id: "", // Changed to skill_id
    topic: "",
    status: "pending",
  });
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    dispatch(fetchMentorships());
    dispatch(fetchUsers());
    dispatch(fetchSkillProfiles());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMentorshipData({ ...newMentorshipData, [name]: value });
  };

  const handleCreate = () => {
    if (
      newMentorshipData.mentor_id &&
      newMentorshipData.learner_id &&
      newMentorshipData.skill_id &&
      newMentorshipData.topic &&
      newMentorshipData.status
    ) {
      dispatch(createMentorship(newMentorshipData));
      setNewMentorshipData({
        mentor_id: "",
        learner_id: "",
        skill_id: "",
        topic: "",
        status: "pending",
      });
      setShowModal(false);
    }
  };

  const handleEdit = () => {
    if (editData) {
      dispatch(
        editMentorship({
          mentorshipId: editData.id,
          mentorshipData: newMentorshipData,
        })
      );
      setEditData(null);
      setNewMentorshipData({
        mentor_id: "",
        learner_id: "",
        skill_id: "",
        topic: "",
        status: "pending",
      });
      setShowModal(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      dispatch(deleteMentorship(deleteId));
      setDeleteId(null);
    }
  };

  const openCreateModal = () => {
    setEditData(null);
    setNewMentorshipData({
      mentor_id: "",
      learner_id: "",
      skill_id: "",
      topic: "",
      status: "pending",
    });
    setShowModal(true);
  };

  const openEditModal = (mentorship) => {
    setEditData(mentorship);
    setNewMentorshipData({
      mentor_id: mentorship.mentor.id,
      learner_id: mentorship.mentee.id, // Maps to learner_id
      skill_id: mentorship.skill_profile.id,
      topic: mentorship.topic,
      status: mentorship.status,
    });
    setShowModal(true);
  };

  return (
    <>
      <AdminNavbar />
      <Container className="py-5" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
        <h2 className="mb-5 text-center fw-bold text-dark" style={{ letterSpacing: "1px", fontSize: "2.5rem" }}>
          Mentorship Management
        </h2>

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
              <i className="bi bi-plus-circle me-2"></i>Create Mentorship
            </Button>
          </Col>
        </Row>

        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          centered
          backdrop="static"
          keyboard={false}
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>{editData ? "Edit Mentorship" : "Create Mentorship"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-4">
                <Form.Label className="fw-medium text-dark">Mentor</Form.Label>
                <Form.Select
                  name="mentor_id" // Changed to mentor_id
                  value={newMentorshipData.mentor_id}
                  onChange={handleInputChange}
                  className="border-0 rounded-3 shadow-sm"
                  style={{ padding: "0.75rem 1.25rem" }}
                >
                  <option value="">Select a mentor</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="fw-medium text-dark">Learner</Form.Label>
                <Form.Select
                  name="learner_id" // Changed to learner_id
                  value={newMentorshipData.learner_id}
                  onChange={handleInputChange}
                  className="border-0 rounded-3 shadow-sm"
                  style={{ padding: "0.75rem 1.25rem" }}
                >
                  <option value="">Select a learner</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="fw-medium text-dark">Skill Profile</Form.Label>
                <Form.Select
                  name="skill_id" // Changed to skill_id
                  value={newMentorshipData.skill_id}
                  onChange={handleInputChange}
                  className="border-0 rounded-3 shadow-sm"
                  style={{ padding: "0.75rem 1.25rem" }}
                >
                  <option value="">Select a skill profile</option>
                  {skillProfiles.map((skillProfile) => (
                    <option key={skillProfile.id} value={skillProfile.id}>
                      {skillProfile.skill}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="fw-medium text-dark">Topic</Form.Label>
                <Form.Control
                  type="text"
                  name="topic"
                  value={newMentorshipData.topic}
                  onChange={handleInputChange}
                  placeholder="Enter topic"
                  className="border-0 rounded-3 shadow-sm"
                  style={{ padding: "0.75rem 1.25rem" }}
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="fw-medium text-dark">Status</Form.Label>
                <Form.Select
                  name="status"
                  value={newMentorshipData.status}
                  onChange={handleInputChange}
                  className="border-0 rounded-3 shadow-sm"
                  style={{ padding: "0.75rem 1.25rem" }}
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </Form.Select>
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
            <span className="ms-3 fs-5 text-muted">Loading mentorships...</span>
          </div>
        ) : (
          <Table striped bordered hover className="shadow-sm rounded-3">
            <thead className="bg-primary text-white">
              <tr>
                <th>ID</th>
                <th>Mentor</th>
                <th>Learner</th>
                <th>Skill</th>
                <th>Topic</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mentorships.map((mentorship) => (
                <tr key={mentorship.id}>
                  <td>{mentorship.id}</td>
                  <td>{mentorship.mentor.username}</td>
                  <td>{mentorship.mentee.username}</td>
                  <td>{mentorship.skill_profile.skill}</td>
                  <td>{mentorship.topic}</td>
                  <td>
                    <span
                      className={`badge rounded-pill ${
                        mentorship.status === "active"
                          ? "bg-success"
                          : mentorship.status === "completed"
                          ? "bg-info text-dark"
                          : mentorship.status === "rejected"
                          ? "bg-danger"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {mentorship.status.charAt(0).toUpperCase() + mentorship.status.slice(1)}
                    </span>
                  </td>
                  <td>{new Date(mentorship.created_at).toLocaleDateString()}</td>
                  <td>
                    <Button
                      variant="info"
                      size="sm"
                      className="me-2 rounded-pill px-3"
                      onClick={() => openEditModal(mentorship)}
                    >
                      <i className="bi bi-pencil me-1"></i>Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="rounded-pill px-3"
                      data-bs-toggle="modal"
                      data-bs-target="#deleteMentorshipModal"
                      onClick={() => setDeleteId(mentorship.id)}
                    >
                      <i className="bi bi-trash me-1"></i>Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <div
          className="modal fade"
          id="deleteMentorshipModal"
          tabIndex="-1"
          aria-labelledby="deleteMentorshipModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content rounded-3 shadow-lg">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title" id="deleteMentorshipModalLabel">
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
                Are you sure you want to delete this mentorship? This action cannot be undone.
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

export default AdminMentorships;