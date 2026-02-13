"""
Data Module

Handles data generation, filtering, and aggregation for the sales dashboard.
In a production app, this would connect to a database or external API.
For this demo, we generate realistic sample data.
"""

import random
from datetime import datetime, timedelta
from typing import Optional
import numpy as np

# Seed for consistent data across restarts
random.seed(42)
np.random.seed(42)

# Configuration
MARKETS = ["Austin", "Dallas", "Houston", "San Antonio", "Fort Worth"]
ACCOUNTS = ["Tom Thumb", "Kroger", "Central Market", "Whole Foods", "Market Street"]
BRANDS = ["Moët & Chandon", "Hennessy", "Veuve Clicquot", "Dom Pérignon", "Belvedere"]
REPS = ["Martinez, J", "Thompson, K", "Williams, R", "Garcia, M", "Johnson, T"]

# Generate base dataset once at startup
_DATA_CACHE = None


def _generate_sample_data() -> list[dict]:
    """
    Generate realistic sample sales data.
    
    Creates ~500 records across multiple weeks, markets, and accounts.
    """
    global _DATA_CACHE
    
    if _DATA_CACHE is not None:
        return _DATA_CACHE
    
    data = []
    
    # Generate data for weeks 1-8 of 2026
    base_date = datetime(2026, 1, 1)
    
    for week in range(1, 9):
        week_start = base_date + timedelta(weeks=week-1)
        
        for market in MARKETS:
            # Each market has different baseline performance
            market_multiplier = {
                "Dallas": 1.2,
                "Houston": 1.1,
                "Austin": 0.95,
                "San Antonio": 0.85,
                "Fort Worth": 0.9,
            }.get(market, 1.0)
            
            for account in ACCOUNTS:
                for day_offset in range(7):
                    current_date = week_start + timedelta(days=day_offset)
                    
                    # Generate realistic numbers
                    base_goal = int(random.randint(800, 1500) * market_multiplier)
                    
                    # Sales typically 85-115% of goal with some variance
                    attainment = random.gauss(1.0, 0.15)
                    sales = int(base_goal * max(0.5, min(1.5, attainment)))
                    
                    # Displays affect performance
                    displays = random.randint(0, 4)
                    if displays > 0:
                        # Displays boost sales by 5-10% each
                        display_lift = 1 + (displays * random.uniform(0.05, 0.10))
                        sales = int(sales * display_lift)
                    
                    data.append({
                        "date": current_date.strftime("%Y-%m-%d"),
                        "week": week,
                        "market": market,
                        "account": account,
                        "brand": random.choice(BRANDS),
                        "rep": random.choice(REPS),
                        "goal": base_goal,
                        "sales_volume": sales,
                        "displays": displays,
                        "pods": random.randint(0, 3),
                        "voids": random.randint(0, 2),
                    })
    
    _DATA_CACHE = data
    return data


def get_sales_data(
    week: Optional[int] = None,
    market: Optional[str] = None,
) -> list[dict]:
    """
    Get filtered sales data.
    
    Args:
        week: Filter by ISO week number
        market: Filter by market name
        
    Returns:
        List of sales records matching filters
    """
    data = _generate_sample_data()
    
    if week is not None:
        data = [d for d in data if d["week"] == week]
    
    if market is not None:
        data = [d for d in data if d["market"] == market]
    
    return data


def get_summary_metrics(
    week: Optional[int] = None,
    markets: Optional[list[str]] = None,
) -> dict:
    """
    Calculate aggregated summary metrics.
    
    Args:
        week: Filter by week number
        markets: List of markets to include
        
    Returns:
        Dictionary with total_sales, total_goal, gap_to_goal, attainment
    """
    data = _generate_sample_data()
    
    # Apply filters
    if week is not None:
        data = [d for d in data if d["week"] == week]
    
    if markets:
        data = [d for d in data if d["market"] in markets]
    
    if not data:
        return {
            "total_sales": 0,
            "total_goal": 0,
            "gap_to_goal": 0,
            "attainment": 0,
        }
    
    total_sales = sum(d["sales_volume"] for d in data)
    total_goal = sum(d["goal"] for d in data)
    gap_to_goal = total_goal - total_sales
    attainment = (total_sales / total_goal * 100) if total_goal > 0 else 0
    
    return {
        "total_sales": total_sales,
        "total_goal": total_goal,
        "gap_to_goal": gap_to_goal,
        "attainment": round(attainment, 1),
    }


def get_territory_summary(week: Optional[int] = None) -> list[dict]:
    """
    Get summary by territory (market) for the bar chart.
    
    Returns list of markets with their attainment percentages.
    """
    data = _generate_sample_data()
    
    if week is not None:
        data = [d for d in data if d["week"] == week]
    
    # Aggregate by market
    market_totals = {}
    for record in data:
        market = record["market"]
        if market not in market_totals:
            market_totals[market] = {"sales": 0, "goal": 0}
        market_totals[market]["sales"] += record["sales_volume"]
        market_totals[market]["goal"] += record["goal"]
    
    # Calculate attainment for each market
    result = []
    for market, totals in market_totals.items():
        attainment = (totals["sales"] / totals["goal"] * 100) if totals["goal"] > 0 else 0
        result.append({
            "market": market,
            "sales": totals["sales"],
            "goal": totals["goal"],
            "attainment": round(attainment, 1),
        })
    
    # Sort by attainment descending
    result.sort(key=lambda x: x["attainment"], reverse=True)
    
    return result


def get_daily_trend(
    week: Optional[int] = None,
    markets: Optional[list[str]] = None,
) -> list[dict]:
    """
    Get daily sales totals for the trend line chart.
    
    Returns list of dates with total sales for each day.
    """
    data = _generate_sample_data()
    
    if week is not None:
        data = [d for d in data if d["week"] == week]
    
    if markets:
        data = [d for d in data if d["market"] in markets]
    
    # Aggregate by date
    daily_totals = {}
    for record in data:
        date = record["date"]
        if date not in daily_totals:
            daily_totals[date] = 0
        daily_totals[date] += record["sales_volume"]
    
    # Convert to sorted list
    result = [
        {"date": date, "sales": total}
        for date, total in sorted(daily_totals.items())
    ]
    
    return result


def get_available_weeks() -> list[int]:
    """Get list of unique weeks in the dataset."""
    data = _generate_sample_data()
    weeks = sorted(set(d["week"] for d in data))
    return weeks
