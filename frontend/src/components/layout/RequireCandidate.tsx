import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

// Route guard for FR-006: mid-flow routes must not crash when no candidate has been loaded yet
// (no resume uploaded, no "Try Demo Candidate" run) — redirect to the resume upload step instead.
export const RequireCandidate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { candidateId } = useApp();

  if (!candidateId) {
    return <Navigate to="/candidate/resume" replace />;
  }

  return <>{children}</>;
};
