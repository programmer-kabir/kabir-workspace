import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import ReviewerLayout from './layouts/ReviewerLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TeamList from './pages/TeamList';
import StaffReview from './pages/StaffReview';
import Leaderboard from './pages/Leaderboard';
import PendingReviews from './pages/PendingReviews';
import CompletedReviews from './pages/CompletedReviews';
import RejectedReviews from './pages/RejectedReviews';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Credits from './pages/Credits';
import BrandResources from './pages/BrandResources';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <ReviewerLayout><Dashboard /></ReviewerLayout>
            </ProtectedRoute>
          } />

          <Route path="/brand-resources" element={
            <ProtectedRoute>
              <ReviewerLayout><BrandResources /></ReviewerLayout>
            </ProtectedRoute>
          } />

          <Route path="/pending" element={
            <ProtectedRoute>
              <ReviewerLayout><PendingReviews /></ReviewerLayout>
            </ProtectedRoute>
          } />

          <Route path="/completed" element={
            <ProtectedRoute>
              <ReviewerLayout><CompletedReviews /></ReviewerLayout>
            </ProtectedRoute>
          } />

          <Route path="/rejected" element={
            <ProtectedRoute>
              <ReviewerLayout><RejectedReviews /></ReviewerLayout>
            </ProtectedRoute>
          } />

          <Route path="/team" element={
            <ProtectedRoute>
              <ReviewerLayout><TeamList /></ReviewerLayout>
            </ProtectedRoute>
          } />

          <Route path="/review/:id" element={
            <ProtectedRoute>
              <ReviewerLayout><StaffReview /></ReviewerLayout>
            </ProtectedRoute>
          } />

          <Route path="/leaderboard" element={
            <ProtectedRoute>
              <ReviewerLayout><Leaderboard /></ReviewerLayout>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <ReviewerLayout><Profile /></ReviewerLayout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <ReviewerLayout><Settings /></ReviewerLayout>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute>
              <ReviewerLayout><Reports /></ReviewerLayout>
            </ProtectedRoute>
          } />

          <Route path="/credits" element={
            <ProtectedRoute>
              <ReviewerLayout><Credits /></ReviewerLayout>
            </ProtectedRoute>
          } />

          {/* 404 Catch-All Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
