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

  const handleDelete = (discussionId) => {
    dispatch(deleteDiscussion(discussionId));
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
                      onClick={() => handleDelete(discussion.id)}
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
    </>
  );
}

export default AdminDiscussions;
