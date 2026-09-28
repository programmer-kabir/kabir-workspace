import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../utils/Hooks/useAuth';
import DayalLoader from '../components/Common/DayalLoader';

const PrivateRoute = ({ children }) => {
    const { user, userRoles, loading } = useAuth();
    const location = useLocation();

    // Auth is still loading — show DayalLoader
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0A0A12]">
                <DayalLoader text="Verifying administrator session..." />
            </div>
        ); 
    }

    // Not logged in or not admin → redirect to login
    const hasAdminRole = (Array.isArray(userRoles) && userRoles.includes('admin')) || 
                         (Array.isArray(user?.roles) && user.roles.includes('admin'));

    if (user && hasAdminRole) {
        return children;
    }

    return <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;