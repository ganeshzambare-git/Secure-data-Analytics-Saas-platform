import json
import uuid
import numpy as np
import pandas as pd

try:
    from sklearn.model_selection import train_test_split
    from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
    from sklearn.linear_model import LinearRegression, LogisticRegression
    from sklearn.metrics import accuracy_score, mean_squared_error, r2_score
except ImportError:
    train_test_split = RandomForestRegressor = RandomForestClassifier = None
    LinearRegression = LogisticRegression = None
    accuracy_score = mean_squared_error = r2_score = None

try:
    import xgboost as xgb
except ImportError:
    xgb = None

from app.models import PipelineRun, SystemAuditLog
from app.core.security import decrypt_payload

def train_model(
    db, 
    tenant_id: str, 
    user_id: str, 
    run_id: str, 
    model_type: str, 
    feature_columns: list, 
    test_size: float
) -> dict:
    """
    Predictive Analytics & Modeling Controller.
    Computes absolute accuracy metrics and RMSE, caching in run record.
    """
    run_id_uuid = uuid.UUID(run_id) if isinstance(run_id, str) else run_id
    run = db.query(PipelineRun).filter_by(id=run_id_uuid).first()
    if not run or not run.encrypted_dataset_payload:
        raise ValueError("Pipeline run dataset is empty or invalid.")
        
    # Decrypt in memory
    encrypted_str = run.encrypted_dataset_payload.decode('utf-8')
    decrypted_json = decrypt_payload(encrypted_str)
    records = json.loads(decrypted_json)
    
    df = pd.DataFrame(records)
    
    # Check that required columns exist
    if "engagement_target" not in df.columns:
        raise ValueError("Target column 'engagement_target' missing from dataset.")
        
    # Enforce schema target and features selection
    available_features = [col for col in feature_columns if col in df.columns]
    if not available_features:
        raise ValueError("None of the selected features are present in the dataset.")
        
    X = df[available_features]
    y = df["engagement_target"]
    
    # Split train/test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42
    )
    
    accuracy = 0.0
    rmse = 0.0
    model_name = ""
    
    is_classification = "classifier" in model_type.lower() or model_type == "logistic"
    
    if is_classification:
        # Binarize targets for classification
        threshold = y_train.median()
        y_train_bin = (y_train > threshold).astype(int)
        y_test_bin = (y_test > threshold).astype(int)
        
        if "xgboost" in model_type.lower():
            if xgb is not None:
                model = xgb.XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42)
                model.fit(X_train, y_train_bin)
                preds = model.predict(X_test)
                prob_preds = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else preds
                accuracy = accuracy_score(y_test_bin, preds)
                rmse = np.sqrt(mean_squared_error(y_test_bin, prob_preds))
            else:
                raise ImportError("XGBoost is not installed on this system.")
            model_name = "XGBoost Classifier"
        elif "linear" in model_type.lower() or model_type == "logistic":
            model = LogisticRegression(random_state=42)
            model.fit(X_train, y_train_bin)
            preds = model.predict(X_test)
            prob_preds = model.predict_proba(X_test)[:, 1]
            accuracy = accuracy_score(y_test_bin, preds)
            rmse = np.sqrt(mean_squared_error(y_test_bin, prob_preds))
            model_name = "Scikit-Learn Logistic Regression Classifier"
        else: # sklearn_rf_classifier or default
            model = RandomForestClassifier(n_estimators=100, random_state=42)
            model.fit(X_train, y_train_bin)
            preds = model.predict(X_test)
            prob_preds = model.predict_proba(X_test)[:, 1]
            accuracy = accuracy_score(y_test_bin, preds)
            rmse = np.sqrt(mean_squared_error(y_test_bin, prob_preds))
            model_name = "Scikit-Learn Random Forest Classifier"
    else:
        # Regression
        if "xgboost" in model_type.lower():
            if xgb is not None:
                model = xgb.XGBRegressor(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42)
                model.fit(X_train, y_train)
                preds = model.predict(X_test)
                accuracy = r2_score(y_test, preds)
                rmse = np.sqrt(mean_squared_error(y_test, preds))
            else:
                raise ImportError("XGBoost is not installed on this system.")
            model_name = "XGBoost Regressor"
        elif "linear" in model_type.lower():
            model = LinearRegression()
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            accuracy = r2_score(y_test, preds)
            rmse = np.sqrt(mean_squared_error(y_test, preds))
            model_name = "Scikit-Learn Linear Regression"
        else: # sklearn_rf_regressor or default
            model = RandomForestRegressor(n_estimators=100, random_state=42)
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            accuracy = r2_score(y_test, preds)
            rmse = np.sqrt(mean_squared_error(y_test, preds))
            model_name = "Scikit-Learn Random Forest Regressor"
            
    # Cache metrics in database run record
    metrics_update = {
        "rows_scraped": len(df),
        "columns_processed": len(df.columns),
        "model_name": model_name,
        "split_ratio": float(1.0 - test_size),
        "accuracy": float(accuracy),
        "rmse": float(rmse),
        "status": "Model training complete"
    }
    
    run.metrics = metrics_update
    run.status = "ML_Trained"
    db.add(run)
    db.commit()
    
    # Audit log
    audit = SystemAuditLog(
        tenant_id=uuid.UUID(tenant_id),
        user_id=uuid.UUID(user_id),
        action_performed=f"Trained model ({model_name}) on Run ID: {run_id} using features {available_features}",
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()
    
    return metrics_update
