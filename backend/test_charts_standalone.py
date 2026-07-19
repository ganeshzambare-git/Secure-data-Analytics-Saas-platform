import plotly.graph_objects as go
import plotly.express as px
import sys

def generate_ssr_svg_chart(metrics: dict) -> str:
    model_name = metrics.get("model_name", "N/A")
    accuracy = metrics.get("accuracy", 0.0)
    rmse = metrics.get("rmse", 0.0)
    split_ratio = metrics.get("split_ratio", 0.8)
    rows_scraped = metrics.get("rows_scraped", 0)
    
    fig = go.Figure()
    fig.add_trace(go.Bar(y=["R² Score "], x=[accuracy], orientation='h', marker=dict(color="#00E676")))
    fig.add_trace(go.Bar(y=["RMSE "], x=[rmse], orientation='h', marker=dict(color="#f6ad55")))
    fig.add_trace(go.Bar(y=["Data Split "], x=[split_ratio], orientation='h', marker=dict(color="#319795")))
    fig.add_trace(go.Bar(y=["Data Split "], x=[1 - split_ratio], orientation='h', marker=dict(color="#1A3326")))
    return fig.to_image(format="svg").decode("utf-8")

if __name__ == "__main__":
    try:
        svg = generate_ssr_svg_chart({'model_name': 'TestModel', 'accuracy': 0.85, 'rmse': 0.12, 'split_ratio': 0.75, 'rows_scraped': 1000})
        print(svg[:100])
        print("SUCCESS")
    except Exception as e:
        print(f"FAILED: {e}")
        sys.exit(1)
