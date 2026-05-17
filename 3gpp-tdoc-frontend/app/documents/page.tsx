import { getDocuments } from "@/lib/api";
import AgendaGroupedDocuments from "@/components/AgendaGroupedDocuments";

type DocumentItem = {
  id: number;
  tdoc_id?: string | null;
  title?: string | null;
  source?: string | null;
  doc_role?: string | null;
  agenda?: string | null;
  agenda_item?: string | null;
  agenda_item_desc?: string | null;
  release?: string | null;
  spec?: string | null;
  is_cr?: boolean;
  tdoc_url?: string | null;
};

export default async function DocumentsPage() {
  const documents: DocumentItem[] = await getDocuments();
  return <AgendaGroupedDocuments documents={documents} />;
}