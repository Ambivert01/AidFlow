router.post("/beneficiaries", registerBeneficiary);
router.get("/beneficiaries", getBeneficiaries);
router.post("/beneficiaries/:id/decision", ngoDecision);
