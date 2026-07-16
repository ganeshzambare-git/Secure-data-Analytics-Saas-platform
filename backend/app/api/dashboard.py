from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import datetime

from app.core.db import get_db
from app.models import PipelineRun, User
from app.api.pipeline import get_current_user

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard SSR Visuals"])

def generate_ssr_svg_chart(metrics: dict) -> str:
    """
    Programmatic SSR SVG compiler that returns a high-fidelity vector chart.
    Ensures zero third-party C library dependency failures (like kaleido/orca)
    while matching the Cyber-Secure Dark Terminal Theme.
    """
    model_name = metrics.get("model_name", "N/A")
    accuracy = metrics.get("accuracy", 0.0)
    rmse = metrics.get("rmse", 0.0)
    split_ratio = metrics.get("split_ratio", 0.8)
    rows_scraped = metrics.get("rows_scraped", 0)
    
    # Calculate dimensions
    width = 600
    height = 300
    
    # Accuracy percentage mapping
    acc_percent = min(max(accuracy * 100, 0), 100)
    acc_bar_width = int(acc_percent * 4) # max 400px
    
    # Train-test split calculation
    train_width = int(400 * split_ratio)
    test_width = 400 - train_width
    
    svg = f"""<svg width="100%" height="100%" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" style="background-color: #0D1B13; border-radius: 4px; border: 1px solid #1A3326; font-family: 'JetBrains Mono', 'Fira Code', monospace;">
        <!-- Header -->
        <text x="20" y="35" fill="#00E676" font-size="14" font-weight="bold" letter-spacing="1">[ ReadyNest Engine Telemetry SSR Plot ]</text>
        <text x="20" y="55" fill="#718096" font-size="11">Model: {model_name} (Training Size: {rows_scraped} rows)</text>
        
        <!-- Grid Matrix Lines -->
        <line x1="20" y1="75" x2="{width - 20}" y2="75" stroke="#1A3326" stroke-width="1" />
        
        <!-- Metric 1: R2 Fit Accuracy -->
        <text x="20" y="105" fill="#E2E8F0" font-size="12">R² Accuracy Fit (R2 Score):</text>
        <text x="440" y="105" fill="#00E676" font-size="13" font-weight="bold">{accuracy:.4f}</text>
        
        <rect x="20" y="115" width="400" height="15" fill="#020805" rx="3" stroke="#1A3326" />
        <rect x="20" y="115" width="{acc_bar_width}" height="15" fill="#00E676" rx="3" />
        
        <!-- Metric 2: RMSE -->
        <text x="20" y="165" fill="#E2E8F0" font-size="12">Root Mean Squared Error (RMSE):</text>
        <text x="440" y="165" fill="#f6ad55" font-size="13" font-weight="bold">{rmse:.4f}</text>
        
        <rect x="20" y="175" width="400" height="15" fill="#020805" rx="3" stroke="#1A3326" />
        <rect x="20" y="175" width="{int(min(rmse * 400, 400))}" height="15" fill="#f6ad55" rx="3" />
        
        <!-- Metric 3: Train / Test Split -->
        <text x="20" y="225" fill="#E2E8F0" font-size="12">Data Split Layout (Train vs Test):</text>
        <text x="440" y="225" fill="#319795" font-size="12">{split_ratio*100:.0f}% / {(1 - split_ratio)*100:.0f}%</text>
        
        <g>
            <rect x="20" y="235" width="{train_width}" height="15" fill="#319795" rx="3" />
            <rect x="{20 + train_width}" y="235" width="{test_width}" height="15" fill="#1A3326" rx="3" />
        </g>
        
        <!-- Footer timestamp -->
        <text x="20" y="280" fill="#718096" font-size="9">Rendered: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</text>
        <text x="480" y="280" fill="#00E676" font-size="9" font-weight="bold">🛡️ ZERO TRUST CHANNEL</text>
    </svg>"""
    return svg

@router.get("/charts")
def get_run_metrics_chart(
    run_id: str = Query(..., description="Target pipeline run ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch run (RLS automatically confines this to current tenant space)
    run = db.query(PipelineRun).filter_by(id=run_id).first()
    
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline run not found."
        )
        
    if not run.metrics or "model_name" not in run.metrics:
        # If model has not been trained yet, return empty/placeholder svg chart config
        placeholder_metrics = {
            "model_name": "No Model Trained Yet",
            "accuracy": 0.0,
            "rmse": 0.0,
            "split_ratio": 0.8,
            "rows_scraped": 0
        }
        svg = generate_ssr_svg_chart(placeholder_metrics)
    else:
        svg = generate_ssr_svg_chart(run.metrics)
        
    return {"svg": svg}
