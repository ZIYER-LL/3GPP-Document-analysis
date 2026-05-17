import { getDocument } from "@/lib/api";
import DocumentSummaryPanel from "@/components/DocumentSummaryPanel";

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return "获取文稿详情失败";
  }
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let doc: any = null;
  let errorMessage = "";

  try {
    doc = await getDocumentById(id);
  } catch (error) {
    errorMessage = errorToMessage(error);
  }

  if (errorMessage) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">文稿详情</h1>
        <div className="rounded-xl border bg-red-50 p-6 text-red-700">
          <pre className="whitespace-pre-wrap text-sm">{errorMessage}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{doc.tdoc_id || "文稿详情"}</h1>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="标题" value={doc.title} />
          <Field label="来源" value={doc.source} />
          <Field label="联系人" value={doc.contact} />
          <Field label="文稿类型" value={doc.doc_role} />
          <Field label="Release" value={doc.release} />
          <Field label="Spec" value={doc.spec} />
          <Field label="Version" value={doc.version} />
          <Field label="CR" value={doc.cr} />
          <Field label="CR Rev" value={doc.cr_rev} />
          <Field label="Agenda" value={doc.agenda} />
          <Field label="Agenda Item" value={doc.agenda_item} />
          <Field label="状态" value={doc.tdoc_status} />
        </div>

        <div className="mt-6 space-y-4">
          <Block label="摘要" value={doc.abstract} />
          <Block label="Agenda Item Description" value={doc.agenda_item_desc} />
          <Block label="Related WI" value={doc.related_wi} />
        </div>

        {doc.tdoc_url && (
          <a
            href={doc.tdoc_url}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-block rounded-lg bg-black px-4 py-2 text-white"
          >
            打开原始文稿链接
          </a>
        )}
      </div>

      <DocumentSummaryPanel
        docId={doc.id}
        initialSummary={doc.summary_text}
        initialStatus={doc.summary_status}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="font-medium">{value || "-"}</div>
    </div>
  );
}

function Block({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="mb-1 text-sm text-gray-500">{label}</div>
      <div className="rounded-lg bg-gray-50 p-3 text-sm">{value || "-"}</div>
    </div>
  );
}