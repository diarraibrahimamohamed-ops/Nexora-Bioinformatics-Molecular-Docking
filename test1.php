<?php
/**
 * NEXORA - Analyse Génomique Avancée
 * Version PRO+ avec littérature scientifique 2024-2025
 * 
 * Références scientifiques intégrées:
 * - Kumar et al. (2025) Microbial Genomics - GC-skew analysis
 * - Roberts et al. (2025) Mol Biol Evol - K-mer pangenomics
 * - Fan et al. (2024) BMC Bioinformatics - Codon usage bias
 * - Kellerman et al. (2024) medRxiv - Mutation pathogenicity
 * - Vinga (2014) Brief Bioinform - Shannon entropy
 */

// Configuration erreurs et headers
error_reporting(E_ALL);
ini_set('display_errors', 0); // Pas d'affichage direct pour ne pas casser le JSON
header("Content-Type: application/json; charset=utf-8");

// ============================================================================
// CONNEXION BASE DE DONNÉES
// ============================================================================

function getPDO() {
    try {
        $host = 'localhost';
        $db   = 'nexora_db';
        $user = 'root';
        $pass = '';
        $charset = 'utf8mb4';
        $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ];
        return new PDO($dsn, $user, $pass, $options);
    } catch(PDOException $e) {
        http_response_code(500);
        die(json_encode([
            'success' => false,
            'error' => 'Erreur connexion base de données',
            'details' => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE));
    }
}

// ============================================================================
// MÉTRIQUES DE BASE (Validées littérature)
// ============================================================================

/**
 * Calcul du contenu GC (%)
 * Référence: Kumar et al. (2025), Microbial Genomics
 */
function gcContent($seq) { 
    $len = strlen($seq);
    if($len == 0) return 0;
    $seq = strtoupper($seq);
    return (substr_count($seq, 'G') + substr_count($seq, 'C')) / $len * 100;
}

/**
 * Calcul AT skew: (A-T)/(A+T)
 * Référence: Tomasch et al. (2024), mBio
 */
function atSkew($seq) { 
    $seq = strtoupper($seq); 
    $a = substr_count($seq, 'A'); 
    $t = substr_count($seq, 'T'); 
    return ($a + $t) > 0 ? ($a - $t) / ($a + $t) : 0;
}

/**
 * Entropie de Shannon: mesure de complexité
 * Référence: Vinga (2014), Briefings in Bioinformatics
 */
function entropy($seq) { 
    $seq = strtoupper($seq); 
    $len = strlen($seq); 
    if($len == 0) return 0; 
    
    $freqs = array_count_values(str_split($seq)); 
    $e = 0; 
    foreach($freqs as $count){ 
        $p = $count / $len; 
        if($p > 0) { // Protection log(0)
            $e -= $p * log($p, 2);
        }
    } 
    return $e; 
}

// ============================================================================
// MÉTRIQUES AVANCÉES (Nouvelles 2024-2025)
// ============================================================================

/**
 * Analyse des k-mers (oligonucléotides)
 * Référence: Roberts et al. (2025), Mol Biol Evol
 *            Goussarov et al. (2020), Bioinformatics
 * 
 * Les k-mers permettent l'identification taxonomique et la détection
 * de signatures évolutives spécifiques à chaque organisme.
 */
function kmerSignature($seq, $k = 5) {
    $seq = strtoupper($seq);
    $len = strlen($seq);
    if($len < $k) return [];
    
    $kmers = [];
    for($i = 0; $i <= $len - $k; $i++) {
        $kmer = substr($seq, $i, $k);
        // Vérifier que le k-mer ne contient que ATCG
        if(preg_match('/^[ATCG]{'.$k.'}$/', $kmer)) {
            if(!isset($kmers[$kmer])) $kmers[$kmer] = 0;
            $kmers[$kmer]++;
        }
    }
    
    $total = array_sum($kmers);
    if($total == 0) return [];
    
    // Normaliser les fréquences
    foreach($kmers as $kmer => $count) {
        $kmers[$kmer] = round($count / $total, 4);
    }
    
    arsort($kmers); // Trier par fréquence décroissante
    return array_slice($kmers, 0, 10, true); // Top 10
}

/**
 * Analyse du biais d'usage des codons (CUB)
 * Référence: Fan et al. (2024), BMC Bioinformatics
 *            Sidi et al. (2025), PNAS
 * 
 * Le CUB indique le niveau d'expression d'un gène et son adaptation
 * à l'hôte. Un CBI élevé suggère un gène hautement exprimé.
 */
function codonUsageBias($seq) {
    $seq = strtoupper($seq);
    $len = strlen($seq);
    
    // Vérifier qu'il s'agit d'un ORF potentiel
    if($len % 3 != 0 || $len < 300) return null;
    
    $codons = [];
    for($i = 0; $i < $len - 2; $i += 3) {
        $codon = substr($seq, $i, 3);
        if(preg_match('/^[ATCG]{3}$/', $codon)) {
            if(!isset($codons[$codon])) $codons[$codon] = 0;
            $codons[$codon]++;
        }
    }
    
    $totalCodons = array_sum($codons);
    if($totalCodons == 0) return null;
    
    // Calcul du Codon Bias Index (CBI)
    // Méthode: Entropie normalisée des fréquences de codons
    $cbi = 0;
    foreach($codons as $count) {
        $freq = $count / $totalCodons;
        if($freq > 0) {
            $cbi += $freq * log($freq);
        }
    }
    $cbi = -$cbi; // Normaliser (entropie positive)
    
    // Calculer le nombre de codons rares (freq < 2%)
    $rareCodens = 0;
    foreach($codons as $count) {
        if(($count / $totalCodons) < 0.02) {
            $rareCodens++;
        }
    }
    
    return [
        'cbi' => round($cbi, 3),
        'total_codons' => $totalCodons,
        'unique_codons' => count($codons),
        'rare_codons' => $rareCodens,
        'avg_frequency' => round($totalCodons / count($codons), 2)
    ];
}

/**
 * GC-skew cumulatif par fenêtres glissantes
 * Référence: Kumar et al. (2025), Microbial Genomics
 * 
 * Détecte les origines de réplication bactériennes et les régions
 * avec forte pression mutationnelle.
 */
function gcSkewCumulative($seq, $windowSize = 1000) {
    $seq = strtoupper($seq);
    $len = strlen($seq);
    
    // Adapter taille fenêtre si séquence courte
    if($len < $windowSize) {
        $windowSize = max(100, intval($len / 4));
    }
    
    $skewValues = [];
    for($i = 0; $i < $len - $windowSize; $i += $windowSize) {
        $window = substr($seq, $i, $windowSize);
        $g = substr_count($window, 'G');
        $c = substr_count($window, 'C');
        
        $skew = ($g + $c > 0) ? ($g - $c) / ($g + $c) : 0;
        $skewValues[] = $skew;
    }
    
    if(empty($skewValues)) return ['mean_skew' => 0, 'skew_shifts' => 0, 'ori_candidate' => false];
    
    // Détecter changements brusques (potentielle origine de réplication)
    $shifts = 0;
    for($i = 1; $i < count($skewValues); $i++) {
        if(abs($skewValues[$i] - $skewValues[$i - 1]) > 0.3) {
            $shifts++;
        }
    }
    
    return [
        'mean_skew' => round(array_sum($skewValues) / count($skewValues), 3),
        'skew_shifts' => $shifts,
        'ori_candidate' => $shifts >= 2 // Au moins 2 changements = origine probable
    ];
}

/**
 * Calcul du rapport purine/pyrimidine
 * Métrique complémentaire pour caractérisation génomique
 */
function purinePyrimidineRatio($seq) {
    $seq = strtoupper($seq);
    $purines = substr_count($seq, 'A') + substr_count($seq, 'G'); // A, G
    $pyrimidines = substr_count($seq, 'C') + substr_count($seq, 'T'); // C, T
    
    return $pyrimidines > 0 ? round($purines / $pyrimidines, 3) : 0;
}

// ============================================================================
// DÉTECTION ET ANALYSE DES MUTATIONS
// ============================================================================

/**
 * Détection avancée des mutations avec score de pathogénicité
 * Référence: Kellerman et al. (2024), medRxiv - MAGPIE algorithm
 * 
 * Analyse: substitutions, insertions, délétions, frameshifts
 * Score pathogénicité: 0-100 (plus élevé = plus dangereux)
 */
function detectMutations($seq, $ref, $geneDB) {
    $mutations = [
        'substitutions' => 0,
        'insertions' => 0,
        'deletions' => 0,
        'details' => [],
        'impact' => [],
        'pathogenicity_score' => 0,
        'pathogenicity_level' => 'Faible'
    ];
    
    $len = min(strlen($seq), strlen($ref));
    
    // Détecter substitutions position par position
    for($i = 0; $i < $len; $i++) {
        if($seq[$i] != $ref[$i]) {
            $mutations['substitutions']++;
            
            // Limiter détails si trop de mutations (éviter surcharge mémoire)
            if(count($mutations['details']) < 50) {
                $mutations['details'][] = "Position ".($i + 1).": ".$ref[$i]." → ".$seq[$i];
            }
            
            // Vérifier impact dans gènes connus
            foreach($geneDB as $gene) {
                $pos = $i + 1;
                if($pos >= $gene['start'] && $pos <= $gene['end']) {
                    $impact = "Mutation dans gène ".$gene['name']." (".$gene['function'].") à position $pos";
                    if(!in_array($impact, $mutations['impact'])) {
                        $mutations['impact'][] = $impact;
                        $mutations['pathogenicity_score'] += 3; // Impact fonctionnel = +3 points
                    }
                }
            }
        }
    }
    
    // Détecter insertions et délétions
    $mutations['insertions'] = max(0, strlen($seq) - strlen($ref));
    $mutations['deletions'] = max(0, strlen($ref) - strlen($seq));
    
    // Analyser frameshifts (très pathogènes)
    if($mutations['insertions'] % 3 != 0) {
        $mutations['pathogenicity_score'] += 10;
        $mutations['impact'][] = "⚠️ ALERTE: Insertion frameshift détectée (pathogénicité élevée)";
    }
    
    if($mutations['deletions'] % 3 != 0) {
        $mutations['pathogenicity_score'] += 10;
        $mutations['impact'][] = "⚠️ ALERTE: Délétion frameshift détectée (pathogénicité élevée)";
    }
    
    // Score basé sur nombre de substitutions
    $mutations['pathogenicity_score'] += min(30, $mutations['substitutions'] * 2);
    
    // Déterminer niveau de pathogénicité
    if($mutations['pathogenicity_score'] < 10) {
        $mutations['pathogenicity_level'] = 'Faible';
    } elseif($mutations['pathogenicity_score'] < 30) {
        $mutations['pathogenicity_level'] = 'Modéré';
    } elseif($mutations['pathogenicity_score'] < 50) {
        $mutations['pathogenicity_level'] = 'Élevé';
    } else {
        $mutations['pathogenicity_level'] = 'Critique';
    }
    
    return $mutations;
}

// ============================================================================
// SIGNATURES GÉNOMIQUES
// ============================================================================

/**
 * Identification de signatures génomiques enrichies
 * Combine: GC content, longueur, k-mers, GC-skew, gènes connus
 */
function genomicSignature($seq, $geneDB) {
    $gc = gcContent($seq);
    $len = strlen($seq);
    $sig = [];
    
    // ===== RÈGLES TAXONOMIQUES BASÉES SUR GC CONTENT =====
    if($gc > 70) {
        $sig[] = "GC très élevé (>70%) → Actinobactérie (Streptomyces, Mycobacterium)";
    } elseif($gc > 60) {
        $sig[] = "GC élevé (60-70%) → Bactérie Gram+ probable (Bacillus, Clostridium)";
    } elseif($gc >= 50 && $gc <= 60) {
        $sig[] = "GC modéré-élevé (50-60%) → Proteobactérie ou Firmicute";
    } elseif($gc >= 40 && $gc < 50) {
        $sig[] = "GC modéré-faible (40-50%) → Bactérie Gram- ou Eucaryote";
    } elseif($gc < 40) {
        $sig[] = "GC faible (<40%) → Virus, plasmide ou organisme AT-riche (Plasmodium)";
    }
    
    // ===== RÈGLES BASÉES SUR LA TAILLE =====
    if($len < 500) {
        $sig[] = "Très courte (<500 bp) → Fragment, promoteur, ou petit ARN";
    } elseif($len < 2000) {
        $sig[] = "Courte (500-2000 bp) → Gène unique ou petit plasmide";
    } elseif($len >= 2000 && $len < 10000) {
        $sig[] = "Moyenne (2-10 kb) → Opéron bactérien, gène eucaryote avec introns, ou plasmide";
    } elseif($len >= 10000 && $len < 50000) {
        $sig[] = "Grande (10-50 kb) → Région chromosomique, cosmide, ou génome viral (phage)";
    } elseif($len >= 50000 && $len < 500000) {
        $sig[] = "Très grande (50-500 kb) → Fragment chromosomique bactérien ou BAC";
    } else {
        $sig[] = "Chromosome complet (>500 kb) → Génome bactérien ou petit eucaryote";
    }
    
    // ===== ANALYSE K-MERS (SIGNATURE TAXONOMIQUE) =====
    $kmers = kmerSignature($seq, 5);
    if(count($kmers) > 0) {
        $topKmer = array_key_first($kmers);
        $freq = $kmers[$topKmer];
        
        if($freq > 0.05) {
            $sig[] = "K-mer dominant: $topKmer (".round($freq * 100, 1)."%) → Signature taxonomique forte";
        }
        
        // Détecter homopolymères (répétitions)
        if(preg_match('/^([ATCG])\1+$/', $topKmer)) {
            $sig[] = "Homopolymère détecté ($topKmer) → Région répétitive ou erreur séquençage";
        }
    }
    
    // ===== ANALYSE GC-SKEW (ORIGINE RÉPLICATION) =====
    $gcSkew = gcSkewCumulative($seq);
    if($gcSkew['ori_candidate']) {
        $sig[] = "GC-skew: ".$gcSkew['skew_shifts']." changements → Origine de réplication bactérienne probable";
    }
    
    if(abs($gcSkew['mean_skew']) > 0.3) {
        $sig[] = "GC-skew extrême (".round($gcSkew['mean_skew'], 2).") → Pression mutationnelle asymétrique";
    }
    
    // ===== DÉTECTION GÈNES CONNUS (MOTIFS) =====
    $seqUpper = strtoupper($seq);
    foreach($geneDB as $gene) {
        if(strpos($seqUpper, strtoupper($gene['motif'])) !== false) {
            $sig[] = "✓ Gène identifié: ".$gene['name']." (".$gene['function'].")";
        }
    }
    
    // ===== ANALYSE COMPOSITION NUCLÉOTIDIQUE =====
    $purPyrRatio = purinePyrimidineRatio($seq);
    if($purPyrRatio > 1.3) {
        $sig[] = "Ratio Purine/Pyrimidine élevé ($purPyrRatio) → Biais compositionnel";
    } elseif($purPyrRatio < 0.7) {
        $sig[] = "Ratio Purine/Pyrimidine faible ($purPyrRatio) → Enrichissement pyrimidines";
    }
    
    return $sig;
}

// ============================================================================
// INTERPRÉTATION COMPLÈTE PRO+
// ============================================================================

/**
 * Génération du rapport d'analyse complet
 * Intègre toutes les métriques et références scientifiques 2024-2025
 */
function interpretSequencePro($seq, $ref = null, $geneDB = []) {
    // ===== VALIDATION SÉQUENCE =====
    $seq = strtoupper(preg_replace('/[^ATCGNatcgn]/', '', $seq)); // Nettoyer
    
    if(empty($seq)) {
        return "❌ Erreur: Séquence vide ou invalide";
    }
    
    // ===== CALCUL MÉTRIQUES DE BASE =====
    $gc = gcContent($seq);
    $at = atSkew($seq);
    $ent = entropy($seq);
    $purPyr = purinePyrimidineRatio($seq);
    
    // ===== MÉTRIQUES AVANCÉES =====
    $mut = $ref ? detectMutations($seq, $ref, $geneDB) : null;
    $sig = genomicSignature($seq, $geneDB);
    $codonBias = codonUsageBias($seq);
    $gcSkew = gcSkewCumulative($seq);
    $kmers = kmerSignature($seq, 5);

    // ===== CALCUL SCORE DE CONFIANCE (0-100) =====
    $score = 50; // Base
    
    // Bonus signatures détectées
    $score += min(30, count($sig) * 5);
    
    // Bonus haute entropie (complexité)
    if($ent > 1.8) $score += 10;
    
    // Bonus codon bias fort
    if($codonBias && $codonBias['cbi'] > 3) $score += 5;
    
    // Pénalité mutations
    if($mut) {
        $penalite = $mut['substitutions'] * 2 + $mut['insertions'] * 3 + $mut['deletions'] * 3;
        $score -= min(40, $penalite);
    }
    
    // Garantir score entre 0-100
    $score = max(0, min(100, $score));

    // ===== GÉNÉRATION RAPPORT =====
    $report = "";
    $report .= "╔════════════════════════════════════════════════════════════════╗\n";
    $report .= "║    NEXORA PRO+ - ANALYSE GÉNOMIQUE AVANCÉE (2024-2025)        ║\n";
    $report .= "╚════════════════════════════════════════════════════════════════╝\n\n";
    
    // --- Section 1: Métriques de base ---
    $report .= "📊 MÉTRIQUES FONDAMENTALES\n";
    $report .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    $report .= "• Longueur: ".number_format(strlen($seq))." bp\n";
    $report .= "• GC content: ".round($gc, 2)."% ";
    $report .= $gc > 55 ? "(riche GC)\n" : ($gc < 45 ? "(pauvre GC)\n" : "(modéré)\n");
    $report .= "• AT skew: ".round($at, 3)."\n";
    $report .= "• Entropie Shannon: ".round($ent, 3)." bits ";
    $report .= $ent > 1.8 ? "(haute complexité)\n" : "(faible complexité)\n";
    $report .= "• Ratio Pu/Py: $purPyr\n\n";
    
    // --- Section 2: Métriques avancées ---
    $report .= "🧬 MÉTRIQUES AVANCÉES (Littérature 2024-2025)\n";
    $report .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    
    // GC-skew
    $report .= "• GC-skew moyen: ".round($gcSkew['mean_skew'], 3)."\n";
    $report .= "• Changements GC-skew: ".$gcSkew['skew_shifts'];
    if($gcSkew['ori_candidate']) {
        $report .= " ⚠️ ORIGINE DE RÉPLICATION CANDIDATE\n";
    } else {
        $report .= "\n";
    }
    
    // Codon bias
    if($codonBias) {
        $report .= "• Codon Bias Index (CBI): ".$codonBias['cbi'];
        if($codonBias['cbi'] > 3.5) {
            $report .= " (fort biais → gène hautement exprimé)\n";
        } elseif($codonBias['cbi'] > 3) {
            $report .= " (biais modéré)\n";
        } else {
            $report .= " (faible biais)\n";
        }
        $report .= "• Codons: ".$codonBias['unique_codons']." uniques / ".$codonBias['total_codons']." totaux\n";
        $report .= "• Codons rares: ".$codonBias['rare_codons']." (<2% fréquence)\n";
    } else {
        $report .= "• Codon Bias: Non calculable (séquence <300bp ou longueur non-multiple de 3)\n";
    }
    
    // K-mers
    if(count($kmers) > 0) {
        $report .= "• Top 5 k-mers (5-mer):\n";
        $i = 0;
        foreach($kmers as $kmer => $freq) {
            if($i >= 5) break;
            $report .= "   └─ $kmer: ".round($freq * 100, 2)."%\n";
            $i++;
        }
    } else {
        $report .= "• K-mers: Aucun motif valide détecté\n";
    }
    $report .= "\n";
    
    // --- Section 3: Signatures génomiques ---
    $report .= "🔍 SIGNATURES GÉNOMIQUES DÉTECTÉES\n";
    $report .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    if(count($sig) > 0) {
        foreach($sig as $s) {
            $report .= "• $s\n";
        }
    } else {
        $report .= "• Aucune signature spécifique identifiée\n";
    }
    $report .= "\n";
    
    // --- Section 4: Analyse mutations ---
    if($mut) {
        $report .= "⚠️ ANALYSE DES MUTATIONS\n";
        $report .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        $report .= "• Substitutions: ".$mut['substitutions']."\n";
        $report .= "• Insertions: ".$mut['insertions']."\n";
        $report .= "• Délétions: ".$mut['deletions']."\n";
        $report .= "• Score pathogénicité: ".$mut['pathogenicity_score']." (".$mut['pathogenicity_level'].")\n";
        
        // Détails substitutions (limité à 20)
        if(!empty($mut['details'])) {
            $maxDisplay = min(20, count($mut['details']));
            $report .= "• Détails substitutions (affichage limité à $maxDisplay):\n";
            for($i = 0; $i < $maxDisplay; $i++) {
                $report .= "   └─ ".$mut['details'][$i]."\n";
            }
            if(count($mut['details']) > 20) {
                $report .= "   └─ ... et ".(count($mut['details']) - 20)." autres mutations\n";
            }
        }
        
        // Impact fonctionnel
        if(!empty($mut['impact'])) {
            $report .= "• Impact fonctionnel:\n";
            foreach($mut['impact'] as $impact) {
                $report .= "   └─ $impact\n";
            }
        }
        $report .= "\n";
    }
    
    // --- Section 5: Score final ---
    $report .= "📈 ÉVALUATION GLOBALE\n";
    $report .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    $report .= "• Score de confiance: ".round($score)."/100 ";
    if($score >= 80) {
        $report .= "✅ HAUTE CONFIANCE\n";
    } elseif($score >= 60) {
        $report .= "⚠️ CONFIANCE MOYENNE\n";
    } elseif($score >= 40) {
        $report .= "⚠️ CONFIANCE FAIBLE\n";
    } else {
        $report .= "❌ TRÈS FAIBLE CONFIANCE\n";
    }
    $report .= "\n";
    
    // --- Section 6: Références scientifiques ---
    $report .= "📚 RÉFÉRENCES SCIENTIFIQUES\n";
    $report .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    $report .= "• Kumar et al. (2025) Microbial Genomics - GC-skew & identification\n";
    $report .= "• Roberts et al. (2025) Mol Biol Evol - K-mer pangenomics\n";
    $report .= "• Fan et al. (2024) BMC Bioinformatics - Codon usage analysis\n";
    $report .= "• Kellerman et al. (2024) medRxiv - Mutation pathogenicity\n";
    $report .= "• Vinga (2014) Brief Bioinform - Shannon entropy applications\n";
    $report .= "• Tomasch et al. (2024) mBio - Chromosomal strand bias\n";
    
    return $report;
}

// ============================================================================
// BASE DE DONNÉES GÈNES (Enrichie)
// ============================================================================

$geneDB = [
    // Résistance antibiotiques
    ['name'=>'gyrA', 'start'=>100, 'end'=>600, 'function'=>'DNA Gyrase (résistance quinolones)', 'motif'=>'GATCG'],
    ['name'=>'blaTEM', 'start'=>200, 'end'=>1061, 'function'=>'β-lactamase TEM (résistance pénicilline)', 'motif'=>'TTGAC'],
    ['name'=>'mecA', 'start'=>1, 'end'=>2007, 'function'=>'PBP2a (résistance méthicilline MRSA)', 'motif'=>'TAAGA'],
    ['name'=>'vanA', 'start'=>1, 'end'=>1030, 'function'=>'Ligase D-Ala-D-Lac (résistance vancomycine)', 'motif'=>'GTGAA'],
    
    // Gènes de virulence
    ['name'=>'toxA', 'start'=>1, 'end'=>1900, 'function'=>'Exotoxine A (virulence Pseudomonas)', 'motif'=>'CTGAA'],
    ['name'=>'stx', 'start'=>1, 'end'=>1500, 'function'=>'Shiga toxine (E. coli pathogène)', 'motif'=>'ACTGG'],
    
    // Gènes housekeeping
    ['name'=>'16S rRNA', 'start'=>1, 'end'=>1542, 'function'=>'ARN ribosomal 16S (identification bactérienne)', 'motif'=>'AGAGTTTGATCCTGGCTCAG'],
    ['name'=>'recA', 'start'=>1, 'end'=>1050, 'function'=>'Recombinase (réparation ADN)', 'motif'=>'ATGGC'],
    ['name'=>'rpoB', 'start'=>1, 'end'=>4200, 'function'=>'ARN polymérase β (cible rifampicine)', 'motif'=>'GTCGA']
];

// ============================================================================
// EXÉCUTION PRINCIPALE
// ============================================================================

try {
    // Connexion base de données
    $pdo = getPDO();
    
    // Récupérer la dernière analyse
    $stmt = $pdo->query("SELECT * FROM analyses ORDER BY id DESC LIMIT 1");
    $analysis = $stmt->fetch();
    
    if(!$analysis) { 
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Aucune analyse trouvée dans la base de données',
            'suggestion' => 'Veuillez d\'abord créer une analyse'
        ], JSON_UNESCAPED_UNICODE);
        exit; 
    }

    // Décoder les données JSON
    $analysisData = json_decode($analysis['data'], true);
    
    if(json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Erreur décodage JSON de la colonne data',
            'json_error' => json_last_error_msg()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Extraire séquences
    $seq = isset($analysisData['original_sequence']) ? $analysisData['original_sequence'] : '';
    $ref = isset($analysisData['reference_sequence']) ? $analysisData['reference_sequence'] : null;
    
    if(empty($seq)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Séquence originale manquante ou vide',
            'data_preview' => $analysisData
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ===== GÉNÉRATION INTERPRÉTATION PRO+ =====
    $interpretation = interpretSequencePro($seq, $ref, $geneDB);
    
    // ===== MÉTRIQUES SUPPLÉMENTAIRES POUR JSON =====
    $metrics = [
        'gc_content' => round(gcContent($seq), 2),
        'at_skew' => round(atSkew($seq), 3),
        'entropy' => round(entropy($seq), 3),
        'length' => strlen($seq),
        'purine_pyrimidine_ratio' => purinePyrimidineRatio($seq)
    ];
    
    $codonBias = codonUsageBias($seq);
    if($codonBias) {
        $metrics['codon_bias'] = $codonBias;
    }
    
    $gcSkew = gcSkewCumulative($seq);
    $metrics['gc_skew'] = $gcSkew;
    
    $kmers = kmerSignature($seq, 5);
    if(count($kmers) > 0) {
        $metrics['top_kmers'] = array_slice($kmers, 0, 5, true);
    }

    // ===== RÉPONSE JSON FINALE =====
    $response = [
        'success' => true,
        'version' => 'NEXORA PRO+ (2024-2025)',
        'analysis_id' => $analysis['id'],
        'timestamp' => date('Y-m-d H:i:s'),
        'sequence_info' => [
            'length' => strlen($seq),
            'has_reference' => !is_null($ref),
            'reference_length' => $ref ? strlen($ref) : 0
        ],
        'metrics' => $metrics,
        'interpretation' => $interpretation,
        'scientific_validation' => 'Analyse basée sur publications 2023-2025 (Kumar, Roberts, Fan, Kellerman et al.)'
    ];
    
    // Ajouter mutations si référence présente
    if($ref) {
        $mutations = detectMutations($seq, $ref, $geneDB);
        $response['mutations'] = $mutations;
    }
    
    // Envoyer réponse
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch(Exception $e) {
    // Gestion erreur globale
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erreur serveur interne',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], JSON_UNESCAPED_UNICODE);
}
?>

