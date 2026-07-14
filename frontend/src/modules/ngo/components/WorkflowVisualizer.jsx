export default function WorkflowVisualizer({ workflow }) {
  if (!workflow) {
    return (
      <div className="card shadow-sm border-0">
        <div className="skeleton skeleton-title mb-4" />
        <div className="skeleton" style={{ height: "120px" }} />
      </div>
    );
  }

  const stageIcons = {
    Campaign: "📋",
    Beneficiaries: "👥",
    "Wallet Allocation": "💳",
    Spending: "💰",
    "Proof Upload": "📸",
    "AI Validation": "🤖",
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="row-between mb-4">
        <h2 className="text-lg font-bold text-[var(--color-ink)]">Workflow Status</h2>
        {workflow.pendingActions > 0 && (
          <span className="px-3 py-1 bg-[var(--color-signal-light)] text-[var(--color-signal-dark)] text-[11px] font-bold rounded-full">
            {workflow.pendingActions} Pending Actions
          </span>
        )}
      </div>

      {workflow.stages && workflow.stages.length > 0 ? (
        <div className="space-y-3">
          {workflow.stages.map((stage, index) => (
            <div key={stage.name} className="relative">
              <div className="flex items-center gap-3 p-3 bg-[var(--color-paper-alt)] rounded-lg hover:bg-[var(--color-paper-alt)] transition-colors">
                <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm text-xl">
                  {stageIcons[stage.name] || "📦"}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-[13px] font-bold text-[var(--color-ink)]">
                      {stage.name}
                    </div>
                    {stage.errors > 0 && (
                      <span className="px-2 py-0.5 bg-[var(--color-alert-light)] text-[var(--color-alert-dark)] text-[9px] font-bold uppercase rounded">
                        {stage.errors} Errors
                      </span>
                    )}
                    {stage.delays > 0 && (
                      <span className="px-2 py-0.5 bg-[var(--color-signal-light)] text-[var(--color-signal-dark)] text-[9px] font-bold uppercase rounded">
                        {stage.delays} Delays
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[var(--color-steel)]">
                    {stage.count} entities
                    {stage.avgProcessingTime > 0 &&
                      ` • Avg: ${stage.avgProcessingTime}s`}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {stage.count}
                  </div>
                </div>
              </div>

              {index < workflow.stages.length - 1 && (
                <div className="flex justify-center my-1">
                  <div className="text-[var(--color-steel)] text-xl">↓</div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center bg-[var(--color-paper-alt)] rounded-lg">
          <span className="text-3xl block mb-2">🔄</span>
          <p className="text-sm font-bold text-[var(--color-steel)]">
            No workflow data available
          </p>
          <p className="text-xs text-[var(--color-steel)] mt-1">
            Create campaigns to see workflow stages
          </p>
        </div>
      )}
    </div>
  );
}
