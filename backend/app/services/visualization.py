"""
visualization.py — Server-Side Pre-Rendering (SSR) Visualization Engine
ReadyNest Analytics Engine — Phase 6
"""

import plotly.graph_objects as go
import plotly.express as px

class ServerSideRenderer:
    """
    Server-side visualization rendering class compiling structured SVG charts
    to avoid transmitting raw numbers or coordinates to browser inspect tabs.
    Uses Plotly with Kaleido for true SSR SVG generation.
    """

    _layout_defaults = {
        "template": "plotly_dark",
        "paper_bgcolor": "#0D1B13",
        "plot_bgcolor": "#0D1B13",
        "font": {"family": "'JetBrains Mono', monospace", "color": "#E2E8F0"},
    }

    @staticmethod
    def render_metric_heatmap(features: list, correlation_matrix: list) -> str:
        """
        Generates an XML SVG representing an Interactive Metric Correlation Heatmap using Plotly.
        """
        fig = go.Figure(data=go.Heatmap(
            z=correlation_matrix,
            x=features,
            y=features,
            colorscale=[[0, "#0D1B13"], [1, "#00E676"]],
            text=correlation_matrix,
            texttemplate="%{text:+.2f}",
            textfont={"color": "#040D08", "size": 11, "family": "'JetBrains Mono', monospace"},
            showscale=False
        ))

        fig.update_layout(
            **ServerSideRenderer._layout_defaults,
            title={"text": "[ Interactive Metric Heatmap ]", "font": {"color": "#00E676", "size": 14}},
            width=500,
            height=400,
            margin=dict(l=50, r=20, t=60, b=50),
        )

        return fig.to_image(format="svg").decode("utf-8")

    @staticmethod
    def render_time_series_forecast(timeline: list, actual: list, forecast: list) -> str:
        """
        Generates an XML SVG representing a Time-Series Forecast Line chart using Plotly.
        """
        fig = go.Figure()
        
        fig.add_trace(go.Scatter(
            x=timeline, y=actual,
            mode='lines',
            name='Actual History',
            line=dict(color='#718096', width=2, dash='dash')
        ))
        
        fig.add_trace(go.Scatter(
            x=timeline, y=forecast,
            mode='lines',
            name='Model Forecast',
            line=dict(color='#00E676', width=3)
        ))

        fig.update_layout(
            **ServerSideRenderer._layout_defaults,
            title={"text": "[ Time-Series Projection Pathways ]", "font": {"color": "#00E676", "size": 14}},
            width=600,
            height=300,
            margin=dict(l=40, r=20, t=60, b=40),
            legend=dict(x=0.01, y=0.99, bgcolor='rgba(13,27,19,0.5)', bordercolor='#1A3326', borderwidth=1)
        )
        
        fig.update_xaxes(showgrid=True, gridcolor='#1A3326', zeroline=False)
        fig.update_yaxes(showgrid=True, gridcolor='#1A3326', zeroline=False)

        return fig.to_image(format="svg").decode("utf-8")

    @staticmethod
    def render_classification_boundary(split_lines: list) -> str:
        """
        Generates an XML SVG representing Classification Decision Boundaries using Plotly.
        """
        fig = go.Figure()
        
        # Add mock clusters
        fig.add_trace(go.Scatter(
            x=[150, 120, 180], y=[180, 210, 150],
            mode='markers',
            marker=dict(color='#00E676', size=[10, 12, 8], opacity=0.6, line=dict(color='#00E676', width=1)),
            showlegend=False
        ))
        
        fig.add_trace(go.Scatter(
            x=[350, 390, 320], y=[120, 140, 160],
            mode='markers',
            marker=dict(color='#319795', size=[10, 12, 8], opacity=0.6, line=dict(color='#319795', width=1)),
            showlegend=False
        ))

        # Add split lines
        shapes = []
        annotations = []
        for item in split_lines:
            x_coord = item.get("x", 250)
            label = item.get("label", "Feature split")
            shapes.append(
                dict(type="line", x0=x_coord, y0=0, x1=x_coord, y1=300,
                     line=dict(color="#1A3326", width=2, dash="dash"))
            )
            annotations.append(
                dict(x=x_coord+10, y=280, text=label, showarrow=False,
                     textangle=-90, font=dict(color="#319795", size=9))
            )

        fig.update_layout(
            **ServerSideRenderer._layout_defaults,
            title={"text": "[ Classification Decision Boundary ]", "font": {"color": "#00E676", "size": 14}},
            width=500,
            height=300,
            margin=dict(l=20, r=20, t=60, b=20),
            shapes=shapes,
            annotations=annotations,
            xaxis=dict(range=[0, 500], showgrid=False, zeroline=False, showticklabels=False),
            yaxis=dict(range=[0, 300], showgrid=False, zeroline=False, showticklabels=False)
        )

        return fig.to_image(format="svg").decode("utf-8")
