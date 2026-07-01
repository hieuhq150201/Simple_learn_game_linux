'use client'

interface TermItem {
  term: string;
  def: string;
}

export default function TermsPanel({ terms }: { terms?: TermItem[] | null }): JSX.Element | null {
  if (!terms || terms.length === 0) return null;

  return (
    <div className="border border-hp-border rounded-md bg-hp-card p-3">
      <h4 className="text-hp-subtle text-xs uppercase tracking-wide">📚 Thuật ngữ</h4>
      <dl className="mt-2 space-y-2">
        {terms.map((item, i) => (
          <div key={i}>
            <dt className="text-indigo-500 dark:text-indigo-400 font-mono text-xs font-semibold">{item.term}</dt>
            <dd className="text-hp-muted text-xs leading-relaxed">{item.def}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
