import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logOut } from "../redux/authSlice"; // Adjust the import path if needed

function AdminNavbar() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(logOut()); // Dispatch logout action
        navigate("/login"); // Redirect to home/login
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container-fluid">
                {/* Brand */}
                <Link className="navbar-brand" to="/admin">
                    <i className="fas fa-cogs me-2"></i> Admin Panel
                </Link>

                {/* Toggler for mobile view */}
                <button 
                    className="navbar-toggler" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#adminNavbar"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* Navbar Links */}
                <div className="collapse navbar-collapse" id="adminNavbar">
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <Link className="nav-link" to="/admin">
                                <i className="fas fa-tachometer-alt me-2"></i> Dashboard
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/admin/discussions">
                                <i className="fas fa-comments me-2"></i> Discussions
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/admin/resources">
                                <i className="fas fa-file me-2"></i> Resources
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/admin/help-requests">
                                <i className="fas fa-file me-2"></i> Help Requests
                            </Link>
                        </li>
                    </ul>

                    {/* Logout Button */}
                    <button className="btn btn-danger" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt me-2"></i> Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default AdminNavbar;
