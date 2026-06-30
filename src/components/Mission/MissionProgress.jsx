'use client'
// Checklist các bước trong mission, tick khi AI báo step_completed
export default function MissionProgress({ steps, completedSteps }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {steps.map((step) => {
        const done = completedSteps.has(step.id);
        return (
          <li key={step.id} className={`flex items-start gap-2 text-sm ${done ? 'text-green-400' : 'text-gray-400'}`}>
            <span className="shrink-0 whitespace-nowrap">{done ? '[✓]' : '[ ]'}</span>
            <span>{step.description}</span>
          </li>
        );
      })}
    </ul>
  );
}
