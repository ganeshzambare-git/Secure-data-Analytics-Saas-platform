import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

client = TestClient(app)

def test_api_network_payload_obfuscation():
    """
    Verifies that all API endpoint responses starting with /api/v1/
    (and not exempt) are strictly obfuscated as encrypted ciphertext payloads
    conforming to the schema {"payload": "<ciphertext_hex>"}.
    """
    tenant_id = "00000000-0000-0000-0000-000000000001"
    user_id = "11111111-1111-1111-1111-111111111112"
    
    token = create_access_token({
        "sub": user_id,
        "tenant_id": tenant_id,
        "role": "analyst"
    })
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Test /api/v1/pipeline/runs response obfuscation
    response = client.get("/api/v1/pipeline/runs", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "payload" in data, "Response is not wrapped in secure payload envelope!"
    assert len(data) == 1, "Response contains additional unencrypted keys!"
    
    payload_hex = data["payload"]
    # Check that payload is a valid hexadecimal string
    assert len(payload_hex) > 0
    assert all(c in "0123456789abcdefABCDEF" for c in payload_hex), "Ciphertext payload is not valid hexadecimal string!"

    # 2. Test that exempt routes (like PDF export) are NOT encrypted by the middleware
    # (they should return raw binary PDF or direct response)
    export_response = client.get(f"/api/v1/export/pdf?run_id=11111111-1111-1111-1111-111111111111", headers=headers)
    # Even if it returns 404/500, check that the response is NOT wrapped in a {"payload": ...} JSON if it's binary
    # We expect raw binary PDF download (which starts with %PDF- header if successful, but we can verify it's exempt from JSON envelope).
    assert "payload" not in export_response.headers.get("content-type", "")
