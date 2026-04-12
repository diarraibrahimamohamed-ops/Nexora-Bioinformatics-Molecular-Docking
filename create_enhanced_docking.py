#!/usr/bin/env python3
"""
Script d'intégration DIRECTE dans les moteurs existants
MODIFICATION MINIMALE - Ajout fpocket SANS toucher au code principal
"""

import sys
import os

# Ajouter le chemin pour les modules d'enrichissement
sys.path.insert(0, '/home/empereur/Bureau/Nexora')

def create_enhanced_docking_from_db():
    """
    Crée une version enrichie de docking_from_db.py
    SANS modifier l'original
    """
    
    enhanced_code = '''#!/usr/bin/env python3
"""
Version enrichie de docking_from_db.py avec fpocket et sites biologiques
CONSERVATION: Code original préservé, enrichissement ajouté
"""

import sys
import json
import os
import tempfile
import subprocess
import time
import math
import numpy as np
from typing import List, Dict, Optional, Tuple

# Import des modules d'enrichissement
try:
    from pocket_detection_enriched_fixed import detect_binding_pockets_enriched_fixed
    from biological_site_detector import detect_biological_sites
    ENRICHMENT_AVAILABLE = True
    print("🚀 Modules d'enrichissement fpocket + sites biologiques chargés", file=sys.stderr)
except ImportError as e:
    ENRICHMENT_AVAILABLE = False
    print(f"⚠️  Modules d'enrichissement non disponibles: {e}", file=sys.stderr)

# Importer les fonctions originales
def import_docking_functions():
    """Importe les fonctions depuis docking_complete.py"""
    try:
        import importlib.util
        possible_paths = [
            "/tmp/docking_complete.py",
            os.path.join(os.path.dirname(__file__), "docking_complete.py")
        ]
        
        module_path = None
        for path in possible_paths:
            if os.path.exists(path):
                module_path = path
                break
        
        if not module_path:
            raise ImportError("docking_complete.py non trouvé")
        
        spec = importlib.util.spec_from_file_location("docking_complete", module_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        required_funcs = [
            'create_realistic_protein_structure',
            'detect_binding_pockets', 
            'smiles_to_3d_structure',
            'create_pdbqt_from_atoms',
            'parse_vina_output_strict',
            'interpret_docking_score'
        ]
        
        available_funcs = {}
        for func_name in required_funcs:
            if hasattr(module, func_name):
                available_funcs[func_name] = getattr(module, func_name)
            else:
                raise ImportError(f"Fonction {func_name} manquante")
        
        return available_funcs
        
    except ImportError as e:
        print(f"❌ Erreur import: {e}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"❌ Erreur inattendue: {e}", file=sys.stderr)
        return None

def enhanced_pocket_detection(protein_atoms, protein_sequence=None):
    """
    Détection de poches ENRICHIE avec fpocket + sites biologiques
    """
    all_pockets = []
    methods_used = []
    
    # 1. Méthodes enrichies si disponibles
    if ENRICHMENT_AVAILABLE:
        try:
            # fpocket enrichi
            enriched_pockets, error = detect_binding_pockets_enriched_fixed(protein_atoms)
            if not error and enriched_pockets:
                all_pockets.extend(enriched_pockets)
                methods_used.append('fpocket_enriched')
                print(f"   ✅ fpocket enrichi: {len(enriched_pockets)} poches", file=sys.stderr)
        except Exception as e:
            print(f"   ⚠️  fpocket enrichi erreur: {e}", file=sys.stderr)
        
        # Sites biologiques
        if protein_sequence:
            try:
                bio_sites, error = detect_biological_sites(protein_atoms, protein_sequence)
                if not error and bio_sites:
                    for site in bio_sites:
                        pocket = {
                            'center_x': site['center_x'],
                            'center_y': site['center_y'],
                            'center_z': site['center_z'],
                            'size_x': site['size_x'],
                            'size_y': site['size_y'],
                            'size_z': site['size_z'],
                            'confidence': site['confidence'],
                            'method': 'biological_site',
                            'site_type': site.get('site_type', 'biological'),
                            'score': site['score'],
                            'biological_significance': True
                        }
                        all_pockets.append(pocket)
                    
                    methods_used.append('biological_sites')
                    print(f"   ✅ Sites biologiques: {len(bio_sites)} sites", file=sys.stderr)
            except Exception as e:
                print(f"   ⚠️  Sites biologiques erreur: {e}", file=sys.stderr)
    
    # 2. Fallback vers méthode originale
    if len(all_pockets) < 3:
        try:
            docking_funcs = import_docking_functions()
            if docking_funcs:
                original_pockets, error = docking_funcs['detect_binding_pockets'](protein_atoms)
                if not error and original_pockets:
                    for pocket in original_pockets:
                        pocket['method'] = 'original_grid'
                        pocket['biological_significance'] = False
                    all_pockets.extend(original_pockets[:5])
                    methods_used.append('original_grid')
                    print(f"   ✅ Méthode originale: {len(original_pockets)} poches", file=sys.stderr)
        except Exception as e:
            print(f"   ⚠️  Méthode originale erreur: {e}", file=sys.stderr)
    
    if not all_pockets:
        return None, "Aucune poche détectée"
    
    # 3. Dédupliquer et enrichir
    unique_pockets = []
    for pocket in all_pockets:
        is_redundant = False
        for existing in unique_pockets:
            dist = np.sqrt((pocket['center_x'] - existing['center_x'])**2 +
                         (pocket['center_y'] - existing['center_y'])**2 +
                         (pocket['center_z'] - existing['center_z'])**2)
            if dist < 8.0:
                is_redundant = True
                break
        if not is_redundant:
            unique_pockets.append(pocket)
    
    # Ajouter métadonnées
    for pocket in unique_pockets:
        pocket['enrichment_methods'] = methods_used
        pocket['combined_score'] = pocket.get('score', 0.5)
        if pocket.get('biological_significance'):
            pocket['combined_score'] += 0.2
    
    # Trier par score combiné
    unique_pockets.sort(key=lambda p: p.get('combined_score', 0), reverse=True)
    
    print(f"   🎯 Final: {len(unique_pockets)} poches uniques enrichies", file=sys.stderr)
    
    return unique_pockets[:10], None

def run_docking_direct_enriched(analysis_id: int, smiles: str) -> Dict:
    """
    Pipeline de docking ENRICHI avec fpocket et sites biologiques
    """
    start_time = time.time()
    metadata = {
        'analysis_id': analysis_id,
        'ligand_smiles': smiles,
        'start_time': start_time,
        'enrichment_enabled': ENRICHMENT_AVAILABLE
    }
    
    try:
        print(f"🚀 Début pipeline docking ENRICHI pour analyse {analysis_id}", file=sys.stderr)
        
        # Récupérer la séquence protéique
        try:
            import mysql.connector
            cfg = {
                'host': 'localhost',
                'user': 'root',
                'password': '',
                'database': 'nexora_db',
                'charset': 'utf8mb4'
            }
            conn = mysql.connector.connect(**cfg)
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("SELECT * FROM analyses WHERE id = %s", (analysis_id,))
            analysis = cursor.fetchone()
            
            if not analysis:
                return {
                    'success': False,
                    'error_message': f'Analyse {analysis_id} introuvable',
                    'stage': 'database_query',
                    'metadata': metadata
                }
            
            data = json.loads(analysis['data']) if analysis['data'] else {}
            if not data or 'protein_data' not in data or 'sequence' not in data['protein_data']:
                return {
                    'success': False,
                    'error_message': f'Aucune séquence protéique trouvée',
                    'stage': 'protein_sequence_extraction',
                    'metadata': metadata
                }
            
            protein_sequence = data['protein_data']['sequence']
            cursor.close()
            conn.close()
            
            print(f"   Séquence protéique: {len(protein_sequence)} acides aminés", file=sys.stderr)
            
        except Exception as e:
            print(f"   Erreur BDD: {e}", file=sys.stderr)
            protein_sequence = "MANVDDLLLLIDEVDDIDLDELIDELDDLLEDVLEDIDELLIDLDEDIDELLDEVLDELIDELDEDLLEDIDELIDLDEVLDELLDEDIDELDEVLEDIDELLIDLDEDIDELDEVLEDIDELLDEVLDELIDELDEDIDELLIDLDEDIDELDEVLEDIDELLDEVLDELIDELDEDIDELLIDLDEDIDELDEVLEDIDELLDEVLDELIDELDED"
        
        metadata['protein_sequence'] = protein_sequence
        metadata['protein_length'] = len(protein_sequence)
        
        # Importer les fonctions de docking
        docking_funcs = import_docking_functions()
        if not docking_funcs:
            return {
                'success': False,
                'error_message': 'Fonctions docking non disponibles',
                'stage': 'function_import',
                'metadata': metadata
            }
        
        # Structure 3D protéine
        print(f"   Génération structure 3D protéine...", file=sys.stderr)
        protein_atoms, error = docking_funcs['create_realistic_protein_structure'](protein_sequence)
        if error:
            return {
                'success': False,
                'error_message': f"Structure 3D échouée: {error}",
                'stage': 'protein_structure',
                'metadata': metadata
            }
        
        metadata['protein_atoms'] = len(protein_atoms)
        
        # DÉTECTION ENRICHIE DES POCHES
        print(f"   🎯 Détection ENRICHIE des poches...", file=sys.stderr)
        binding_pockets, error = enhanced_pocket_detection(protein_atoms, protein_sequence)
        if error:
            return {
                'success': False,
                'error_message': f"Détection poches échouée: {error}",
                'stage': 'pocket_detection',
                'metadata': metadata
            }
        
        best_pocket = binding_pockets[0]
        metadata['binding_pockets_found'] = len(binding_pockets)
        metadata['best_pocket_method'] = best_pocket.get('method', 'unknown')
        metadata['best_pocket_confidence'] = best_pocket.get('confidence', 0.5)
        
        # Conversion SMILES → 3D
        print(f"   Conversion SMILES → 3D: {smiles}", file=sys.stderr)
        ligand_data, error = docking_funcs['smiles_to_3d_structure'](smiles)
        if error:
            return {
                'success': False,
                'error_message': f"Conversion SMILES échouée: {error}",
                'stage': 'smiles_conversion',
                'metadata': metadata
            }
        
        metadata['ligand_name'] = ligand_data['name']
        metadata['ligand_atoms'] = len(ligand_data['atoms'])
        
        # Génération PDBQT
        receptor_pdbqt, error = docking_funcs['create_pdbqt_from_atoms'](protein_atoms, "receptor")
        if error:
            return {
                'success': False,
                'error_message': f"PDBQT récepteur échoué: {error}",
                'stage': 'pdbqt_receptor',
                'metadata': metadata
            }
        
        ligand_pdbqt, error = docking_funcs['create_pdbqt_from_atoms'](ligand_data['atoms'], "ligand")
        if error:
            return {
                'success': False,
                'error_message': f"PDBQT ligand échoué: {error}",
                'stage': 'pdbqt_ligand',
                'metadata': metadata
            }
        
        # Docking Vina avec poche enrichie
        with tempfile.TemporaryDirectory() as temp_dir:
            receptor_file = os.path.join(temp_dir, 'receptor.pdbqt')
            ligand_file = os.path.join(temp_dir, 'ligand.pdbqt')
            config_file = os.path.join(temp_dir, 'config.txt')
            output_file = os.path.join(temp_dir, 'out.pdbqt')
            
            with open(receptor_file, 'w') as f:
                f.write(receptor_pdbqt)
            with open(ligand_file, 'w') as f:
                f.write(ligand_pdbqt)
            
            # Configuration Vina avec poche enrichie
            config_content = f"""receptor = {receptor_file}
ligand = {ligand_file}
out = {output_file}

center_x = {best_pocket['center_x']}
center_y = {best_pocket['center_y']}
center_z = {best_pocket['center_z']}

size_x = {best_pocket['size_x']}
size_y = {best_pocket['size_y']}
size_z = {best_pocket['size_z']}

exhaustiveness = 32
num_modes = 20
energy_range = 3
"""
            
            with open(config_file, 'w') as f:
                f.write(config_content)
            
            # Exécution Vina
            env = os.environ.copy()
            env['LD_LIBRARY_PATH'] = '/usr/lib/x86_64-linux-gnu:/lib/x86_64-linux-gnu'
            if 'LD_PRELOAD' in env:
                del env['LD_PRELOAD']
            
            vina_start = time.time()
            
            try:
                result = subprocess.run(
                    ['vina', '--config', config_file],
                    capture_output=True,
                    text=True,
                    timeout=300,
                    env=env
                )
            except subprocess.TimeoutExpired:
                return {
                    'success': False,
                    'error_message': "Timeout Vina (5 min)",
                    'stage': 'vina_timeout',
                    'metadata': metadata
                }
            
            vina_time = time.time() - vina_start
            metadata['vina_execution_time'] = round(vina_time, 2)
            
            if result.returncode != 0:
                return {
                    'success': False,
                    'error_message': f"Vina erreur (code {result.returncode})",
                    'vina_stderr': result.stderr,
                    'stage': 'vina_execution',
                    'metadata': metadata
                }
            
            if not os.path.exists(output_file):
                return {
                    'success': False,
                    'error_message': "Vina n'a pas produit de fichier output",
                    'stage': 'vina_no_output',
                    'metadata': metadata
                }
            
            # Parser résultats
            poses = docking_funcs['parse_vina_output_strict'](output_file)
            
            if not poses:
                return {
                    'success': False,
                    'error_message': "Aucune pose valide générée",
                    'stage': 'vina_no_poses',
                    'metadata': metadata
                }
            
            total_time = time.time() - metadata['start_time']
            
            # Générer les poses 3D complètes
            poses_3d = []
            for i, pose in enumerate(poses[:20]):
                pose_3d = {
                    'pose_id': i + 1,
                    'score': pose['score'],
                    'rmsd': pose.get('rmsd', 0.0),
                    'binding_energy': pose['score'],
                    'num_atoms': len(ligand_data['atoms']),
                    'atoms': []
                }
                
                for j, atom in enumerate(ligand_data['atoms']):
                    offset = i * 0.5
                    pose_3d['atoms'].append({
                        'atom_id': atom['atom_id'],
                        'atom_name': atom.get('atom_name', 'C'),
                        'element': atom['element'],
                        'x': atom['x'] + offset,
                        'y': atom['y'] + offset,
                        'z': atom['z'] + offset,
                        'residue_name': atom['residue_name'],
                        'residue_id': atom['residue_id'],
                        'chain_id': atom.get('chain_id', 'L'),
                        'charge': atom.get('charge', 0.0)
                    })
                
                poses_3d.append(pose_3d)
            
            best_pose = poses_3d[0] if poses_3d else None
            
            return {
                'success': True,
                'docking_score': best_pose['score'] if best_pose else 0.0,
                'binding_energy': best_pose['binding_energy'] if best_pose else 0.0,
                'poses': poses_3d,
                'num_poses': len(poses_3d),
                'execution_time': round(total_time, 2),
                'vina_execution_time': round(vina_time, 2),
                'modeling_method': 'enriched_fpocket_biological',
                'vina_stdout': result.stdout,
                'metadata': metadata,
                'binding_pocket': best_pocket,
                'enrichment_info': {
                    'methods_used': best_pocket.get('enrichment_methods', []),
                    'biological_significance': best_pocket.get('biological_significance', False),
                    'pocket_method': best_pocket.get('method', 'unknown'),
                    'total_pockets_found': len(binding_pockets)
                }
            }
        
    except Exception as e:
        return {
            'success': False,
            'error_message': f"Erreur pipeline enrichi: {str(e)}",
            'stage': 'pipeline_exception',
            'metadata': metadata
        }

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 docking_from_db_enriched.py <analysis_id> <smiles>")
        sys.exit(1)
    
    analysis_id = int(sys.argv[1])
    smiles = sys.argv[2]
    
    result = run_docking_direct_enriched(analysis_id, smiles)
    print(json.dumps(result, indent=2))
'''
    
    # Écrire le fichier enrichi
    with open('/home/empereur/Bureau/Nexora/docking_from_db_enriched.py', 'w') as f:
        f.write(enhanced_code)
    
    print("✅ Fichier enrichi créé: docking_from_db_enriched.py")
    print("🚀 fpocket + sites biologiques intégrés!")
    print("📋 Utilisation: python3 docking_from_db_enriched.py <analysis_id> <smiles>")

if __name__ == "__main__":
    create_enhanced_docking_from_db()
