import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../utlis/Hooks/useAuth';
import DayalLoader from '../components/Common/DayalLoader';

const PrivateRoute = ({ children }) => {
    const { user, userRoles, loading } = useAuth();
    const location = useLocation();

    // Auth is still loading — show DayalLoader
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#FAFAFA] dark:bg-[#030303] transition-colors">
                <DayalLoader text="Verifying contributor session..." />
            </div>
        );
    }

    // Not logged in → go to login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Logged in but not an author → redirect to main site
    const hasAuthorRole = (Array.isArray(userRoles) && userRoles.includes('author')) || 
                          (Array.isArray(user?.roles) && user.roles.includes('author'));

    if (!hasAuthorRole) {
        window.location.replace(import.meta.env.DEV ? 'http://localhost:5173' : 'https://dayalstock.com');
        return null;
    }

    // All good — render the protected page
    return children;
};

export default PrivateRoute;