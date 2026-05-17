export type JobStatus =
  | "pending"
  | "queued"
  | "planning"
  | "processing"
  | "done"
  | "failed";

export type StepStatus =
  | "pending"
  | "queued"
  | "processing"
  | "done"
  | "failed"
  | "skipped";

export type ChatRole = "user" | "assistant" | "system";
export type ReportFormat = "md" | "docx";

export interface ParsedTask {
  task_type: string;
  meeting_list?: string;
  agenda_item?: string | number;
  [key: string]: unknown;
}

export interface AgentExecuteRequest {
  message: string;
}

export interface AgentExecuteResponse {
  job_id: number;
  status: JobStatus;
  parsed_task?: ParsedTask;
  message?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt?: string;
  jobId?: number;
  parsedTask?: ParsedTask;
  status?: JobStatus;
}

export interface JobLogEntry {
  message: string;
  level?: "info" | "warning" | "error";
  created_at?: string;
}

export interface JobItem {
  id: number;
  job_id?: number;
  document_id?: number | null;
  tdoc_id?: string | null;
  title: string;
  agenda_item?: string | number | null;
  order_index?: number | null;
  status: JobStatus;
  download_status?: StepStatus;
  extract_status?: StepStatus;
  summary_status?: StepStatus;
  summary_text?: string | null;
  report_md_path?: string | null;
  report_docx_path?: string | null;
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface JobDetail {
  id: number;
  user_prompt: string;
  task_type?: string;
  source_file_id?: number | null;
  source_meeting_name?: string | null;
  target_agenda_item?: string | number | null;
  status: JobStatus;
  progress: number;
  total_items?: number;
  completed_items?: number;
  failed_items?: number;
  final_report_md?: string | null;
  final_report_docx_path?: string | null;
  error_message?: string | null;
  parsed_task?: ParsedTask;
  logs?: Array<JobLogEntry | string>;
  items?: JobItem[];
  created_at?: string;
  updated_at?: string;
}