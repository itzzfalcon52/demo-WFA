import { useEffect, useState } from "react";
import axios from "axios";
import AttackFeed from "./components/AttackFeed";
import MetricsCard from "./components/MetricsCard";
import IngestionStatus from "./components/IngestionStatus";
import ModelUpdates from "./components/ModelUpdates";
import SubmitAttack from "./components/SubmitAttack";

function App() {
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [ingestion, setIngestion] = useState({});
  const [model, setModel] = useState({});

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setAlerts((await axios.get(`${API_URL}/alerts`)).data);
        setMetrics((await axios.get(`${API_URL}/metrics`)).data);
        setIngestion((await axios.get(`${API_URL}/ingestion`)).data);
        setModel((await axios.get(`${API_URL}/model`)).data);
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
      <div className="mb-6">
        <SubmitAttack onSuccess={handleNewAlert} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Live Attack Feed */}
        <div className="lg:col-span-4">
          <AttackFeed alerts={alerts} />
        </div>

        {/* Right column: Metrics, Ingestion, Model */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Metrics */}
          <MetricsCard metrics={metrics} />

          {/* Ingestion */}
          <IngestionStatus ingestion={ingestion} />

          {/* Model updates spans full width */}
          <div className="md:col-span-2">
            <ModelUpdates model={model} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
