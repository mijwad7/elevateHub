import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  deleteUser,
  editUser,
  createUser,
} from "../../redux/adminSlice";
import AdminNavbar from "../../components/AdminNavbar";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { users, loading } = useSelector((state) => state.admin);
  const [query, setQuery] = useState("");

  const [editingUser, setEditingUser] = useState(null);
  const [updatedUsername, setUpdatedUsername] = useState("");
  const [updatedEmail, setUpdatedEmail] = useState("");

  // State for creating a new user
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "" });

  useEffect(() => {
    dispatch(fetchUsers(query));
  }, [dispatch, query]);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure?")) {
      dispatch(deleteUser(id));
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setUpdatedUsername(user.username);
    setUpdatedEmail(user.email);
  };

  const handleSave = () => {
    if (!editingUser) return;

    const userData = { username: updatedUsername, email: updatedEmail };
    dispatch(editUser({ userId: editingUser.id, userData }));
    setEditingUser(null);
  };

  // Handle create user
  const handleCreateUser = () => {
    dispatch(createUser(newUser)); // Dispatch create user action
    setShowCreateModal(false);
    setNewUser({ username: "", password: "" });
  };

  return (
    <>
      <AdminNavbar />
      <div className="container mt-5">
        <h1 className="text-center mb-4">Admin Dashboard</h1>

        {/* Search and Create User Button */}
        <div className="d-flex justify-content-between mb-3">
          <input
            type="text"
            className="form-control w-50"
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="btn btn-success"
            onClick={() => setShowCreateModal(true)}
          >
            + Create User
          </button>
        </div>

        {/* Users Table */}
        {loading ? (
          <p className="text-center text-muted">Loading...</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover text-center">
              <thead className="thead-dark">
                <tr>
                  <th>Username</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => handleEdit(user)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(user.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="modal fade show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content p-4">
                <h2 className="text-center">Edit User</h2>
                <div className="form-group mt-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Username"
                    value={updatedUsername}
                    onChange={(e) => setUpdatedUsername(e.target.value)}
                  />
                  <input
                    type="email"
                    className="form-control mt-2"
                    placeholder="Email"
                    value={updatedEmail}
                    onChange={(e) => setUpdatedEmail(e.target.value)}
                  />
                </div>
                <div className="text-center mt-4">
                  <button className="btn btn-primary me-2" onClick={handleSave}>
                    Save
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setEditingUser(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="modal fade show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content p-4">
                <h2 className="text-center">Create User</h2>
                <div className="form-group mt-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Username"
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser({ ...newUser, username: e.target.value })
                    }
                  />
                </div>
                <div className="form-group mt-3">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                  />
                </div>
                <div className="text-center mt-4">
                  <button
                    className="btn btn-success me-2"
                    onClick={handleCreateUser}
                  >
                    Create
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminDashboard;
