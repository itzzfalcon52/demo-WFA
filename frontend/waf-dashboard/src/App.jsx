// src/App.jsx

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";

// Dashboard components

import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";

// Test URLs page
import TestPage from "./pages/TestPage";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/test-page" element={<TestPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
