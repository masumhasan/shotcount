import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChatInterface } from './components/ChatInterface';
import { ProtectedRoute } from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import { InboxPage } from './features/inbox';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <InboxPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<PublicChatPage />} />
      </Routes>
    </Router>
  );
}

function PublicChatPage() {
  return (
    <div className="min-h-dvh bg-surface flex items-start md:items-center justify-center p-0 md:p-4">
      <ChatInterface isFullScreen />
    </div>
  );
}
