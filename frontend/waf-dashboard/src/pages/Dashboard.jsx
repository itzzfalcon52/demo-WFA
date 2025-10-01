import { useState, useEffect } from "react";
import axios from "axios";
import { Server } from "lucide-react";
import AttackFeed from "../components/AttackFeed";
import MetricsCard from "../components/MetricsCard";
import IngestionStatus from "../components/IngestionStatus";
import ModelUpdates from "../components/ModelUpdates";
import SubmitAttack from "../components/SubmitAttack";
import AccuracyCard from "../components/AccuracyCard";
//import AccuracyCard from "../components/AccuracyCard";

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

export default Dashboard;
