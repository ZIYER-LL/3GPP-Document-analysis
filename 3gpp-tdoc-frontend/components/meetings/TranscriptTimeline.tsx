import type { MeetingTranscriptSegment } from "@/lib/api/meetings";

interface TranscriptTimelineProps {
  segments: MeetingTranscriptSegment[];
}

function formatMs(ms: number) {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
    s,
  ).padStart(2, "0")}`;
}

export default function TranscriptTimeline({
  segments,
}: TranscriptTimelineProps) {
  if (!segments || segments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-sm text-gray-500 shadow-sm">
        当前还没有转写内容。你可以先点击右侧的“开始转写”。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {segments.map((segment) => (
        <div
          key={segment.id}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">
              {segment.speaker_name || segment.speaker_label || "Speaker"}
            </span>
            <span className="font-mono">
              {formatMs(segment.start_ms)} - {formatMs(segment.end_ms)}
            </span>
          </div>

          <div className="whitespace-pre-wrap text-[15px] leading-8 text-gray-900">
            {segment.text}
          </div>
        </div>
      ))}
    </div>
  );
}