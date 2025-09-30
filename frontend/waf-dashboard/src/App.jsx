// src/App.jsx
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import axios from "axios";

// Dashboard components
import AttackFeed from "./components/AttackFeed";
import MetricsCard from "./components/MetricsCard";
import IngestionStatus from "./components/IngestionStatus";
import ModelUpdates from "./components/ModelUpdates";
import SubmitAttack from "./components/SubmitAttack";
import AccuracyCard from "./components/AccuracyCard";

// Test URLs page
import TestPage from "../pages/TestPage";

function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [ingestion, setIngestion] = useState({});
  const [model, setModel] = useState({});

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const alertsRes = await axios.get(`${API_URL}/alerts`);
        const metricsRes = await axios.get(`${API_URL}/metrics`);
        const ingestionRes = await axios.get(`${API_URL}/ingestion`);
        const modelRes = await axios.get(`${API_URL}/model`);

        setAlerts(Array.isArray(alertsRes.data) ? alertsRes.data : []);
        setMetrics(metricsRes.data || {});
        setIngestion(ingestionRes.data || {});
        setModel(modelRes.data || {});
      } catch (err) {
        console.error("API error:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [API_URL]);

  const handleNewAlert = (alert) => {
    setAlerts((prev) => [alert, ...prev]);
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white p-6">
      {/* Submit Attack Form */}
      <div className="mb-4">
        <SubmitAttack onSuccess={handleNewAlert} />
      </div>

      {/* Demo disclaimer */}
      <div className="mb-6">
        <div className="rounded-lg px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-850 border border-gray-700 shadow-sm">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-400 mt-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M12 6v.01"
              />
            </svg>
            <p className="text-sm text-gray-300">
              <strong className="text-white">Note:</strong> The Metrics,
              Ingestion, Model, and Accuracy panels show{" "}
              <span className="font-medium text-gray-100">demo data</span> for
              development. They will be replaced with live production data.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Live Attack Feed */}
        <div className="lg:col-span-4">
          <AttackFeed alerts={alerts} />
        </div>

        {/* Right column: Metrics, Ingestion, Model, Accuracy */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetricsCard metrics={metrics} />
          <IngestionStatus ingestion={ingestion} />
          <div className="md:col-span-2">
            <ModelUpdates model={model} />
          </div>
          <div className="md:col-span-2">
            <AccuracyCard ml_metrics={metrics.ml_metrics || {}} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      {/* Navigation */}
      <nav className="p-4 bg-gray-900 text-white flex gap-4">
        <Link to="/" className="hover:underline">
          Dashboard
        </Link>
        <Link to="/test-page" className="hover:underline">
          Test URLs
        </Link>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/test-page" element={<TestPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
