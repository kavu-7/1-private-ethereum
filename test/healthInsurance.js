


const SHA256 = require('crypto-js/sha256');


class HealthBlock {
    constructor(index, timestamp, data, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data; 
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
        this.blockType = data.type || 'GENERAL'; 
    }

    calculateHash() {
        return SHA256(
            this.index + 
            this.timestamp + 
            JSON.stringify(this.data) + 
            this.previousHash + 
            this.nonce
        ).toString();
    }

    mineBlock(difficulty) {
        const target = Array(difficulty + 1).join("0");
        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log(`Block mined: ${this.hash}`);
    }
}


class HealthPolicy {
    constructor(policyId, patientId, insuranceCompany, coverage, premium, conditions) {
        this.type = 'POLICY';
        this.policyId = policyId;
        this.patientId = patientId;
        this.insuranceCompany = insuranceCompany;
        this.coverage = coverage; 
        this.premium = premium;
        this.conditions = conditions; 
        this.isActive = true;
        this.createdAt = new Date().toISOString();
        this.policyHash = this.generatePolicyHash();
    }

    generatePolicyHash() {
        return SHA256(this.policyId + this.patientId + this.coverage + this.premium).toString();
    }
}


class HealthClaim {
    constructor(claimId, policyId, patientId, hospitalId, diagnosis, treatmentCost, documents) {
        this.type = 'CLAIM';
        this.claimId = claimId;
        this.policyId = policyId;
        this.patientId = patientId;
        this.hospitalId = hospitalId;
        this.diagnosis = diagnosis;
        this.treatmentCost = treatmentCost;
        this.documents = documents; 
        this.status = 'PENDING'; 
        this.submittedAt = new Date().toISOString();
        this.verificationScore = 0;
    }
}


class HealthToken {
    constructor(name, symbol, totalSupply) {
        this.name = name;
        this.symbol = symbol;
        this.totalSupply = totalSupply;
        this.balances = new Map();
        this.allowances = new Map();
    }

    mint(to, amount) {
        if (!this.balances.has(to)) {
            this.balances.set(to, 0);
        }
        this.balances.set(to, this.balances.get(to) + amount);
        this.totalSupply += amount;
    }

    transfer(from, to, amount) {
        const fromBalance = this.balances.get(from) || 0;
        if (fromBalance >= amount) {
            this.balances.set(from, fromBalance - amount);
            this.balances.set(to, (this.balances.get(to) || 0) + amount);
            return true;
        }
        return false;
    }

    balanceOf(address) {
        return this.balances.get(address) || 0;
    }
}


class ClaimVerificationContract {
    constructor() {
        this.policies = new Map();
        this.claims = new Map();
        this.verificationRules = {
            maxClaimAmount: 100000,
            requiredDocuments: ['medical_report', 'bills', 'prescription'],
            cooldownPeriod: 30 
        };
    }

    addPolicy(policy) {
        this.policies.set(policy.policyId, policy);
        return policy.policyHash;
    }

    submitClaim(claim) {
        
        const policy = this.policies.get(claim.policyId);
        if (!policy || !policy.isActive) {
            claim.status = 'REJECTED';
            claim.rejectionReason = 'Invalid or inactive policy';
            return false;
        }

        
        if (claim.treatmentCost > policy.coverage) {
            claim.status = 'REJECTED';
            claim.rejectionReason = 'Claim amount exceeds coverage';
            return false;
        }

        
        const hasRequiredDocs = this.verificationRules.requiredDocuments.every(doc => 
            claim.documents.some(d => d.type === doc)
        );

        if (!hasRequiredDocs) {
            claim.status = 'REJECTED';
            claim.rejectionReason = 'Missing required documents';
            return false;
        }

        
        claim.verificationScore = this.calculateVerificationScore(claim, policy);

        if (claim.verificationScore >= 80) {
            claim.status = 'APPROVED';
        } else if (claim.verificationScore >= 60) {
            claim.status = 'MANUAL_REVIEW';
        } else {
            claim.status = 'REJECTED';
            claim.rejectionReason = 'Failed automated verification';
        }

        this.claims.set(claim.claimId, claim);
        return true;
    }

    calculateVerificationScore(claim, policy) {
        let score = 50; 

        
        const docScore = (claim.documents.length / this.verificationRules.requiredDocuments.length) * 30;
        score += Math.min(docScore, 30);

        
        const amountRatio = claim.treatmentCost / policy.coverage;
        if (amountRatio <= 0.5) score += 20;
        else if (amountRatio <= 0.8) score += 15;
        else score += 5;

        return Math.min(score, 100);
    }
}


class HealthInsureChain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 4;
        this.pendingTransactions = [];
        this.miningReward = 10;
        
        
        this.smartContract = new ClaimVerificationContract();
        this.loyaltyToken = new HealthToken("HealthCoin", "HC", 1000000);
        this.organizations = new Map(); 
        
        
        this.initializeOrganizations();
    }

    createGenesisBlock() {
        const genesisData = {
            type: 'GENESIS',
            message: 'HealthInsureChain Genesis Block',
            createdBy: 'System'
        };
        return new HealthBlock(0, "2024-01-01", genesisData, "0");
    }

    initializeOrganizations() {
        this.organizations.set('HOSPITAL_ORG', {
            name: 'Hospital Network',
            type: 'HEALTHCARE_PROVIDER',
            permissions: ['SUBMIT_CLAIMS', 'VIEW_POLICIES'],
            publicKey: 'hospital_public_key_hash'
        });

        this.organizations.set('INSURANCE_ORG', {
            name: 'Insurance Company',
            type: 'INSURANCE_PROVIDER', 
            permissions: ['CREATE_POLICIES', 'APPROVE_CLAIMS', 'VIEW_ALL'],
            publicKey: 'insurance_public_key_hash'
        });

        this.organizations.set('PATIENT_ORG', {
            name: 'Patient Portal',
            type: 'PATIENT_ACCESS',
            permissions: ['VIEW_OWN_DATA', 'SUBMIT_DOCUMENTS'],
            publicKey: 'patient_public_key_hash'
        });
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    
    addPolicy(policyData) {
        const policy = new HealthPolicy(
            policyData.policyId,
            policyData.patientId,
            policyData.insuranceCompany,
            policyData.coverage,
            policyData.premium,
            policyData.conditions
        );

        
        const policyHash = this.smartContract.addPolicy(policy);
        
        
        const policyBlock = new HealthBlock(
            this.getLatestBlock().index + 1,
            new Date().toISOString(),
            policy
        );

        policyBlock.previousHash = this.getLatestBlock().hash;
        policyBlock.mineBlock(this.difficulty);
        this.chain.push(policyBlock);

        console.log(`Policy ${policy.policyId} added to blockchain with hash: ${policyHash}`);
        return policyHash;
    }

    
    submitClaim(claimData) {
        const claim = new HealthClaim(
            claimData.claimId,
            claimData.policyId,
            claimData.patientId,
            claimData.hospitalId,
            claimData.diagnosis,
            claimData.treatmentCost,
            claimData.documents
        );

        
        const isValid = this.smartContract.submitClaim(claim);
        
        if (isValid) {
            
            const claimBlock = new HealthBlock(
                this.getLatestBlock().index + 1,
                new Date().toISOString(),
                claim
            );

            claimBlock.previousHash = this.getLatestBlock().hash;
            claimBlock.mineBlock(this.difficulty);
            this.chain.push(claimBlock);

            
            if (claim.status === 'APPROVED') {
                this.rewardLoyaltyTokens(claim.patientId, 100);
            }

            console.log(`Claim ${claim.claimId} processed: ${claim.status}`);
            return claim;
        }

        return null;
    }

    
    rewardLoyaltyTokens(patientId, amount) {
        this.loyaltyToken.mint(patientId, amount);
        
        const rewardData = {
            type: 'REWARD',
            patientId: patientId,
            amount: amount,
            reason: 'Claim approval bonus',
            timestamp: new Date().toISOString()
        };

        const rewardBlock = new HealthBlock(
            this.getLatestBlock().index + 1,
            new Date().toISOString(),
            rewardData
        );

        rewardBlock.previousHash = this.getLatestBlock().hash;
        rewardBlock.mineBlock(this.difficulty);
        this.chain.push(rewardBlock);

        console.log(`Rewarded ${amount} HC tokens to patient ${patientId}`);
    }

    
    storeLargeClaim(claim) {
        if (claim.treatmentCost > 50000) {
            const permanentRecord = {
                claimId: claim.claimId,
                patientId: claim.patientId,
                amount: claim.treatmentCost,
                status: claim.status,
                blockchainHash: this.getLatestBlock().hash,
                storedAt: new Date().toISOString(),
                storage: 'BigchainDB_Simulation'
            };
            
            console.log(`Large claim ${claim.claimId} stored in permanent database:`, permanentRecord);
            return permanentRecord;
        }
        return null;
    }

    
    shareDataBetweenOrgs(fromOrg, toOrg, dataType, dataHash) {
        const fromOrgData = this.organizations.get(fromOrg);
        const toOrgData = this.organizations.get(toOrg);

        if (!fromOrgData || !toOrgData) {
            console.log('Invalid organization');
            return false;
        }

        const sharingRecord = {
            type: 'DATA_SHARING',
            fromOrg: fromOrg,
            toOrg: toOrg,
            dataType: dataType,
            dataHash: dataHash,
            timestamp: new Date().toISOString(),
            authorized: true
        };

        const sharingBlock = new HealthBlock(
            this.getLatestBlock().index + 1,
            new Date().toISOString(),
            sharingRecord
        );

        sharingBlock.previousHash = this.getLatestBlock().hash;
        sharingBlock.mineBlock(this.difficulty);
        this.chain.push(sharingBlock);

        console.log(`Data shared between ${fromOrg} and ${toOrg}`);
        return true;
    }

    
    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                console.log('Invalid hash at block', i);
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                console.log('Invalid previous hash at block', i);
                return false;
            }
        }
        return true;
    }

    
    getPatientRecord(patientId) {
        const patientBlocks = this.chain.filter(block => 
            block.data.patientId === patientId ||
            (block.data.type === 'REWARD' && block.data.patientId === patientId)
        );

        return {
            patientId: patientId,
            policies: patientBlocks.filter(b => b.data.type === 'POLICY'),
            claims: patientBlocks.filter(b => b.data.type === 'CLAIM'),
            rewards: patientBlocks.filter(b => b.data.type === 'REWARD'),
            tokenBalance: this.loyaltyToken.balanceOf(patientId)
        };
    }

    
    getChainAnalytics() {
        const policies = this.chain.filter(b => b.data.type === 'POLICY').length;
        const claims = this.chain.filter(b => b.data.type === 'CLAIM').length;
        const approvedClaims = this.chain.filter(b => 
            b.data.type === 'CLAIM' && b.data.status === 'APPROVED'
        ).length;
        const totalRewards = this.chain.filter(b => b.data.type === 'REWARD')
            .reduce((sum, b) => sum + b.data.amount, 0);

        return {
            totalBlocks: this.chain.length,
            totalPolicies: policies,
            totalClaims: claims,
            approvedClaims: approvedClaims,
            approvalRate: claims > 0 ? (approvedClaims / claims * 100).toFixed(2) + '%' : '0%',
            totalRewardsIssued: totalRewards,
            isChainValid: this.isChainValid()
        };
    }
}


console.log('=== HealthInsureChain Demo ===\n');


const healthChain = new HealthInsureChain();
console.log('HealthInsureChain initialized with genesis block\n');


console.log('1. Adding Health Insurance Policy...');
const policyHash = healthChain.addPolicy({
    policyId: 'POL001',
    patientId: 'PAT001',
    insuranceCompany: 'HealthSecure Inc.',
    coverage: 75000,
    premium: 500,
    conditions: ['None']
});


console.log('\n2. Submitting Insurance Claim...');
const claim = healthChain.submitClaim({
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
    healthChain.storeLargeClaim(claim);
}


console.log('\n3. Sharing data between Hospital and Insurance...');
healthChain.shareDataBetweenOrgs('HOSPITAL_ORG', 'INSURANCE_ORG', 'CLAIM_DATA', 'claim_hash_abc123');


console.log('\n4. Patient Record:');
const patientRecord = healthChain.getPatientRecord('PAT001');
console.log(JSON.stringify(patientRecord, null, 2));


console.log('\n5. Blockchain Analytics:');
const analytics = healthChain.getChainAnalytics();
console.log(JSON.stringify(analytics, null, 2));


console.log('\n6. Blockchain Validation:');
console.log('Is blockchain valid?', healthChain.isChainValid());

console.log('\n=== Demo Complete ===');

module.exports = {
    HealthInsureChain,
    HealthBlock, 
    HealthPolicy,
    HealthClaim,
    HealthToken,
    ClaimVerificationContract
};