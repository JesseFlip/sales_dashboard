# Sales Performance Dashboard

A full-stack sales analytics dashboard built to automate weekly performance reporting. Transforms raw sales data into actionable insights with gap-to-goal analysis, territory comparisons, and trend visualization.

![Dashboard Screenshot](docs/dashboard-screenshot.png)

## 🎯 The Problem

As a Senior Business Development Manager overseeing a $14.8M territory across 355+ grocery stores, I generated weekly sales performance reports 2-4 times per week. The manual process involved:

- Downloading reports from Salesforce/Tableau
- Reorganizing rows and deleting unnecessary columns
- Copying formulas from previous reports
- Calculating gap-to-goal and percent attainment
- Formatting for team distribution

**Time cost:** 15-20 minutes per report × 2-4 times weekly = 60-80 minutes/week

## ✅ The Solution

This dashboard automates the entire workflow:

- **Real-time KPIs:** Total sales, gap-to-goal, attainment percentage
- **Territory Comparison:** Bar chart showing performance by market
- **Trend Analysis:** Daily sales trend over time
- **Interactive Filters:** Filter by week and market

**Time cost:** Instant

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐
│                 │  HTTP   │                 │
│  React Frontend │◄───────►│  FastAPI Backend│
│  (Vite)         │  :3001  │  (Python)       │
│  Port 3000      │         │  Port 3001      │
└─────────────────┘         └─────────────────┘
```

### Frontend (`sales_update-main/`)
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS (dark theme)
- **Charts:** Recharts library
- **State:** React hooks

### Backend (`sales-dashboard-api/`)
- **Framework:** FastAPI (Python)
- **Server:** Uvicorn (ASGI)
- **Data:** NumPy for calculations
- **Docs:** Auto-generated OpenAPI/Swagger

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup
```bash
cd sales-dashboard-api/sales-dashboard-api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --port 3001
```

API docs available at: http://localhost:3001/docs

### Frontend Setup
```bash
cd sales_update-main/sales_update-main/frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Dashboard available at: http://localhost:3000

## 📡 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/summary` | KPI metrics (total sales, goal, attainment) |
| `GET /api/territory` | Territory breakdown for bar chart |
| `GET /api/trend` | Daily sales data for line chart |
| `GET /api/weeks` | Available weeks for dropdown |
| `GET /api/sales` | Raw sales data with filters |

All endpoints support query parameters:
- `week`: ISO week number (1-52)
- `markets`: Comma-separated market names

## 🧮 Key Metrics

### Gap to Goal
```python
gap_to_goal = total_goal - total_sales
# Negative = exceeded goal ✓
# Positive = behind goal
```

### Attainment Percentage
```python
attainment = (total_sales / total_goal) * 100
# 100% = hit goal exactly
# >100% = exceeded goal
```

### Display Lift Estimation
```python
# Measures incremental sales from in-store displays
lift_multiplier = 1.0 + (account_lift_factor * display_count)
expected_baseline = actual_sales / lift_multiplier
incremental_volume = actual_sales - expected_baseline
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS, Recharts |
| Backend | Python, FastAPI, Uvicorn, NumPy |
| Deployment | Netlify (frontend), Railway (backend) |

## 📈 Business Impact

| Metric | Before | After |
|--------|--------|-------|
| Time per report | 15-20 min | Instant |
| Weekly time saved | 60-80 min | - |
| Annual time saved | 52-69 hours | - |
| Error rate | Manual errors | Consistent |
| Accessibility | Local Excel | Web-based, shareable |

## 🎓 Skills Demonstrated

- **Full-Stack Development:** React frontend + Python backend
- **API Design:** RESTful endpoints with FastAPI
- **Data Visualization:** Interactive charts with Recharts
- **Business Analytics:** Sales metrics, goal tracking, trend analysis
- **Domain Expertise:** Wine & spirits distribution, retail analytics

## 📄 License

MIT

## 👤 Author

**Jesse Flippen** - Antigravity IDE Agents used for majority of coding with Claude as a guide to deploy

Built to solve a real operational problem from 10+ years in enterprise sales. This project demonstrates the intersection of business domain expertise and technical implementation.

- [LinkedIn](https://linkedin.com/in/YOUR_LINKEDIN)
- [GitHub](https://github.com/JesseFlip)

