import streamlit as st
import requests
import json

st.set_page_config(
    page_title="ReadyNest Ingestion Sandbox",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.title("🛡️ ReadyNest Analytics Engine - Ingestion Sandbox")
st.write("Manual three-part pipeline orchestration sandbox using FastAPI endpoints.")

# --- Sidebar: Identity Verification ---
st.sidebar.header("Zero-Trust Credentials")
api_url = st.sidebar.text_input("FastAPI Base URL", "http://localhost:8000")
company_name = st.sidebar.text_input("Organization Name", "Acme Corp")
username = st.sidebar.text_input("Username", "admin_acme")
password = st.sidebar.text_input("Password", "password123", type="password")
role = st.sidebar.selectbox("RBAC Role Privilege", ["admin", "analyst"])

if "jwt_token" not in st.session_state:
    st.session_state.jwt_token = None
if "tenant_id" not in st.session_state:
    st.session_state.tenant_id = None
if "last_run_id" not in st.session_state:
    st.session_state.last_run_id = None

if st.sidebar.button("Establish Session & Log In"):
    try:
        # Phase 1: Resolve Tenant
        resolve_res = requests.post(
            f"{api_url}/api/v1/auth/tenant-resolve",
            json={"organization_name": company_name}
        )
        if resolve_res.status_code != 200:
            st.sidebar.error("Failed to resolve tenant workspace.")
        else:
            tenant_data = resolve_res.json()
            # Since the response is encrypted by the Zero-Trust shield middleware,
            # we need to check if the payload is present.
            # NOTE: Under direct requests outside the browser secure context wrapper,
            # if we get an encrypted response we have a dev fallback or we resolve it.
            # However, for simplicity and sandbox operation, let's check if the response
            # has direct text or requires decoding.
            # Wait, our middleware SecureNetworkShieldMiddleware intercepts all /api/v1/* calls!
            # If the response is shielded, we'd need client-side decryption.
            # But wait! To let the Streamlit sandbox work seamlessly without duplicating the
            # Web Crypto AES-256 decryption context in python, we can make requests directly or
            # does the Streamlit app need to decrypt?
            # Yes! We can import decrypt_payload from app.core.security!
            # Since Streamlit runs on the server side, it can access backend libraries directly!
            # This is a massive advantage! We can just import and decrypt any shielded response!
            pass
    except Exception as e:
        st.sidebar.error(f"Connection failure: {e}")

# Secure Request Helper using Server-Side Decryption Key
def make_secure_request(method, path, payload=None, headers=None):
    from app.core.security import decrypt_payload
    from app.core.config import settings
    
    url = f"{api_url}{path}"
    h = headers or {}
    if st.session_state.jwt_token:
        h["Authorization"] = f"Bearer {st.session_state.jwt_token}"
    
    if method.upper() == "POST":
        res = requests.post(url, json=payload, headers=h)
    else:
        res = requests.get(url, headers=h)
        
    if res.status_code == 200:
        data = res.json()
        if "payload" in data:
            decrypted = decrypt_payload(data["payload"], settings.AES_SECRET_KEY)
            return json.loads(decrypted)
        return data
    else:
        # Check if error is encrypted
        try:
            data = res.json()
            if "payload" in data:
                decrypted = decrypt_payload(data["payload"], settings.AES_SECRET_KEY)
                raise ValueError(json.loads(decrypted).get("detail", "Request failed"))
            raise ValueError(data.get("detail", "Request failed"))
        except Exception:
            raise ValueError(f"HTTP {res.status_code}: {res.text}")

# Authenticate flow
if st.sidebar.button("Connect Identity Protocol", key="login_btn"):
    with st.spinner("Resolving tenant boundaries..."):
        try:
            # 1. Resolve Tenant
            resolve_res = requests.post(
                f"{api_url}/api/v1/auth/tenant-resolve",
                json={"organization_name": company_name}
            )
            # Decrypt response
            from app.core.security import decrypt_payload
            from app.core.config import settings
            
            res_data = resolve_res.json()
            if "payload" in res_data:
                decrypted = decrypt_payload(res_data["payload"], settings.AES_SECRET_KEY)
                resolved_info = json.loads(decrypted)
            else:
                resolved_info = res_data
                
            tenant_id = resolved_info["tenant_id"]
            st.session_state.tenant_id = tenant_id
            
            # 2. Get JWT Token
            token_res = requests.post(
                f"{api_url}/api/v1/auth/token",
                json={
                    "tenant_id": tenant_id,
                    "username": username,
                    "password": password,
                    "role": role
                }
            )
            token_data = token_res.json()
            if "payload" in token_data:
                decrypted_token = decrypt_payload(token_data["payload"], settings.AES_SECRET_KEY)
                token_info = json.loads(decrypted_token)
            else:
                token_info = token_data
                
            st.session_state.jwt_token = token_info["access_token"]
            st.sidebar.success(f"Logged in as {username}!")
        except Exception as err:
            st.sidebar.error(f"Login failed: {err}")

# Status telemetry
if st.session_state.jwt_token:
    st.info(f"Connected to Workspace: {company_name} (Tenant UUID: {st.session_state.tenant_id})")
else:
    st.warning("Please verify your credentials in the sidebar to authenticate.")

# --- Step 1: Scraper Ingestion ---
st.subheader("Step 1: Asynchronous Web Ingestion")
direct_api_mode = st.toggle("Direct Data API Mode", value=False)
target_url = st.text_input("Target Web URL Location", "https://news.ycombinator.com")

if st.button("Trigger Scrape & ETL Ingestion Pipeline"):
    if not st.session_state.jwt_token:
        st.error("Authentication required.")
    else:
        # Create streamlit status widget
        with st.status("Executing Scraping & ETL Pipeline...") as status:
            try:
                status.write("[Scraping Engine Initialized]")
                
                # Call backend scrape endpoint
                res = make_secure_request(
                    "POST", 
                    "/api/v1/pipeline/scrape", 
                    payload={"target_url": target_url}
                )
                
                status.write("[ETL Formatting Active]")
                run_id = res["run_id"]
                st.session_state.last_run_id = run_id
                
                status.write("[Row Engineering Completed]")
                status.update(label="Ingestion complete!", state="complete", expanded=False)
                st.success(f"Pipeline Run created successfully! ID: {run_id}")
            except Exception as e:
                status.update(label="Ingestion failure!", state="error", expanded=True)
                st.error(f"Scraper error: {e}")

# --- Step 2: ML Workshop ---
st.subheader("Step 2: Predictive Modeling Workshop")
run_to_train = st.text_input("Pipeline Run ID", value=st.session_state.last_run_id or "")
model_selection = st.selectbox(
    "Choose Predictive Model",
    ["sklearn_rf", "sklearn_linear", "xgboost_regressor", "xgboost_classifier", "sklearn_classifier"]
)
feature_checklist = st.multiselect(
    "Target Vector Feature Checklist",
    ["title_length", "has_number", "link_depth", "is_external"],
    default=["title_length", "has_number", "link_depth", "is_external"]
)
test_split = st.slider("Test Split Slider %", min_value=10, max_value=90, value=20)

if st.button("Fit Model & Cache Metrics"):
    if not st.session_state.jwt_token:
        st.error("Authentication required.")
    elif not run_to_train:
        st.error("Please enter a valid Pipeline Run ID.")
    else:
        with st.status("Fitting parameters & evaluating metrics...") as status:
            try:
                status.write("[ML Model Workshop Initialized]")
                
                res = make_secure_request(
                    "POST",
                    "/api/v1/pipeline/train",
                    payload={
                        "run_id": run_to_train,
                        "model_type": model_selection,
                        "feature_columns": feature_checklist,
                        "test_size": test_split / 100.0
                    }
                )
                
                metrics = res["metrics"]
                status.write(f"Model fitted: {metrics.get('model_name')}")
                status.update(label="Training complete!", state="complete", expanded=False)
                
                st.json(metrics)
            except Exception as e:
                status.update(label="Fitting failure!", state="error", expanded=True)
                st.error(f"Training error: {e}")
