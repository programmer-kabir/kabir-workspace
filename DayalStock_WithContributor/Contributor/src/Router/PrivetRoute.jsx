import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../utlis/Hooks/useAuth';

const PrivateRoute = ({ children }) => {
    const { user, userRoles, loading } = useAuth();
    const location = useLocation();

    // Auth is still loading — show spinner
    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0F0F1A' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #6C4FE0', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // Not logged in → go to login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Logged in but not an author → redirect to main site
    if (!userRoles.includes('author')) {
        window.location.replace('https://dayalstock.com');
        return null;
    }

    // All good — render the protected page
    return children;
};

export default PrivateRoute;