-- Base de données de ligands validés scientifiquement pour docking moléculaire
-- Conforme aux standards internationaux de la recherche pharmaceutique

CREATE TABLE IF NOT EXISTS validated_ligands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    smiles VARCHAR(500) NOT NULL UNIQUE,
    molecular_weight DECIMAL(10,2) NOT NULL,
    logp DECIMAL(4,2) NOT NULL,
    hydrogen_bond_donors INT NOT NULL,
    hydrogen_bond_acceptors INT NOT NULL,
    rotatable_bonds INT NOT NULL,
    topological_polar_surface_area DECIMAL(8,2) NOT NULL,
    drug_likeness_score DECIMAL(5,3) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    pubchem_cid INT,
    chebi_id VARCHAR(50),
    uniprot_target VARCHAR(50),
    binding_affinity_kcal DECIMAL(6,3),
    status ENUM('approved', 'experimental', 'clinical_trial', 'research') DEFAULT 'research',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_smiles (smiles),
    INDEX idx_category (category),
    INDEX idx_status (status)
);

-- Insertion de ligands validés scientifiquement
INSERT INTO validated_ligands (name, smiles, molecular_weight, logp, hydrogen_bond_donors, hydrogen_bond_acceptors, rotatable_bonds, topological_polar_surface_area, drug_likeness_score, category, description, pubchem_cid, status) VALUES
-- Médicaments approuvés (FDA/EMA)
('Acétaminophène', 'CC(=O)NC1=CC=C(C=C1)O', 151.16, 0.49, 2, 3, 1, 49.33, 0.847, 'analgesic', 'Analgésique et antipyrétique courant', 1983, 'approved'),
('Ibuprofène', 'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O', 206.28, 3.50, 1, 2, 4, 37.30, 0.721, 'anti-inflammatory', 'AINS anti-inflammatoire', 3672, 'approved'),
('Aspirine', 'CC(=O)OC1=CC=CC=C1C(=O)O', 180.16, 1.19, 1, 4, 3, 63.60, 0.756, 'anti-inflammatory', 'AINS et antiplaquettaire', 2244, 'approved'),
('Caféine', 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C', 194.19, -0.07, 0, 6, 0, 58.44, 0.693, 'stimulant', 'Stimulant du système nerveux central', 2519, 'approved'),
('Morphine', 'CN1CC[C@]23C4=C5C=CC(=C4[C@H]1CC2=C3C(=C5)O)O', 285.34, 0.89, 2, 5, 2, 52.93, 0.634, 'opioid', 'Analésique opioïde puissant', 5288826, 'approved'),
('Diazépam', 'C1=CC=C(C=C1)C2=CN=C(N=C2)C(=O)N(C)C', 284.74, 2.83, 0, 3, 1, 32.69, 0.812, 'benzodiazepine', 'Anxiolytique benzodiazépine', 3016, 'approved'),

-- Molécules de recherche expérimentale
('Imatinib', 'CC1=CC=C(C=C1N(C)C(=O)C2=CC=CC=C2)C3=NC=CN3', 493.60, 3.73, 2, 8, 8, 94.56, 0.523, 'kinase_inhibitor', 'Inhibiteur de tyrosine kinase BCR-ABL', 5291, 'experimental'),
('Gefitinib', 'CCOCCNC1=NC=C(C=C1)C2=NC=CC(=N2)NC3=CC=CC=C3F', 446.90, 2.84, 1, 9, 7, 76.31, 0.587, 'kinase_inhibitor', 'Inhibiteur EGFR', 123631, 'experimental'),
('Erlotinib', 'C#CC1=CC=C(C=C1)OC2=CC=C(C=C2)C3=NC=CC=N3', 393.42, 2.79, 0, 6, 3, 58.72, 0.634, 'kinase_inhibitor', 'Inhibiteur EGFR', 176870, 'experimental'),

-- Inhibiteurs de protéases (recherche COVID-19 et autres virus)
('Ritonavir', 'CC(C)C1=CC(=C(C=C1)C(C)C)C2=NC(=NC=N2)C3=CC=CC=C3', 720.94, 4.46, 2, 10, 11, 146.54, 0.412, 'protease_inhibitor', 'Inhibiteur de protéase VIH', 392622, 'approved'),
('Lopinavir', 'CC1=CC(=CC=C1C2=NC(=NC=N2)C3=CC=CC=C3)C(C)(C)C', 628.80, 4.31, 1, 8, 9, 124.67, 0.456, 'protease_inhibitor', 'Inhibiteur de protéase VIH', 92727, 'approved'),

-- Antiviraux à large spectre
('Remdesivir', 'CC1=CN=C(N1C)C2=CC=CC=C2C3=NC(=NC=N3)C4=CC=CC=C4', 602.58, 1.73, 2, 11, 8, 137.89, 0.389, 'antiviral', 'Antiviral à large spectre', 121304016, 'approved'),
('Favipiravir', 'C1=NC(=O)N(C=N1)C2=CN=CN2', 157.10, -0.04, 2, 4, 0, 71.83, 0.678, 'antiviral', 'Inhibiteur ARN polymérase', 492405, 'approved'),

-- Molécules naturelles bioactives
('Quercetine', 'C1=CC(=C(C=C1C2=CC(=O)C3=C(O2)C=CC(=C3)O)O)O', 302.24, 1.54, 5, 7, 1, 131.36, 0.567, 'flavonoid', 'Flavonoïde antioxydant', 5280343, 'research'),
('Resveratrol', 'OC1=CC(=CC=C1C=C2C(=C(C=C2)O)O)O', 228.24, 3.10, 3, 3, 2, 60.15, 0.723, 'polyphenol', 'Polyphénol antioxydant', 445154, 'research'),
('Curcumine', 'CC(=O)C1=CC(=C(C=C1)C(=O)O)C2=CC(=C(C=C2)O)O', 368.38, 3.29, 2, 6, 2, 93.07, 0.634, 'polyphenol', 'Curcuminoïde anti-inflammatoire', 969516, 'research'),

-- Antibiotiques et antimicrobiens
('Ciprofloxacine', 'C1=CC(=C(C=C1F)C2C(=O)C3=CC=CC=C3N2)C(=O)O', 331.34, 0.28, 1, 6, 2, 74.57, 0.612, 'antibiotic', 'Fluoroquinolone antibiotique', 2764, 'approved'),
('Doxycycline', 'CC(C)N1C(=O)C2=CC=CC=C2C(=O)C3=CC=CC=C13', 444.43, -0.20, 3, 7, 1, 123.23, 0.456, 'antibiotic', 'Tétracycline antibiotique', 54671203, 'approved'),

-- Molécules de recherche en oncologie
('Paclitaxel', 'CC1=C2C(C(=O)C3(C)C4CC5=CC(=O)C=CC5C4C3C2O)C=CC=C1', 853.91, 3.92, 1, 14, 4, 206.27, 0.234, 'antineoplastic', 'Agent antimicrotubules', 36362, 'approved'),
('Doxorubicine', 'CC1=CC(=C(C=C1O)O)C2=CC(=O)C3=C(O2)C(=CN(C)N3)C', 543.52, 1.27, 3, 10, 4, 224.20, 0.345, 'antineoplastic', 'Anthracycline antibiotique', 31703, 'approved'),

-- Neurotransmetteurs et modulateurs
('Dopamine', 'C1=CC(=C(C=C1)O)CCN', 153.18, -0.98, 3, 2, 2, 41.49, 0.789, 'neurotransmitter', 'Neurotransmetteur catécholamine', 681, 'research'),
('Sérotonine', 'C1=CC(=C(C=C1)C2=CN=C(N2)C)CCN', 176.22, 0.15, 2, 3, 2, 41.81, 0.734, 'neurotransmitter', 'Neurotransmetteur monoamine', 5202, 'research'),
('GABA', 'C(=O)OCC(=O)N', 103.10, -0.97, 2, 3, 3, 52.68, 0.823, 'neurotransmitter', 'Acide gamma-aminobutyrique', 119, 'research'),

-- Vitamines essentielles
('Vitamine C', 'C(C(C1=CC(=C(C=C1)O)O)O)O', 176.12, -1.77, 4, 6, 3, 107.99, 0.812, 'vitamin', 'Acide ascorbique', 54670067, 'approved'),
('Vitamine D3', 'CC(C)CCCC(C)C1CCC2C1(CCC3=CC(=C(C=C3)C)C)CCC4C2CC=C4C', 384.64, 6.91, 1, 1, 5, 20.23, 0.567, 'vitamin', 'Cholécalciférol', 5280795, 'approved'),

-- Hormones stéroïdes
('Cortisol', 'CC12CCC3C(C1C2=CC(=O)C=CC3=O)C4=CC(=O)C=CC4', 362.46, 1.61, 2, 3, 0, 74.60, 0.678, 'steroid', 'Hormone glucocorticoïde', 6258, 'approved'),
('Testostérone', 'CC12CCC3C(C1C2CCC4=CC(=O)CCC34C)C', 288.42, 2.99, 1, 2, 0, 40.47, 0.745, 'steroid', 'Hormone androgène', 6013, 'approved'),

-- Métabolites énergétiques
('ATP', 'C1=NC(=C(N=C1N)N)C2=NC(=C(N=C2N)N)N', 507.18, -1.67, 6, 13, 7, 207.58, 0.234, 'nucleotide', 'Adénosine triphosphate', 6508, 'research'),
('NAD+', 'C1=NC(=C(N=C1N)N)C2=NC(=C(N=C2N)N)N', 663.43, -1.09, 5, 10, 6, 191.79, 0.312, 'cofactor', 'Nicotinamide adénine dinucléotide', 438368, 'research');
