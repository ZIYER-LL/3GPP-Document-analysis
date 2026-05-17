def classify_record(record: dict) -> dict:
    title = (record.get("title") or "").lower()
    type_raw = (record.get("type_raw") or "").lower()

    doc_role = "other"
    confidence = "medium"
    is_cr = False

    if "agenda" in title or type_raw == "agenda":
        doc_role = "agenda"
        confidence = "high"
    elif "draft report" in title:
        doc_role = "draft_report"
        confidence = "high"
    elif "status report" in title:
        doc_role = "status_report"
        confidence = "high"
    elif "ls" in type_raw:
        doc_role = "liaison"
        confidence = "high"
    elif record.get("cr") or record.get("cr_rev"):
        doc_role = "cr"
        is_cr = True
        confidence = "high"

    if record.get("cr") or record.get("cr_rev"):
        is_cr = True

    record["doc_role"] = doc_role
    record["is_cr"] = is_cr
    record["confidence"] = confidence
    return record