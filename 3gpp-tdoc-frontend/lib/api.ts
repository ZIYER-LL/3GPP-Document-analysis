const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = "Request failed";
    try {
      const data = await res.json();
      message = data?.detail || data?.message || JSON.stringify(data);
    } catch {
      message = await res.text();
    }
    throw new Error(message);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }

  return (await res.text()) as T;
}

export async function getDocuments() {
  const res = await fetch(`${API_BASE_URL}/documents`, {
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function getDocument(id: number | string) {
  const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
    cache: "no-store",
  });
  return handleResponse(res);
}

export const getDocumentById = getDocument;

export async function analyzeDocument(id: number | string) {
  const res = await fetch(`${API_BASE_URL}/documents/${id}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return handleResponse(res);
}

export async function uploadTdocList(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/import`, {
    method: "POST",
    body: formData,
  });

  return handleResponse(res);
}

export async function getImportJobs() {
  const res = await fetch(`${API_BASE_URL}/import/jobs`, {
    cache: "no-store",
  });
  return handleResponse(res);
}