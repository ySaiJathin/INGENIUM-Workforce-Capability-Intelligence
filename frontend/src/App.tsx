import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { RequireCandidate } from './components/layout/RequireCandidate';

// Pages
import { Home } from './pages/Home';
import { Candidate } from './pages/Candidate';
import { ResumeUpload } from './pages/ResumeUpload';
import { InitialProfile } from './pages/InitialProfile';
import { RoleSelection } from './pages/RoleSelection';
import { RoleRequirements } from './pages/RoleRequirements';
import { Assessment } from './pages/Assessment';
import { AssessmentResults } from './pages/AssessmentResults';
import { CapabilityProfile } from './pages/CapabilityProfile';
import { SkillGaps } from './pages/SkillGaps';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { LearningPath } from './pages/LearningPath';
import { Dashboard } from './pages/Dashboard';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="candidate" element={<Candidate />} />
            <Route path="candidate/resume" element={<ResumeUpload />} />
            <Route
              path="candidate/profile"
              element={
                <RequireCandidate>
                  <InitialProfile />
                </RequireCandidate>
              }
            />
            <Route
              path="roles"
              element={
                <RequireCandidate>
                  <RoleSelection />
                </RequireCandidate>
              }
            />
            <Route
              path="roles/:roleId"
              element={
                <RequireCandidate>
                  <RoleRequirements />
                </RequireCandidate>
              }
            />
            <Route
              path="assessment"
              element={
                <RequireCandidate>
                  <Assessment />
                </RequireCandidate>
              }
            />
            <Route
              path="assessment/results"
              element={
                <RequireCandidate>
                  <AssessmentResults />
                </RequireCandidate>
              }
            />
            <Route
              path="capability"
              element={
                <RequireCandidate>
                  <CapabilityProfile />
                </RequireCandidate>
              }
            />
            <Route
              path="gaps"
              element={
                <RequireCandidate>
                  <SkillGaps />
                </RequireCandidate>
              }
            />
            <Route
              path="courses"
              element={
                <RequireCandidate>
                  <Courses />
                </RequireCandidate>
              }
            />
            <Route
              path="courses/:courseId"
              element={
                <RequireCandidate>
                  <CourseDetail />
                </RequireCandidate>
              }
            />
            <Route
              path="learning-path"
              element={
                <RequireCandidate>
                  <LearningPath />
                </RequireCandidate>
              }
            />
            <Route
              path="dashboard"
              element={
                <RequireCandidate>
                  <Dashboard />
                </RequireCandidate>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
