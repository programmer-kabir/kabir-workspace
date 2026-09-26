import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SearchProvider } from './context/SearchContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AuthenticatedLayout from './layouts/AuthenticatedLayout';

// Lazy load pages for performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Login = React.lazy(() => import('./pages/Login'));
const Tasks = React.lazy(() => import('./pages/Tasks'));
const Attendance = React.lazy(() => import('./pages/Attendance'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Leave = React.lazy(() => import('./pages/Leave'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Settings = React.lazy(() => import('./pages/Settings'));
const BrandKit = React.lazy(() => import('./pages/BrandKit'));
const Credits = React.lazy(() => import('./pages/Credits'));
const Breaks = React.lazy(() => import('./pages/Breaks'));
const BlogFeed = React.lazy(() => import('./pages/BlogFeed'));
const BlogDetails = React.lazy(() => import('./pages/BlogDetails'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <SearchProvider>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-500 font-bold">Loading...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Routes - Only for Staff */}
            <Route path="/" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Dashboard />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/messages" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Messages />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/tasks" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Tasks />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/attendance" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Attendance />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/breaks" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Breaks />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/feed" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <BlogFeed />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/feed/:id" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <BlogDetails />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Reports />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/leave" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Leave />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Profile />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Settings />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/brand-kit" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <BrandKit />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/credits" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Credits />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            {/* 404 Catch-All Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </SearchProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
