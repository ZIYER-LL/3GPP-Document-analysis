import os
import threading

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


def _run_chat(messages: list[dict], max_new_tokens: int = 600) -> str:
    model, tokenizer = get_local_llm()

    text_input = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )

    model_inputs = tokenizer([text_input], return_tensors="pt").to(model.device)

    with torch.no_grad():
        generated_ids = model.generate(
            **model_inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False,
        )

    output_ids = generated_ids[0][len(model_inputs.input_ids[0]) :]
    content = tokenizer.decode(output_ids, skip_special_tokens=True).strip()
    return content


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

    return _run_chat(messages, max_new_tokens=int(os.getenv("LLM_MAX_NEW_TOKENS", "300")))


def build_company_comparison_prompt(metadata: dict, text: str) -> str:
    trimmed_text = text[:18000]

    return f"""
你是一名熟悉 3GPP 会议文稿和标准化讨论的分析助手。请你基于下面同一 Agenda 下多篇文稿的摘要信息，
重点分析不同公司/来源之间的观点差异、共识、潜在冲突与各自关注点。

任务背景：
- Meeting List: {metadata.get("meeting_list") or ""}
- Agenda Item: {metadata.get("agenda_item") or ""}
- 对比目标: 不同公司/来源在同一议题上的观点差异
- 文稿数量: {metadata.get("document_count") or ""}

请用中文输出，结构尽量简洁，控制在 5 个小节以内：

1. 总体结论
2. 各来源/公司核心观点
3. 主要差异点
4. 潜在共识与冲突
5. 最值得关注的文稿

要求：
- 尽量精炼
- 不要重复输入中的原句
- 优先提炼差异，而不是展开长篇解释

要求：
1. 输出中文
2. 不要只机械重复摘要
3. 要做真正的横向比较
4. 如果输入里的“来源”不像公司名，也要基于现有来源标签做最合理分析
5. 不要编造没有出现过的公司或观点

输入材料：
{trimmed_text}
""".strip()


def synthesize_company_comparison(metadata: dict, text: str) -> str:
    prompt = build_company_comparison_prompt(metadata, text)

    messages = [
        {
            "role": "system",
            "content": "你是一个擅长比较 3GPP 多篇文稿立场差异的分析助手，尤其关注不同公司/来源的观点差别、共识和潜在冲突。",
        },
        {
            "role": "user",
            "content": prompt,
        },
    ]

    return _run_chat(
        messages,
        max_new_tokens=int(os.getenv("LLM_COMPARE_MAX_NEW_TOKENS", "300")),
    )

def build_meeting_summary_prompt(metadata: dict, transcript: str) -> str:
    trimmed_text = (transcript or "")[:18000]

    return f"""
你是一名会议纪要助手，请基于下面的会议转写内容生成一份中文会议纪要。

要求：
1. 输出使用中文
2. 按下面结构输出：
   一、会议摘要
   二、关键结论
   三、待办事项
   四、风险与争议点
3. 如果转写内容不足，就谨慎概括，不要编造
4. 待办事项尽量写成“谁需要做什么”，若看不出负责人可写“待明确负责人”
5. 输出直接给纪要正文，不要加额外解释

会议元数据：
- 标题: {metadata.get("title") or ""}
- 语言: {metadata.get("language") or ""}
- 时长（秒）: {metadata.get("duration_seconds") or ""}
- 来源类型: {metadata.get("source_type") or ""}

会议转写：
{trimmed_text}
""".strip()


def summarize_meeting_transcript(metadata: dict, transcript: str) -> str:
    prompt = build_meeting_summary_prompt(metadata, transcript)

    messages = [
        {
            "role": "system",
            "content": "你是一个专业的中文会议纪要助手，擅长从会议转写中提炼摘要、结论、行动项和风险点。",
        },
        {
            "role": "user",
            "content": prompt,
        },
    ]

    return _run_chat(
        messages,
        max_new_tokens=int(os.getenv("LLM_MEETING_MAX_NEW_TOKENS", "700")),
    )