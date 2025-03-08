import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchResources,
  createResource,
  editResource,
  deleteResource,
} from "../../redux/resourceSlice";
import AdminNavbar from "../../components/AdminNavbar";
import { getCategories } from "../../apiRequests";

function AdminResources() {
  const dispatch = useDispatch();
  const { resources, loading } = useSelector((state) => state.resources);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    file: null,
  });
  const [categories, setCategories] = useState([]);
  const [editId, setEditId] = useState(null);  // ID of resource being edited
  const [deleteId, setDeleteId] = useState(null);  // ID of resource to delete

  useEffect(() => {
    dispatch(fetchResources());
    getCategories().then(setCategories);
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setFormData({ ...formData, file: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (isEdit = false) => {
    if (!formData.title || !formData.description || !formData.category || (!formData.file && !isEdit)) {
      alert("All fields are required.");
      return;
    }

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("category", formData.category);
    if (formData.file) data.append("file", formData.file);

    if (isEdit && editId) {
      dispatch(editResource({ resourceId: editId, resourceData: data }));
      setEditId(null);
    } else {
      dispatch(createResource(data));
    }
    setFormData({ title: "", description: "", category: "", file: null });
  };

  const handleEdit = (resource) => {
    setEditId(resource.id);
    setFormData({
      title: resource.title,
      description: resource.description,
      category: resource.category.id,
      file: null,
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      dispatch(deleteResource(deleteId));
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", category: "", file: null });
    setEditId(null);
  };

  return (
    <>
      <AdminNavbar />
      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">Resource Management</h2>
          <button
            className="btn btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#createModal"
            onClick={resetForm}  // Reset form for create
          >
            <i className="bi bi-plus me-2"></i> Create Resource
          </button>
        </div>

        {loading ? (
          <p>Loading resources...</p>
        ) : (
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Category</th>
                <th>Uploaded By</th>
                <th>File</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id}>
                  <td>{resource.title}</td>
                  <td>{resource.description}</td>
                  <td>{resource.category_detail.name}</td>
                  <td>@{resource.uploaded_by_username}</td>
                  <td>
                    <a href={resource.file} target="_blank" rel="noopener noreferrer">
                      View
                    </a>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-info me-2"
                      data-bs-toggle="modal"
                      data-bs-target="#editModal"
                      onClick={() => handleEdit(resource)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      data-bs-toggle="modal"
                      data-bs-target="#deleteModal"
                      onClick={() => setDeleteId(resource.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Resource Modal */}
      <div className="modal fade" id="createModal" tabIndex="-1" aria-labelledby="createModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="createModalLabel">Create New Resource</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={resetForm}></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  name="title"
                  className="form-control"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  className="form-control"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Category</label>
                <select
                  name="category"
                  className="form-select"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">File</label>
                <input
                  type="file"
                  name="file"
                  className="form-control"
                  onChange={handleChange}
                  accept="image/*,video/mp4,.pdf,.docx,.txt,.mp3"
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={resetForm}>
                Close
              </button>
              <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={() => handleSubmit(false)}>
                Create
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Resource Modal */}
      <div className="modal fade" id="editModal" tabIndex="-1" aria-labelledby="editModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="editModalLabel">Edit Resource</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={resetForm}></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  name="title"
                  className="form-control"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  className="form-control"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Category</label>
                <select
                  name="category"
                  className="form-select"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">File (optional)</label>
                <input
                  type="file"
                  name="file"
                  className="form-control"
                  onChange={handleChange}
                  accept="image/*,video/mp4,.pdf,.docx,.txt,.mp3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={resetForm}>
                Close
              </button>
              <button type="button" className="btn btn-warning" data-bs-dismiss="modal" onClick={() => handleSubmit(true)}>
                Update
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className="modal fade" id="deleteModal" tabIndex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="deleteModalLabel">Confirm Deletion</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              Are you sure you want to delete this resource? This action cannot be undone.
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" className="btn btn-danger" data-bs-dismiss="modal" onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminResources;