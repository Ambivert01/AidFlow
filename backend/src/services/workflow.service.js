import { WorkflowEngine } from "./workflow.engine.js";
import { PolicyEngine } from "./policy.engine.js";
import { WalletEngine } from "./wallet.engine.js";
import { AuditService } from "./audit.service.js";

import { aiClients } from "./aiDecision.js";

/**
 * Factory to build WorkflowEngine with dependencies
 */
export function createWorkflowEngine() {
  const auditService = new AuditService();
  const policyEngine = new PolicyEngine();
  const walletEngine = new WalletEngine({ auditService });

  return new WorkflowEngine({
    policyEngine,
    walletEngine,
    auditService,
    aiClients,
  });
}
