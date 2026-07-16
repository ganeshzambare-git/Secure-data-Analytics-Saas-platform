"""
visualization.py — Server-Side Pre-Rendering (SSR) Visualization Engine
ReadyNest Analytics Engine — Phase 6
"""

class ServerSideRenderer:
    """
    Server-side visualization rendering class compiling structured SVG charts
    to avoid transmitting raw numbers or coordinates to browser inspect tabs.
    """

    @staticmethod
    def render_metric_heatmap(features: list, correlation_matrix: list) -> str:
        """
        Generates an XML SVG representing an Interactive Metric Correlation Heatmap.
        """
        width = 500
        height = 400
        svg = f"""<svg width="100%" height="100%" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" style="background-color: #0D1B13; border-radius: 4px; border: 1px solid #1A3326; font-family: 'JetBrains Mono', monospace;">
            <text x="20" y="35" fill="#00E676" font-size="14" font-weight="bold">[ Interactive Metric Heatmap ]</text>
            <text x="20" y="55" fill="#718096" font-size="10">Features Correlation Coefficient Matrix</text>
        """
        
        # Grid dimensions
        n = len(features)
        cell_size = 60
        start_x = 120
        start_y = 90
        
        # Draw labels
        for i, feat in enumerate(features):
            # Row labels
            svg += f'<text x="20" y="{start_y + i*cell_size + 35}" fill="#E2E8F0" font-size="10">{feat}</text>\n'
            # Col labels
            svg += f'<text x="{start_x + i*cell_size + 5}" y="{start_y - 15}" fill="#E2E8F0" font-size="10" transform="rotate(-15, {start_x + i*cell_size}, {start_y - 15})">{feat}</text>\n'
            
        # Draw cells
        for r in range(n):
            for c in range(n):
                val = correlation_matrix[r][c]
                # Heatmap color scale (cyber emerald scale)
                intensity = int(abs(val) * 200)
                color = f"rgba(0, 230, 118, {abs(val):.2f})"
                x = start_x + c * cell_size
                y = start_y + r * cell_size
                
                svg += f'<rect x="{x}" y="{y}" width="{cell_size-2}" height="{cell_size-2}" fill="{color}" rx="3" stroke="#1A3326" stroke-width="1" />\n'
                svg += f'<text x="{x + 15}" y="{y + 35}" fill="#040D08" font-size="11" font-weight="bold">{val:+.2f}</text>\n'
                
        svg += "</svg>"
        return svg

    @staticmethod
    def render_time_series_forecast(timeline: list, actual: list, forecast: list) -> str:
        """
        Generates an XML SVG representing a Time-Series Forecast Line chart.
        """
        width = 600
        height = 300
        svg = f"""<svg width="100%" height="100%" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" style="background-color: #0D1B13; border-radius: 4px; border: 1px solid #1A3326; font-family: 'JetBrains Mono', monospace;">
            <text x="20" y="35" fill="#00E676" font-size="14" font-weight="bold">[ Time-Series Projection Pathways ]</text>
            <text x="20" y="55" fill="#718096" font-size="10">Actual Historical vs Predictive Pathway Projections</text>
        """
        
        # Draw axes
        svg += '<line x1="50" y1="240" x2="550" y2="240" stroke="#1A3326" stroke-width="2" />\n'
        svg += '<line x1="50" y1="70" x2="50" y2="240" stroke="#1A3326" stroke-width="2" />\n'
        
        # Plot coordinates mapper
        n = len(timeline)
        dx = 500 / max(1, n-1)
        
        actual_pts = []
        forecast_pts = []
        
        for i in range(n):
            cx = 50 + i * dx
            # map y values (0-1) to pixel range 240-80
            cy_act = 240 - (actual[i] * 150)
            cy_for = 240 - (forecast[i] * 150)
            
            actual_pts.append(f"{cx},{cy_act}")
            forecast_pts.append(f"{cx},{cy_for}")
            
        actual_path = " ".join(actual_pts)
        forecast_path = " ".join(forecast_pts)
        
        # Plot lines
        svg += f'<polyline points="{actual_path}" fill="none" stroke="#718096" stroke-width="2" stroke-dasharray="4" />\n'
        svg += f'<polyline points="{forecast_path}" fill="none" stroke="#00E676" stroke-width="3" />\n'
        
        # Legend
        svg += '<rect x="420" y="25" width="10" height="10" fill="#718096" />\n'
        svg += '<text x="435" y="33" fill="#718096" font-size="9">Actual History</text>\n'
        svg += '<rect x="420" y="42" width="10" height="10" fill="#00E676" />\n'
        svg += '<text x="435" y="50" fill="#00E676" font-size="9">Model Forecast</text>\n'
        
        svg += "</svg>"
        return svg

    @staticmethod
    def render_classification_boundary(split_lines: list) -> str:
        """
        Generates an XML SVG representing Classification Decision Boundaries.
        """
        width = 500
        height = 300
        svg = f"""<svg width="100%" height="100%" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" style="background-color: #0D1B13; border-radius: 4px; border: 1px solid #1A3326; font-family: 'JetBrains Mono', monospace;">
            <text x="20" y="35" fill="#00E676" font-size="14" font-weight="bold">[ Classification Decision Boundary ]</text>
            <text x="20" y="55" fill="#718096" font-size="10">XGBoost Feature Split Partition Logic</text>
        """
        
        # Render dividing sections using split lines
        for item in split_lines:
            x_coord = item.get("x", 250)
            label = item.get("label", "Feature split")
            svg += f'<line x1="{x_coord}" y1="80" x2="{x_coord}" y2="260" stroke="#1A3326" stroke-width="2" stroke-dasharray="2" />\n'
            svg += f'<text x="{x_coord + 5}" y="95" fill="#319795" font-size="9" transform="rotate(90, {x_coord + 5}, 95)">{label}</text>\n'
            
        # Draw clusters
        svg += '<circle cx="150" cy="180" r="10" fill="#00E676" opacity="0.6" stroke="#00E676" stroke-width="1" />\n'
        svg += '<circle cx="120" cy="210" r="12" fill="#00E676" opacity="0.6" stroke="#00E676" stroke-width="1" />\n'
        svg += '<circle cx="180" cy="150" r="8" fill="#00E676" opacity="0.6" stroke="#00E676" stroke-width="1" />\n'
        
        svg += '<circle cx="350" cy="120" r="10" fill="#319795" opacity="0.6" stroke="#319795" stroke-width="1" />\n'
        svg += '<circle cx="390" cy="140" r="12" fill="#319795" opacity="0.6" stroke="#319795" stroke-width="1" />\n'
        svg += '<circle cx="320" cy="160" r="8" fill="#319795" opacity="0.6" stroke="#319795" stroke-width="1" />\n'
        
        svg += "</svg>"
        return svg
