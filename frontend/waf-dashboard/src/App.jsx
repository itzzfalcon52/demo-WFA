// src/App.jsx
import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import { Server, Shield } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AIGIS</h1>
                <p className="text-xs text-slate-400">
                  Real-time threat monitoring & analytics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                <p className="text-xs text-emerald-300 font-medium flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  System Online
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Submit Form */}
        <div className="mb-6">
          <SubmitAttack onSuccess={handleNewAlert} />
        </div>

        {/* Info Banner */}
        <div className="mb-6 rounded-xl p-4 bg-blue-500/10 border border-blue-500/30">
          <div className="flex gap-3">
            <Server className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-200">
                <span className="font-semibold">Development Mode:</span>{" "}
                Metrics, Ingestion, Model, and Accuracy panels display demo
                data. Production deployment will integrate live data streams.
              </p>
            </div>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Attack Feed */}
          <div className="lg:col-span-4">
            <AttackFeed alerts={alerts} />
          </div>

          {/* Right: Metrics */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MetricsCard metrics={metrics} />
              <IngestionStatus ingestion={ingestion} />
            </div>
            <ModelUpdates model={model} />
            <AccuracyCard ml_metrics={metrics.ml_metrics} />
          </div>
        </div>
      </main>
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
