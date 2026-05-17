import os
import requests

MODEL_SERVICE_URL = os.getenv("MODEL_SERVICE_URL", "http://127.0.0.1:9000")


def call_summary_model(metadata: dict, text: str) -> str:
    url = f"{MODEL_SERVICE_URL}/summarize"
    payload = {
        "metadata": metadata,
        "text": text,
    }

    response = requests.post(
        url,
        json=payload,
        timeout=180,
    )
    response.raise_for_status()

    data = response.json()
    if "summary_text" not in data:
        raise ValueError(f"模型服务返回格式异常：{data}")

    return data["summary_text"]


def call_company_comparison_model(metadata: dict, text: str) -> str:
    url = f"{MODEL_SERVICE_URL}/compare-company"
    payload = {
        "metadata": metadata,
        "text": text,
    }

    response = requests.post(
        url,
        json=payload,
        timeout=(10, 420),
    )
    response.raise_for_status()

    data = response.json()
    if "comparison_text" not in data:
        raise ValueError(f"模型服务返回格式异常：{data}")

    return data["comparison_text"]