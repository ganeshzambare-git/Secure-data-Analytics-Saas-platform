import plotly.graph_objects as go
fig = go.Figure(data=go.Bar(y=[2, 3, 1]))
print(fig.to_image(format="svg").decode("utf-8")[:100])
