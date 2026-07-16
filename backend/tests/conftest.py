import sys
import os
from unittest.mock import MagicMock

# Ensure the backend root folder is on the python search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Dynamically inject mock packages into sys.modules to bypass Windows-Python 3.14 build errors.
# This allows running RLS boundary tests, database models, and cryptography algorithms without compiling heavy libraries.

class MockDataFrame:
    def __init__(self, data=None, *args, **kwargs):
        self.data = data or []
        self.columns = ["title_length", "has_number", "link_depth", "is_external", "engagement_target"]
    def fillna(self, *args, **kwargs):
        return self
    def astype(self, *args, **kwargs):
        return self
    def to_dict(self, *args, **kwargs):
        return self.data
    def drop(self, *args, **kwargs):
        return self
    @property
    def min(self):
        return lambda: 0
    @property
    def max(self):
        return lambda: 1

# Mock Pandas
mock_pandas = MagicMock()
mock_pandas.DataFrame = MockDataFrame
sys.modules['pandas'] = mock_pandas

# Mock BeautifulSoup
mock_bs4 = MagicMock()
mock_soup = MagicMock()
mock_soup.find_all.return_value = []
mock_bs4.BeautifulSoup = MagicMock(return_value=mock_soup)
sys.modules['bs4'] = mock_bs4

# Mock NumPy
mock_np = MagicMock()
mock_np.sqrt = lambda x: x ** 0.5
mock_np.random.default_rng = MagicMock()
sys.modules['numpy'] = mock_np

# Mock Scikit-Learn
mock_sklearn = MagicMock()
sys.modules['sklearn'] = mock_sklearn
sys.modules['sklearn.model_selection'] = MagicMock()
sys.modules['sklearn.ensemble'] = MagicMock()
sys.modules['sklearn.metrics'] = MagicMock()

# Mock XGBoost
mock_xgb = MagicMock()
sys.modules['xgboost'] = mock_xgb
