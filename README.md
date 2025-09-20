# 🚀 Transformer-based Web Application Firewall (WAF) – Demo Project

[🌐 Live Demo](https://demo-wfa.vercel.app/)

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

| Category                   | Current Demo                                                             | Final Product (Transformer-based WAF)                                                                           | Impact / Notes                                                                                |
| -------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --- |
| Data Source                | Kaggle dataset urldata.csv (~450k URLs), whitelist & blacklist.          | Synthetic access logs for 3 provided web apps (benign traffic) + live requests.                                 | Dataset is dynamic and app-specific. Your ML model will learn patterns of real user requests. |
| Detection Type             | Regex (for URLs with ? or =) + Logistic Regression (TF-IDF char n-gram). | Transformer-based anomaly detection on entire HTTP request (method, path, params, headers, payload, etc.).      | Captures sequential patterns, zero-day attacks, never-seen-before anomalies.                  |
| Log Ingestion              | N/A – only URLs provided as test inputs.                                 | Batch ingestion (historical logs) + streaming ingestion (tail logs live).                                       | Real-time detection requires scalable ingestion pipeline.                                     |
| Parsing & Normalization    | Only URL normalization (strip().lower().rstrip('/')).                    | Extract fields: method, path, parameters, headers, payload. Normalize dynamic values (IDs, timestamps, tokens). | Preprocessing transforms raw HTTP requests into tokens suitable for Transformer input.        |
| Tokenization               | Character n-grams for URL only.                                          | Token sequences for full HTTP requests; may include positional encodings for path/parameters.                   | Required for Transformer input representation.                                                |
| Model Architecture         | Logistic Regression + TF-IDF features.                                   | Open-source Transformer (e.g., BERT-like) fine-tuned on access logs.                                            | Can learn sequential patterns, dependencies, anomalies across requests.                       |
| Training                   | One-time model training on Kaggle dataset.                               | Pre-finale training on synthetic benign logs + incremental updates on new traffic.                              | Ensures the model adapts to new apps and evolving traffic patterns.                           |
| Inference & Live Detection | Local Python script + FastAPI endpoint.                                  | Integrated WAF with Apache/Nginx; real-time non-blocking inference.                                             | Must handle multiple requests simultaneously without latency.                                 |
| Threshold / Flags          | Static threshold + whitelist/blacklist for ML probability.               | Anomaly score per request; optional thresholds for alerting/blocking.                                           | Transformer outputs anomaly scores; can be combined with policy engine.                       |
| Alerts / Feedback          | Simple alert JSON (flagged, source, probability).                        | Real-time alerts with severity, matched fields, anomaly score; integrated dashboard.                            | Helps operators see live attacks.                                                             |
| Metrics / Monitoring       | Requests, flagged counts, blocked counts.                                | Detailed metrics: request volume, anomaly distribution, model confidence, latency, ingestion rate.              | Essential for production-level WAF.                                                           |
| Retraining / Updates       | Manual script rerun.                                                     | Continuous incremental fine-tuning on new benign traffic.                                                       | Transformer updates without retraining on entire dataset.                                     |
| Security / Reliability     | Local test only.                                                         | Production-grade WAF with logging, authentication, rate limiting, fault tolerance.                              | Hackathon-ready solution must be demonstrable and robust.                                     |
| Demonstration              | Test URLs sent via API, some phishing examples.                          | Live injection of malicious payloads on provided apps; WAF detects anomalies in real time.                      | Transformer detects new attack patterns not in initial dataset.                               |     |

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

- built with ❤️ bt team HELIOS

---

⚡ _This repo is for demo purposes. The hackathon version will expand with ML, real-time pipelines, and production-ready features._
