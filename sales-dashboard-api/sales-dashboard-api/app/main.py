"""
Sales Dashboard API

A FastAPI backend that serves sales performance data for the dashboard.
Replaces the Node.js backend with Python.

To run locally:
    uvicorn app.main:app --reload --port 3001

To run in production:
    uvicorn app.main:app --host 0.0.0.0 --port $PORT
"""

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import logging

from app.data import get_sales_data, get_summary_metrics, get_territory_summary, get_daily_trend

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Sales Dashboard API",
    description="API for CPWS Sales Performance Dashboard",
    version="1.0.0",
)

# Configure CORS (allows frontend to call this API)
# In production, replace "*" with your actual frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """Health check endpoint."""
    return {"status": "healthy", "message": "Sales Dashboard API is running"}


@app.get("/api/sales")
def get_sales(
    week: Optional[int] = Query(None, description="ISO week number to filter by"),
    market: Optional[str] = Query(None, description="Market to filter by"),
):
    """
    Get raw sales data with optional filters.
    
    Parameters:
    - week: Filter by ISO week number (1-52)
    - market: Filter by market name (Austin, Dallas, Houston, San Antonio)
    
    Returns:
    - List of sales records
    """
    logger.info(f"GET /api/sales - week={week}, market={market}")
    data = get_sales_data(week=week, market=market)
    return {"data": data, "count": len(data)}


@app.get("/api/summary")
def get_summary(
    week: Optional[int] = Query(None, description="ISO week number"),
    markets: Optional[str] = Query(None, description="Comma-separated list of markets"),
):
    """
    Get aggregated summary metrics for the dashboard KPI cards.
    
    Returns:
    - total_sales: Total sales volume
    - total_goal: Total goal
    - gap_to_goal: Goal - Sales (negative means exceeded)
    - attainment: Percentage of goal achieved
    """
    logger.info(f"GET /api/summary - week={week}, markets={markets}")
    
    # Parse comma-separated markets into list
    market_list = None
    if markets:
        market_list = [m.strip() for m in markets.split(",")]
    
    summary = get_summary_metrics(week=week, markets=market_list)
    return summary


@app.get("/api/territory")
def get_territory(
    week: Optional[int] = Query(None, description="ISO week number"),
):
    """
    Get territory (market) level summary for the bar chart.
    
    Returns list of markets with their attainment percentages.
    """
    logger.info(f"GET /api/territory - week={week}")
    data = get_territory_summary(week=week)
    return {"data": data}


@app.get("/api/trend")
def get_trend(
    week: Optional[int] = Query(None, description="ISO week number"),
    markets: Optional[str] = Query(None, description="Comma-separated list of markets"),
):
    """
    Get daily sales trend data for the line chart.
    
    Returns daily sales totals for the specified week.
    """
    logger.info(f"GET /api/trend - week={week}, markets={markets}")
    
    market_list = None
    if markets:
        market_list = [m.strip() for m in markets.split(",")]
    
    data = get_daily_trend(week=week, markets=market_list)
    return {"data": data}


@app.get("/api/weeks")
def get_available_weeks():
    """
    Get list of available weeks in the dataset.
    
    Used to populate the week selector dropdown.
    """
    from app.data import get_available_weeks
    weeks = get_available_weeks()
    return {"weeks": weeks}


@app.get("/api/download")
def download_sales(
    week: Optional[int] = Query(None),
    markets: Optional[str] = Query(None),
):
    """Export filtered sales data as CSV."""
    import io
    import csv
    from fastapi.responses import StreamingResponse
    
    market_list = [m.strip() for m in markets.split(",")] if markets else None
    data = get_sales_data(week=week)
    
    # Filter by markets if provided
    if market_list:
        data = [d for d in data if d["market"] in market_list]
        
    if not data:
        return StreamingResponse(io.StringIO(""), media_type="text/csv")
        
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=data[0].keys())
    writer.writeheader()
    writer.writerows(data)
    output.seek(0)
    
    return StreamingResponse(
        output, 
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sales_export.csv"}
    )


# This allows running with: python -m app.main
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)
