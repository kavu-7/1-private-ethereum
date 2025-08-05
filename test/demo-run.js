const {
    HealthInsureChain
} = require('../src/HealthInsureChain');

const runDemo = () => {
    const chain = new HealthInsureChain();

    chain.addPolicy({
        policyId: 'POL001',
        patientId: 'PAT001',
        insuranceCompany: 'HealthSecure Inc.',
        coverage: 75000,
        premium: 500,
        conditions: ['None']
    });

    const claim = chain.submitClaim({
        claimId: 'CLM001',
        policyId: 'POL001',
        patientId: 'PAT001',
        hospitalId: 'HOS001',
        diagnosis: 'Appendectomy',
        treatmentCost: 15000,
        documents: [
            { type: 'medical_report', hash: 'med_report_hash_123' },
            { type: 'bills', hash: 'bills_hash_456' },
            { type: 'prescription', hash: 'prescription_hash_789' }
        ]
    });

    if (claim) {
        chain.storeLargeClaim(claim);
    }

    chain.shareDataBetweenOrgs('HOSPITAL_ORG', 'INSURANCE_ORG', 'CLAIM_DATA', 'claim_hash_abc123');

    const patientRecord = chain.getPatientRecord('PAT001');
    console.log('\nPatient Record:\n', JSON.stringify(patientRecord, null, 2));

    const analytics = chain.getChainAnalytics();
    console.log('\nAnalytics:\n', JSON.stringify(analytics, null, 2));

    console.log('\nIs Blockchain Valid?', chain.isChainValid());
};

runDemo();
