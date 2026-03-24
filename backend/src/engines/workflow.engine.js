import { createAuditLog } from "../modules/audit/audit.service.js"
import { createWalletForBeneficiary } from "../modules/wallet/wallet.service.js"
import { runFraudCheck } from "../jobs/fraud.job.js"
import { runAIDecision } from "../jobs/ai.job.js"
import { updateTrustScore } from "../modules/governance/trustScore.service.js"
import { anchorToBlockchain } from "../infrastructure/blockchain/audit.service.js"

class WorkflowEngine {

  async handleDonationCreated(donation) {

    await createAuditLog({
      entityType: "donation",
      entityId: donation.id,
      action: "DONATION_CREATED"
    })

    await runAIDecision({
      type: "donation_risk",
      donationId: donation.id
    })

    return true
  }

  async handleDonationApproved(donation) {

    await createAuditLog({
      entityType: "donation",
      entityId: donation.id,
      action: "DONATION_APPROVED"
    })

    return true
  }

  async handleBeneficiaryVerified(beneficiary) {

    const wallet = await createWalletForBeneficiary({
      beneficiaryId: beneficiary.id,
      campaignId: beneficiary.campaignId
    })

    await createAuditLog({
      entityType: "wallet",
      entityId: wallet.id,
      action: "WALLET_CREATED"
    })

    return wallet
  }

  async handleTransactionCompleted(transaction) {

    await createAuditLog({
      entityType: "transaction",
      entityId: transaction.id,
      action: "TRANSACTION_COMPLETED"
    })

    await runFraudCheck({
      transactionId: transaction.id
    })

    return true
  }

  async handleProofSubmitted(proof) {

    await createAuditLog({
      entityType: "proof",
      entityId: proof.id,
      action: "PROOF_SUBMITTED"
    })

    return true
  }

  async handleProofVerified(proof) {

    await updateTrustScore({
      entityType: "ngo",
      entityId: proof.ngoId,
      delta: +2
    })

    await createAuditLog({
      entityType: "proof",
      entityId: proof.id,
      action: "PROOF_VERIFIED"
    })

    await anchorToBlockchain()

    return true
  }

  async handleFraudDetected(event) {

    await createAuditLog({
      entityType: event.entityType,
      entityId: event.entityId,
      action: "FRAUD_DETECTED"
    })

    return true
  }

}

export default new WorkflowEngine()