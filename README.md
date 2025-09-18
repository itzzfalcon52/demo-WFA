# 🚀 Transformer-based Web Application Firewall (WAF) – Demo Project

## 📌 Project Overview

Traditional Web Application Firewalls (WAFs) rely on static, rule-based detection mechanisms. These struggle against **zero-day exploits** and **never-seen-before attacks**.

Our project demonstrates how **Transformers** can be used for **real-time anomaly detection** in web traffic.

This repository contains a **demo version** of our system with:

- Mock API backend (FastAPI) simulating attack detection.
- Frontend dashboard (React + Tailwind) for live monitoring.
- Basic malicious payload flagging (SQLi, XSS, Path Traversal).

---

## 🎯 Problem Statement

- Existing WAFs are **static and signature-based**.
- Cannot handle **new attack patterns**.
- Lack of **real-time adaptive learning**.
- Poor visibility for developers and security teams.

---

## ✅ Solution Overview

- Transformer-based anomaly detection model to **learn request patterns**.
- Real-time log ingestion (batch + streaming).
- Centralized dashboard with live metrics.
- Continuous model retraining for adapting to new threats.

---

## 🛠️ Tech Stack

**Frontend:**

- React
- TailwindCSS
- Axios
- Lucide Icons
- Recharts

**Backend (Demo):**

- FastAPI
- CORS Middleware

**Planned (Hackathon Version):**

- Apache/Nginx log ingestion (Filebeat/Fluentd)
- Transformer model (PyTorch/HuggingFace)
- MongoDB / PostgreSQL for log storage
- Prometheus + Grafana for monitoring
- Docker & Kubernetes for deployment

---

## 📽️ Demo Walkthrough

- **Attack Feed:** shows flagged malicious requests in real time.
- **Metrics Dashboard:** displays accuracy, precision, requests/sec, anomalies.
- **Ingestion Status:** batch & streaming log pipeline simulation.
- **Model Updates:** version tracking & incremental retraining info.

👉 Demo Video: https://github.com/itzzfalcon52/demo-WFA/issues/1
👉 Screenshots: ![Dashboard Screenshot](screenshots/dashboard.png)

---

## 🔍 Demo vs Hackathon Project

| Feature       | Demo Project             | Hackathon Project                          |
| ------------- | ------------------------ | ------------------------------------------ |
| Log Ingestion | Mock endpoints (FastAPI) | Real-time logs from Apache/Nginx           |
| Detection     | Regex-based flagging     | Transformer-based anomaly detection        |
| Storage       | In-memory list           | MongoDB / PostgreSQL                       |
| Model         | Simulated responses      | Trained Transformer (DistilBERT/GPT-small) |
| Dashboard     | React UI with mock data  | React + live metrics + Grafana integration |

---

## 📊 Results & Impact (Planned)

- 🚨 Real-Time Anomaly Detection
- 🛡️ Enhanced Web Security
- 📈 Scalable Monitoring of Large Log Volumes
- 📊 Interactive Dashboard for SOC teams
- 🤖 Future-Ready (adapts to unseen threats)

---

## ▶️ How to Run (Demo Project)

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate   # On Mac/Linux
venv\Scripts\activate      # On Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Access at: [http://localhost:5173](http://localhost:5173)

---

## 🚀 Next Steps for Hackathon

- Integrate **real log ingestion** pipelines.
- Train & deploy **Transformer anomaly detection model**.
- Scale using **Docker + Kubernetes**.
- Monitor performance with **Prometheus + Grafana**.
- Create a **live demo attack scenario** using curl/attack payloads.

---

## 🤝 Contributors

- [Your Team Name]

---

⚡ _This repo is for demo purposes. The hackathon version will expand with ML, real-time pipelines, and production-ready features._
