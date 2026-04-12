<?php
// ==== CORS ====
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === "OPTIONS") { exit; }

// ==== CONFIG ====
set_time_limit(0);
ini_set('memory_limit','1024M');
header('Content-Type: application/json; charset=utf-8');

// ==== UTILITAIRES ====
function clean_sequence($seq) {
    return preg_replace('/[^ACGT]/', '', strtoupper($seq));
}

function transcribe($dna) {
    return str_replace('T', 'U', $dna);
}

function gc_content($seq) {
    if (!$seq) return 0;
    $gc = substr_count($seq, 'G') + substr_count($seq, 'C');
    return round(($gc / strlen($seq)) * 100, 3);
}

function nucleotide_counts($seq) {
    return [
        'A' => substr_count($seq, 'A'),
        'C' => substr_count($seq, 'C'),
        'G' => substr_count($seq, 'G'),
        'T' => substr_count($seq, 'T'),
        'length' => strlen($seq)
    ];
}

function translate_frame($rna, $frame=0) {
    $table = [
        'UUU'=>'F','UUC'=>'F','UUA'=>'L','UUG'=>'L','UCU'=>'S','UCC'=>'S','UCA'=>'S','UCG'=>'S',
        'UAU'=>'Y','UAC'=>'Y','UAA'=>'*','UAG'=>'*','UGU'=>'C','UGC'=>'C','UGA'=>'*','UGG'=>'W',
        'CUU'=>'L','CUC'=>'L','CUA'=>'L','CUG'=>'L','CCU'=>'P','CCC'=>'P','CCA'=>'P','CCG'=>'P',
        'CAU'=>'H','CAC'=>'H','CAA'=>'Q','CAG'=>'Q','CGU'=>'R','CGC'=>'R','CGA'=>'R','CGG'=>'R',
        'AUU'=>'I','AUC'=>'I','AUA'=>'I','AUG'=>'M','ACU'=>'T','ACC'=>'T','ACA'=>'T','ACG'=>'T',
        'AAU'=>'N','AAC'=>'N','AAA'=>'K','AAG'=>'K','AGU'=>'S','AGC'=>'S','AGA'=>'R','AGG'=>'R',
        'GUU'=>'V','GUC'=>'V','GUA'=>'V','GUG'=>'V','GCU'=>'A','GCC'=>'A','GCA'=>'A','GCG'=>'A',
        'GAU'=>'D','GAC'=>'D','GAA'=>'E','GAG'=>'E','GGU'=>'G','GGC'=>'G','GGA'=>'G','GGG'=>'G'
    ];

    $prot = "";
    for ($i=$frame; $i+3<=strlen($rna); $i+=3) {
        $codon = substr($rna, $i, 3);
        $prot .= $table[$codon] ?? "X";
    }
    return $prot;
}

function analyze_fragment($frag, $index, $start) {
    $rna = transcribe($frag);

    return [
        'index'        => $index,
        'start_pos'    => $start,
        'end_pos'      => $start + strlen($frag) - 1,
        'length'       => strlen($frag),
        'gc_percent'   => gc_content($frag),
        'nuc_counts'   => nucleotide_counts($frag),
        'adn_template' => $frag,
        'arn'          => $rna,
        'translations' => [
            'frame_1' => translate_frame($rna,0),
            'frame_2' => translate_frame($rna,1),
            'frame_3' => translate_frame($rna,2)
        ]
    ];
}

// ==== INPUT ====
$input = json_decode(file_get_contents("php://input"), true);

if (!$input || empty($input["sequence"])) {
    echo json_encode(["error"=>"No sequence provided"]);
    exit;
}

$sequence = clean_sequence($input["sequence"]);
$len = strlen($sequence);

// ==== HYBRIDE ====
$CHUNK_THRESHOLD = 50000;   // >50k → chunk
$CHUNK_SIZE      = 20000;

$results = [];

if ($len <= $CHUNK_THRESHOLD) {
    // analyse simple
    $results[] = analyze_fragment($sequence, 1, 1);
} else {
    // analyse chunkée
    $index = 1;
    for ($i=0; $i<$len; $i+=$CHUNK_SIZE) {
        $frag = substr($sequence, $i, $CHUNK_SIZE);
        $results[] = analyze_fragment($frag, $index, $i+1);
        $index++;
    }
}

// ==== OUTPUT ====
echo json_encode([
    "input_length" => $len,
    "chunks"       => count($results),
    "fragments"    => $results
], JSON_PRETTY_PRINT);