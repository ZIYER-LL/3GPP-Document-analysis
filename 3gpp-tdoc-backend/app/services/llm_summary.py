import os
import threading
from typing import Optional

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

_model = None
_tokenizer = None
_model_lock = threading.Lock()


def get_model_name() -> str:
    return os.getenv("LLM_MODEL", "Qwen/Qwen3-4B-Instruct-2507")


def get_local_llm():
    global _model, _tokenizer

    if _model is not None and _tokenizer is not None:
        return _model, _tokenizer

    with _model_lock:
        if _model is None or _tokenizer is None:
            model_name = get_model_name()

            _tokenizer = AutoTokenizer.from_pretrained(model_name)
            _model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype="auto",
                device_map="auto",
            )

    return _model, _tokenizer


def build_summary_prompt(metadata: dict, text: str) -> str:
    trimmed_text = text[:12000]

    return f"""
请你作为一名熟悉 3GPP 文稿风格的分析助手，阅读下面的文稿信息与正文，并生成一段中文摘要。

要求：
1. 用中文写一段 150-300 字的自然语言摘要
2. 说明这篇文稿主要讨论什么、提出了什么、可能影响什么
3. 避免空话，不要逐句重复标题
4. 如果信息不足，只基于已有内容谨慎概括，不要编造
5. 输出只要摘要正文，不要加“摘要：”等标题

文稿元数据：
- TDoc: {metadata.get("tdoc_id") or ""}
- 标题: {metadata.get("title") or ""}
- 来源: {metadata.get("source") or ""}
- Agenda Item: {metadata.get("agenda_item") or ""}
- Spec: {metadata.get("spec") or ""}
- Release: {metadata.get("release") or ""}

正文：
{trimmed_text}
""".strip()


def summarize_document(metadata: dict, text: str) -> str:
    model, tokenizer = get_local_llm()
    prompt = build_summary_prompt(metadata, text)

    messages = [
        {
            "role": "system",
            "content": "你是一个3GPP行业文稿分析助手，擅长把技术文稿概括成简洁、准确、专业的中文摘要。",
        },
        {
            "role": "user",
            "content": prompt,
        },
    ]

    text_input = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )

    model_inputs = tokenizer([text_input], return_tensors="pt").to(model.device)

    max_new_tokens = int(os.getenv("LLM_MAX_NEW_TOKENS", "300"))

    with torch.no_grad():
        generated_ids = model.generate(
            **model_inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False,
        )

    output_ids = generated_ids[0][len(model_inputs.input_ids[0]) :]
    content = tokenizer.decode(output_ids, skip_special_tokens=True).strip()
    return content