import re
import logging
import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

def anonymize_text(text: str) -> str:
    """
    Executes strict regex parsing utilities to purge email patterns
    and standard PII patterns immediately upon raw extraction.
    """
    if not text:
        return ""
    # Email regex pattern
    email_pattern = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
    text = email_pattern.sub("[EMAIL_REDACTED]", text)
    
    # Phone number pattern
    phone_pattern = re.compile(r'\+?\b\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b')
    text = phone_pattern.sub("[PHONE_REDACTED]", text)
    
    return text

def scrape_url(target_url: str, config_headers: dict = None) -> dict:
    """
    Scrapes the target URL and extracts links and text while applying anonymization.
    Emits console logs to track process.
    """
    # 1. Emit status log
    print("[Scraping Engine Initialized] Targetting URL: " + target_url)
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    if config_headers:
        headers.update(config_headers)
        
    try:
        response = requests.get(target_url, headers=headers, timeout=10)
    except Exception as e:
        # Handled as normal request failure
        raise ValueError(f"Request failed: {str(e)}")
        
    # 2. Check for 403 Forbidden or other server blocks
    if response.status_code == 403:
        # Halt text prints in red
        print("\033[91mCritical Handshake Interruption: Code 403 (Forbidden)\033[0m")
        raise PermissionError("Critical Handshake Interruption: Code 403 (Forbidden)")
        
    if response.status_code != 200:
        raise ValueError(f"Target server returned status code {response.status_code}")
        
    soup = BeautifulSoup(response.text, "html.parser")
    
    # Scrape elements and run strict Regex anonymizer
    scraped_items = []
    links = soup.find_all("a")
    for link in links[:150]:
        raw_text = link.get_text().strip()
        if not raw_text:
            continue
            
        anonymized_text = anonymize_text(raw_text)
        scraped_items.append({
            "title_length": len(anonymized_text),
            "has_number": any(char.isdigit() for char in anonymized_text),
            "link_depth": link.get("href", "").count("/"),
            "is_external": link.get("href", "").startswith("http"),
            "clean_text": anonymized_text
        })
        
    return {
        "scraped_data": scraped_items,
        "raw_text_length": len(response.text)
    }
