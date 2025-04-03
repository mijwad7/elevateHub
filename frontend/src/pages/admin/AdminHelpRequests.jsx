import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchHelpRequests,
  createHelpRequest,
  editHelpRequest,
  deleteHelpRequest,
} from "../../redux/helpRequestSlice";
import AdminNavbar from "../../components/AdminNavbar";

function AdminHelpRequests() {
  const dispatch = useDispatch();
  const { helpRequests, loading } = useSelector((state) => state.helpRequests);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCreditOfferChat, setNewCreditOfferChat] = useState(0);
  const [newCreditOfferVideo, setNewCreditOfferVideo] = useState(0);
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    dispatch(fetchHelpRequests());
  }, [dispatch]);

  const handleCreate = () => {
    if (newTitle.trim() && newDescription.trim()) {
      dispatch(
        createHelpRequest({
          title: newTitle,
          description: newDescription,
          credit_offer_chat: newCreditOfferChat,
          credit_offer_video: newCreditOfferVideo,
        })
      );
      resetForm();
    }
  };

  const handleEdit = () => {
    if (editData) {
      dispatch(
        editHelpRequest({
          helpRequestId: editData.id,
          helpRequestData: {
            title: newTitle,
            description: newDescription,
            credit_offer_chat: newCreditOfferChat,
            credit_offer_video: newCreditOfferVideo,
          },
        })
      );
      resetForm();
      setEditData(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      dispatch(deleteHelpRequest(deleteId));
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewCreditOfferChat(0);
    setNewCreditOfferVideo(0);
  };

  return (
    <>
      <AdminNavbar />
      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">Help Request Management</h2>
          <button
            className="btn btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#createModal"
            onClick={resetForm}
          >
            <i className="bi bi-plus me-2"></i> Create Help Request
          </button>
        </div>

        {editData && (
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Help Request Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <textarea
              className="form-control mt-2"
              placeholder="Help Request Description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows="3"
            ></textarea>
            <input
              type="number"
              className="form-control mt-2"
              placeholder="Credit Offer for Chat"
              value={newCreditOfferChat}
              onChange={(e) =>
                setNewCreditOfferChat(parseInt(e.target.value) || 0)
              }
            />
            <input
              type="number"
              className="form-control mt-2"
              placeholder="Credit Offer for Video"
              value={newCreditOfferVideo}
              onChange={(e) =>
                setNewCreditOfferVideo(parseInt(e.target.value) || 0)
              }
            />
            <button className="btn btn-warning mt-2" onClick={handleEdit}>
              Update Help Request
            </button>
            <button
              className="btn btn-secondary mt-2 ms-2"
              onClick={() => {
                resetForm();
                setEditData(null);
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {loading ? (
          <p>Loading help requests...</p>
        ) : (
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Chat Credits</th>
                <th>Video Credits</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {helpRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.title}</td>
                  <td>{request.description}</td>
                  <td>{request.credit_offer_chat}</td>
                  <td>{request.credit_offer_video}</td>
                  <td>
                    <span
                      className={`badge ${
                        request.status === "open"
                          ? "bg-success"
                          : "bg-secondary"
                      }`}
                    >
                      {request.status.charAt(0).toUpperCase() +
                        request.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => {
                        setEditData(request);
                        setNewTitle(request.title);
                        setNewDescription(request.description);
                        setNewCreditOfferChat(request.credit_offer_chat);
                        setNewCreditOfferVideo(request.credit_offer_video);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger ms-2"
                      data-bs-toggle="modal"
                      data-bs-target="#deleteModal"
                      onClick={() => setDeleteId(request.id)}
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

      {/* Create Help Request Modal */}
      <div
        className="modal fade"
        id="createModal"
        tabIndex="-1"
        aria-labelledby="createModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="createModalLabel">
                Create New Help Request
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={resetForm}
              ></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows="3"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Credit Offer for Chat</label>
                <input
                  type="number"
                  className="form-control"
                  value={newCreditOfferChat}
                  onChange={(e) =>
                    setNewCreditOfferChat(parseInt(e.target.value) || 0)
                  }
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Credit Offer for Video</label>
                <input
                  type="number"
                  className="form-control"
                  value={newCreditOfferVideo}
                  onChange={(e) =>
                    setNewCreditOfferVideo(parseInt(e.target.value) || 0)
                  }
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={resetForm}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                data-bs-dismiss="modal"
                onClick={handleCreate}
              >
                Create
              </button>
            </div>
          </div>
        </div>
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
              Are you sure you want to delete this help request? This action
              cannot be undone.
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

export default AdminHelpRequests;
