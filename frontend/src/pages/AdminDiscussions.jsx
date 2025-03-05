import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDiscussions,
  createDiscussion,
  editDiscussion,
  deleteDiscussion,
} from "../redux/discussionSlice";
import AdminNavbar from "../components/AdminNavbar";

function AdminDiscussions() {
  const dispatch = useDispatch();
  const { discussions, loading } = useSelector((state) => state.discussions);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null); // Stores ID of discussion to delete

  useEffect(() => {
    dispatch(fetchDiscussions());
  }, [dispatch]);

  const handleCreate = () => {
    if (newTitle.trim() && newDescription.trim()) {
      dispatch(
        createDiscussion({ title: newTitle, description: newDescription })
      );
      setNewTitle("");
      setNewDescription("");
    }
  };

  const handleEdit = () => {
    if (editData) {
      dispatch(
        editDiscussion({
          discussionId: editData.id,
          discussionData: { title: newTitle, description: newDescription },
        })
      );
      setEditData(null);
      setNewTitle("");
      setNewDescription("");
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      dispatch(deleteDiscussion(deleteId));
      setDeleteId(null);
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="container mt-5">
        <h2>Discussion Management</h2>
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Discussion Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <textarea
            className="form-control mt-2"
            placeholder="Discussion Description"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows="3"
          ></textarea>
          {editData ? (
            <button className="btn btn-warning mt-2" onClick={handleEdit}>
              Update Discussion
            </button>
          ) : (
            <button className="btn btn-primary mt-2" onClick={handleCreate}>
              Create Discussion
            </button>
          )}
        </div>

        {loading ? (
          <p>Loading discussions...</p>
        ) : (
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {discussions.map((discussion) => (
                <tr key={discussion.id}>
                  <td>{discussion.title}</td>
                  <td>{discussion.description}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => {
                        setEditData(discussion);
                        setNewTitle(discussion.title);
                        setNewDescription(discussion.description);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger ms-2"
                      data-bs-toggle="modal"
                      data-bs-target="#deleteModal"
                      onClick={() => setDeleteId(discussion.id)}
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

      {/* Delete Confirmation Modal */}
      <div
        className="modal fade"
        id="deleteModal"
        tabIndex="-1"
        aria-labelledby="deleteModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="deleteModalLabel">
                Confirm Deletion
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              Are you sure you want to delete this discussion? This action cannot be undone.
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                data-bs-dismiss="modal"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminDiscussions;
