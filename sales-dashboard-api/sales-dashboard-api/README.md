# Sales Dashboard API (FastAPI)

A Python backend API for the CPWS Sales Dashboard, built with FastAPI.

## What is FastAPI?

FastAPI is a modern Python web framework for building APIs. It's:
- **Fast** - One of the fastest Python frameworks (on par with Node.js)
- **Easy** - Intuitive and minimal boilerplate
- **Auto-documented** - Generates OpenAPI/Swagger docs automatically
- **Type-safe** - Uses Python type hints for validation

## Project Structure

```
sales-dashboard-api/
├── app/
│   ├── __init__.py      # Makes 'app' a Python package
│   ├── main.py          # FastAPI application & routes
│   └── data.py          # Data generation & business logic
├── requirements.txt     # Python dependencies
└── README.md
```

## Key Concepts Explained

### 1. The FastAPI App (`main.py`)

```python
app = FastAPI()  # Create the application

@app.get("/api/sales")  # Define a route
def get_sales():        # This function handles requests to /api/sales
    return {"data": [...]}
```

### 2. CORS Middleware

CORS (Cross-Origin Resource Sharing) allows your frontend (localhost:3000) 
to call your backend (localhost:3001). Without this, browsers block the request.

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Which frontends can access this API
)
```

### 3. Query Parameters

FastAPI automatically parses URL parameters:

```python
@app.get("/api/sales")
def get_sales(week: Optional[int] = None):  # ?week=4 becomes week=4
    ...
```

### 4. Auto-Generated Documentation

FastAPI creates interactive API docs automatically:
- Swagger UI: http://localhost:3001/docs
- ReDoc: http://localhost:3001/redoc

## Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server (with auto-reload for development)
uvicorn app.main:app --reload --port 3001

# Server runs at http://localhost:3001
# API docs at http://localhost:3001/docs
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Health check |
| `GET /api/sales?week=4&market=Dallas` | Raw sales data |
| `GET /api/summary?week=4&markets=Dallas,Austin` | KPI metrics |
| `GET /api/territory?week=4` | Territory bar chart data |
| `GET /api/trend?week=4` | Daily trend line chart data |
| `GET /api/weeks` | Available weeks for dropdown |

## Deploying to Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. "New Project" → "Deploy from GitHub repo"
4. Railway auto-detects Python and runs it

Add this `Procfile` for Railway:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Connecting to Your Frontend

Update your frontend to call this API:

```javascript
// Before (Node backend)
const response = await fetch('http://localhost:3001/api/sales');

// After (FastAPI backend) - same URL!
const response = await fetch('http://localhost:3001/api/sales');
```

The endpoints are designed to match your existing Node backend, so minimal 
frontend changes are needed.

## Next Steps

1. Run the API locally and test with `/docs`
2. Update your frontend to point to this backend
3. Deploy backend to Railway
4. Deploy frontend to Netlify
5. Update frontend API URLs to use Railway URL
