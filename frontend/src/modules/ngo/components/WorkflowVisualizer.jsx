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
        <h2 className="text-lg font-bold text-slate-800">Workflow Status</h2>
        {workflow.pendingActions > 0 && (
          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-[11px] font-bold rounded-full">
            {workflow.pendingActions} Pending Actions
          </span>
        )}
      </div>

      {workflow.stages && workflow.stages.length > 0 ? (
        <div className="space-y-3">
          {workflow.stages.map((stage, index) => (
            <div key={stage.name} className="relative">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm text-xl">
                  {stageIcons[stage.name] || "📦"}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-[13px] font-bold text-slate-800">
                      {stage.name}
                    </div>
                    {stage.errors > 0 && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold uppercase rounded">
                        {stage.errors} Errors
                      </span>
                    )}
                    {stage.delays > 0 && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-bold uppercase rounded">
                        {stage.delays} Delays
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500">
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
                  <div className="text-slate-300 text-xl">↓</div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center bg-slate-50 rounded-lg">
          <span className="text-3xl block mb-2">🔄</span>
          <p className="text-sm font-bold text-slate-600">
            No workflow data available
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Create campaigns to see workflow stages
          </p>
        </div>
      )}
    </div>
  );
}
