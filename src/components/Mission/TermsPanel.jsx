'use client'
// Thuật ngữ kèm giải thích tiếng Việt cho mission; ẩn nếu mission chưa có terms
export default function TermsPanel({ terms }) {
  if (!terms || terms.length === 0) return null;

  return (
    <div className="border border-term-border rounded-md bg-gray-950/60 p-3">
      <h4 className="text-gray-500 text-xs uppercase tracking-wide">📚 Thuật ngữ</h4>
      <dl className="mt-2 space-y-2">
        {terms.map((item, i) => (
          <div key={i}>
            <dt className="text-indigo-400 font-mono text-xs font-semibold">{item.term}</dt>
            <dd className="text-gray-400 text-xs leading-relaxed">{item.def}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
