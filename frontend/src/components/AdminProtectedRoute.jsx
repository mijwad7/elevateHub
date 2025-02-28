import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const AdminProtectedRoute = ({ children }) => {
    const { user } = useSelector((state) => state.auth);
    
    return user && user.is_staff ? children : <Navigate to="/not-authorized" />;
};

export default AdminProtectedRoute;
