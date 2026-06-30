'use client'
// Phân tích tư duy bảo mật sau khi hoàn thành mission; ẩn nếu mission chưa có debrief
export default function DebriefPanel({ debrief }) {
  if (!debrief || debrief.length === 0) return null;

  return (
    <div className="text-left border border-term-border rounded-md bg-gray-950/60 p-3">
      <h4 className="text-indigo-400 font-semibold text-sm">🧠 Phân tích — Tư duy kỹ sư bảo mật</h4>
      <ul className="mt-2 space-y-1.5">
        {debrief.map((point, i) => (
          <li key={i} className="text-gray-300 text-xs leading-relaxed flex gap-2">
            <span className="text-indigo-400 select-none">▸</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
