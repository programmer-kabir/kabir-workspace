import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CourseProvider } from './context/CourseContext';
import ProtectedRoute from './routes/ProtectedRoute';
import StudentLayout from './layouts/StudentLayout';

// Lazy loading pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Login = React.lazy(() => import('./pages/Login'));
const Attendance = React.lazy(() => import('./pages/Attendance'));
const Assignments = React.lazy(() => import('./pages/Assignments'));
const Resources = React.lazy(() => import('./pages/Resources'));
const Profile = React.lazy(() => import('./pages/Profile'));
const BrowseCourses = React.lazy(() => import('./pages/BrowseCourses'));
const CoursePlayer = React.lazy(() => import('./pages/CoursePlayer'));
const FoundationsLab = React.lazy(() => import('./pages/FoundationsLab'));
const TypingLab = React.lazy(() => import('./pages/TypingLab'));
const PenToolLab = React.lazy(() => import('./pages/PenToolLab'));
const SkillReport = React.lazy(() => import('./pages/SkillReport'));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'));
const LumiOdyssey = React.lazy(() => import('./pages/LumiOdyssey'));
const DailyWorkLog = React.lazy(() => import('./pages/DailyWorkLog'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <AuthProvider>
      <CourseProvider>
        <Router>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-500 font-bold">Loading Student Portal...</div>}>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Dedicated Video Classroom Player Routes with Clean SEO Slugs */}
              <Route path="/courses/:courseSlug/learn/:lessonSlug" element={
                <ProtectedRoute>
                  <CoursePlayer />
                </ProtectedRoute>
              } />
              <Route path="/courses/:courseSlug/learn" element={
                <ProtectedRoute>
                  <CoursePlayer />
                </ProtectedRoute>
              } />
              <Route path="/courses/:courseSlug/:lessonSlug" element={
                <ProtectedRoute>
                  <CoursePlayer />
                </ProtectedRoute>
              } />
              <Route path="/learn/:courseSlug/:lessonSlug" element={
                <ProtectedRoute>
                  <CoursePlayer />
                </ProtectedRoute>
              } />
              <Route path="/learn/:courseSlug" element={
                <ProtectedRoute>
                  <CoursePlayer />
                </ProtectedRoute>
              } />
              <Route path="/learn" element={
                <ProtectedRoute>
                  <CoursePlayer />
                </ProtectedRoute>
              } />

              {/* Protected Routes - Only for Students */}
              <Route path="/" element={
                <ProtectedRoute>
                  <StudentLayout>
                    <Dashboard />
                  </StudentLayout>
                </ProtectedRoute>
              } />

              <Route path="/foundations" element={
                <ProtectedRoute>
                  <StudentLayout>
                    <FoundationsLab />
                  </StudentLayout>
                </ProtectedRoute>
              } />

              <Route path="/typing" element={
                <ProtectedRoute>
                  <StudentLayout>
                    <TypingLab />
                  </StudentLayout>
                </ProtectedRoute>
              } />

              <Route path="/pen-tool" element={
                <ProtectedRoute>
                  <StudentLayout>
                    <PenToolLab />
                  </StudentLayout>
                </ProtectedRoute>
              } />

              <Route path="/lumi-odyssey" element={
                <ProtectedRoute>
                  <StudentLayout>
                    <LumiOdyssey />
                  </StudentLayout>
                </ProtectedRoute>
              } />


              <Route path="/skill-report" element={
                <ProtectedRoute>
                  <StudentLayout>
                    <SkillReport />
                  </StudentLayout>
                </ProtectedRoute>
              } />

              <Route path="/leaderboard" element={
                <ProtectedRoute>
                  <StudentLayout>
                    <Leaderboard />
                  </StudentLayout>
                </ProtectedRoute>
              } />

              <Route path="/courses" element={
                <ProtectedRoute>
                  <StudentLayout>
                    <BrowseCourses />
                  </StudentLayout>
                </ProtectedRoute>
              } />

              <Route path="/daily-log" element={
                <ProtectedRoute>
                  <StudentLayout>
                    <DailyWorkLog />
                  </StudentLayout>
                </ProtectedRoute>
              } />

              <Route path="/attendance" element={
                <ProtectedRoute>
                  <StudentLayout>
                    <Attendance />
                  </StudentLayout>
                </ProtectedRoute>
              } />

              <Route path="/assignments" element={
                <ProtectedRoute>
                  <StudentLayout>
                    <Assignments />
                  </StudentLayout>
                </ProtectedRoute>
              } />

              <Route path="/resources" element={
                <ProtectedRoute>
                  <StudentLayout>
                    <Resources />
                  </StudentLayout>
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <StudentLayout>
                    <Profile />
                  </StudentLayout>
                </ProtectedRoute>
              } />

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Router>
      </CourseProvider>
    </AuthProvider>
  );
}

export default App;
