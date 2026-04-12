#!/usr/bin/env python3
"""
Module d'enrichissement CORRIGÉ pour la détection de sites actifs
Version avec fpocket corrigé et fallbacks robustes
"""

import os
import subprocess
import tempfile
import json
import numpy as np
from typing import List, Dict, Optional, Tuple
import re

class PocketDetectorEnrichedFixed:
    """
    Classe d'enrichissement CORRIGÉE pour la détection de poches de liaison
    """
    
    def __init__(self):
        self.fpocket_available = self._check_fpocket()
        self.methods_available = []
        if self.fpocket_available:
            self.methods_available.append('fpocket')
    
    def _check_fpocket(self) -> bool:
        """Vérifie si fpocket est disponible"""
        try:
            result = subprocess.run(['fpocket', '--version'], 
                                  capture_output=True, text=True, timeout=10)
            return result.returncode == 0
        except:
            return False
    
    def detect_pockets_fpocket(self, protein_atoms: List[Dict]) -> Tuple[Optional[List[Dict]], Optional[str]]:
        """
        Détection des poches avec fpocket (VERSION CORRIGÉE)
        """
        if not self.fpocket_available:
            return None, "fpocket n'est pas installé"
        
        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                # Créer fichier PDB temporaire
                pdb_file = os.path.join(temp_dir, 'protein.pdb')
                self._write_pdb_from_atoms(protein_atoms, pdb_file)
                
                # Exécuter fpocket avec options silencieuses
                cmd = ['fpocket', '-f', pdb_file]
                result = subprocess.run(cmd, capture_output=True, text=True, 
                                    timeout=120, cwd=temp_dir)
                
                # Vérifier si fpocket a bien fonctionné
                if result.returncode != 0:
                    print(f"⚠️  fpocket stderr: {result.stderr}", file=sys.stderr)
                    return None, f"fpocket erreur: {result.stderr}"
                
                # Chercher les fichiers de résultats
                output_dir = os.path.join(temp_dir, 'protein_out')
                if not os.path.exists(output_dir):
                    return None, "Répertoire de sortie fpocket non créé"
                
                # Parser les résultats depuis plusieurs sources
                pockets = []
                
                # Essayer de parser pockets_info.txt
                info_file = os.path.join(output_dir, 'pockets_info.txt')
                if os.path.exists(info_file):
                    pockets.extend(self._parse_fpocket_info_file(info_file))
                
                # Essayer de parser les fichiers .pdb individuels
                pdb_files = [f for f in os.listdir(output_dir) if f.startswith('pocket') and f.endswith('.pdb')]
                for pdb_file_name in pdb_files:
                    pocket_id = int(pdb_file_name.replace('pocket', '').replace('.pdb', ''))
                    pocket_file = os.path.join(output_dir, pdb_file_name)
                    pocket_data = self._parse_pocket_pdb_file(pocket_file, pocket_id)
                    if pocket_data:
                        pockets.append(pocket_data)
                
                if not pockets:
                    return None, "Aucune poche détectée par fpocket (parsing échoué)"
                
                # Trier et enrichir
                pockets.sort(key=lambda p: p.get('score', 0), reverse=True)
                
                # Ajouter des informations supplémentaires
                for pocket in pockets:
                    pocket['method'] = 'fpocket_fixed'
                    pocket['size_x'] = 20.0  # Taille par défaut
                    pocket['size_y'] = 20.0
                    pocket['size_z'] = 20.0
                    pocket['confidence'] = min(pocket.get('score', 0.5) / 100.0, 1.0)
                
                return pockets[:10], None
                
        except subprocess.TimeoutExpired:
            return None, "fpocket timeout (120s)"
        except Exception as e:
            return None, f"Erreur fpocket: {str(e)}"
    
    def _write_pdb_from_atoms(self, atoms: List[Dict], pdb_file: str):
        """Écrit les atomes au format PDB standard CORRIGÉ"""
        with open(pdb_file, 'w') as f:
            for i, atom in enumerate(atoms):
                # Format PDB standard avec numéros atomiques valides
                atom_num = (i % 99999) + 1  # Éviter les numéros > 99999
                res_num = (atom.get('residue_id', 1) % 9999) + 1
                
                # Nettoyer les noms
                atom_name = atom.get('atom_name', 'C')[:4]
                residue_name = atom.get('residue_name', 'UNK')[:3]
                element = atom['element'][:2]
                
                line = f"ATOM  {atom_num:5d} {atom_name:<4s} {residue_name:>3s} A{res_num:4d}    {atom['x']:8.3f}{atom['y']:8.3f}{atom['z']:8.3f}  1.00  0.00          {element:>2s}\n"
                f.write(line)
            
            # Ajouter END
            f.write("END\n")
    
    def _parse_fpocket_info_file(self, info_file: str) -> List[Dict]:
        """Parse le fichier pockets_info.txt de fpocket"""
        pockets = []
        
        try:
            with open(info_file, 'r') as f:
                content = f.read()
            
            # Parser les lignes de données
            lines = content.strip().split('\n')
            
            for line in lines:
                line = line.strip()
                if line.startswith('#') or not line:
                    continue
                
                # Format typique: pocket_id score nb_alpha nb_spheres volume
                parts = line.split()
                if len(parts) >= 4:
                    try:
                        pocket_id = int(parts[0])
                        score = float(parts[1])
                        nb_alpha = int(parts[2])
                        nb_spheres = int(parts[3])
                        
                        pockets.append({
                            'pocket_id': pocket_id,
                            'score': score,
                            'nb_alpha_spheres': nb_alpha,
                            'nb_spheres': nb_spheres,
                            'volume': 0.0  # Sera calculé si disponible
                        })
                    except (ValueError, IndexError):
                        continue
            
        except Exception as e:
            print(f"⚠️  Erreur parsing pockets_info.txt: {e}", file=sys.stderr)
        
        return pockets
    
    def _parse_pocket_pdb_file(self, pocket_file: str, pocket_id: int) -> Optional[Dict]:
        """Parse un fichier de poche individuel (.pdb)"""
        try:
            atoms = []
            with open(pocket_file, 'r') as f:
                for line in f:
                    if line.startswith('ATOM') or line.startswith('HETATM'):
                        try:
                            x = float(line[30:38].strip())
                            y = float(line[38:46].strip())
                            z = float(line[46:54].strip())
                            atoms.append({'x': x, 'y': y, 'z': z})
                        except (ValueError, IndexError):
                            continue
            
            if atoms:
                # Calculer le centre de la poche
                center_x = np.mean([a['x'] for a in atoms])
                center_y = np.mean([a['y'] for a in atoms])
                center_z = np.mean([a['z'] for a in atoms])
                
                return {
                    'pocket_id': pocket_id,
                    'center_x': center_x,
                    'center_y': center_y,
                    'center_z': center_z,
                    'atoms_count': len(atoms),
                    'score': 50.0 + pocket_id * 10  # Score par défaut
                }
        
        except Exception as e:
            print(f"⚠️  Erreur parsing poche {pocket_id}: {e}", file=sys.stderr)
        
        return None
    
    def detect_pockets_alternative_methods(self, protein_atoms: List[Dict]) -> Tuple[Optional[List[Dict]], Optional[str]]:
        """
        Méthodes alternatives de détection de poches
        """
        pockets = []
        
        # Méthode 1: Détection par densité atomique
        density_pockets = self._detect_by_atomic_density(protein_atoms)
        pockets.extend(density_pockets)
        
        # Méthode 2: Détection par cavités géométriques
        cavity_pockets = self._detect_by_geometric_cavities(protein_atoms)
        pockets.extend(cavity_pockets)
        
        # Méthode 3: Détection par clusters de résidus hydrophobes
        hydrophobic_pockets = self._detect_hydrophobic_clusters(protein_atoms)
        pockets.extend(hydrophobic_pockets)
        
        if not pockets:
            return None, "Aucune poche détectée par les méthodes alternatives"
        
        # Dédupliquer et enrichir
        unique_pockets = self._remove_redundant_pockets(pockets)
        
        for pocket in unique_pockets:
            pocket['method'] = 'alternative_enhanced'
            pocket['confidence'] = pocket.get('score', 0.5)
        
        return unique_pockets[:8], None
    
    def _detect_by_atomic_density(self, atoms: List[Dict]) -> List[Dict]:
        """Détection par analyse de densité atomique"""
        pockets = []
        
        if len(atoms) < 50:
            return pockets
        
        # Calculer le centre de masse
        center_x = np.mean([a['x'] for a in atoms])
        center_y = np.mean([a['y'] for a in atoms])
        center_z = np.mean([a['z'] for a in atoms])
        
        # Grille 3D pour l'analyse de densité
        grid_size = 3.0
        search_radius = 15.0
        
        for dx in np.arange(-search_radius, search_radius, grid_size):
            for dy in np.arange(-search_radius, search_radius, grid_size):
                for dz in np.arange(-search_radius, search_radius, grid_size):
                    test_x = center_x + dx
                    test_y = center_y + dy
                    test_z = center_z + dz
                    
                    # Compter les atomes voisins
                    nearby_count = 0
                    for atom in atoms:
                        dist = np.sqrt((atom['x'] - test_x)**2 + 
                                     (atom['y'] - test_y)**2 + 
                                     (atom['z'] - test_z)**2)
                        if dist < 6.0:
                            nearby_count += 1
                    
                    # Si densité appropriée pour une poche
                    if 8 <= nearby_count <= 20:
                        density_score = nearby_count / 20.0
                        
                        pockets.append({
                            'center_x': test_x,
                            'center_y': test_y,
                            'center_z': test_z,
                            'score': density_score,
                            'size_x': 18.0,
                            'size_y': 18.0,
                            'size_z': 18.0,
                            'detection_method': 'atomic_density',
                            'nearby_atoms': nearby_count
                        })
        
        return pockets[:5]
    
    def _detect_by_geometric_cavities(self, atoms: List[Dict]) -> List[Dict]:
        """Détection par analyse de cavités géométriques"""
        pockets = []
        
        # Simplification: chercher les régions avec peu d'atomes proches
        # mais entourées par des atomes plus lointains
        
        if len(atoms) < 30:
            return pockets
        
        # Points de test sur une grille
        min_x = min(a['x'] for a in atoms) - 5
        max_x = max(a['x'] for a in atoms) + 5
        min_y = min(a['y'] for a in atoms) - 5
        max_y = max(a['y'] for a in atoms) + 5
        min_z = min(a['z'] for a in atoms) - 5
        max_z = max(a['z'] for a in atoms) + 5
        
        grid_step = 4.0
        
        for x in np.arange(min_x, max_x, grid_step):
            for y in np.arange(min_y, max_y, grid_step):
                for z in np.arange(min_z, max_z, grid_step):
                    # Compter les atomes à différentes distances
                    close_atoms = sum(1 for a in atoms if np.sqrt((a['x']-x)**2 + (a['y']-y)**2 + (a['z']-z)**2) < 4.0)
                    medium_atoms = sum(1 for a in atoms if 4.0 <= np.sqrt((a['x']-x)**2 + (a['y']-y)**2 + (a['z']-z)**2) < 8.0)
                    
                    # Cavité potentielle: peu d'atomes proches, entourée par des atomes moyens
                    if close_atoms <= 2 and medium_atoms >= 6:
                        cavity_score = medium_atoms / (close_atoms + 1) / 10.0
                        
                        pockets.append({
                            'center_x': x,
                            'center_y': y,
                            'center_z': z,
                            'score': min(cavity_score, 1.0),
                            'size_x': 16.0,
                            'size_y': 16.0,
                            'size_z': 16.0,
                            'detection_method': 'geometric_cavity',
                            'close_atoms': close_atoms,
                            'medium_atoms': medium_atoms
                        })
        
        return pockets[:3]
    
    def _detect_hydrophobic_clusters(self, atoms: List[Dict]) -> List[Dict]:
        """Détection de clusters de résidus hydrophobes"""
        pockets = []
        
        # Identifier les atomes hydrophobes
        hydrophobic_elements = ['C']
        hydrophobic_residues = ['ALA', 'VAL', 'LEU', 'ILE', 'MET', 'PHE', 'TRP', 'PRO']
        
        hydrophobic_atoms = []
        for atom in atoms:
            element = atom['element']
            residue = atom.get('residue_name', '')
            
            if element in hydrophobic_elements or residue in hydrophobic_residues:
                hydrophobic_atoms.append(atom)
        
        if len(hydrophobic_atoms) < 10:
            return pockets
        
        # Chercher les clusters
        cluster_radius = 6.0
        used = set()
        
        for i, atom in enumerate(hydrophobic_atoms):
            if i in used:
                continue
            
            cluster = [atom]
            used.add(i)
            
            for j, other in enumerate(hydrophobic_atoms):
                if j in used:
                    continue
                
                dist = np.sqrt((atom['x'] - other['x'])**2 + 
                             (atom['y'] - other['y'])**2 + 
                             (atom['z'] - other['z'])**2)
                
                if dist < cluster_radius:
                    cluster.append(other)
                    used.add(j)
            
            if len(cluster) >= 5:
                # Calculer le centre du cluster
                center_x = np.mean([a['x'] for a in cluster])
                center_y = np.mean([a['y'] for a in cluster])
                center_z = np.mean([a['z'] for a in cluster])
                
                pockets.append({
                    'center_x': center_x,
                    'center_y': center_y,
                    'center_z': center_z,
                    'score': min(len(cluster) / 15.0, 1.0),
                    'size_x': 14.0,
                    'size_y': 14.0,
                    'size_z': 14.0,
                    'detection_method': 'hydrophobic_cluster',
                    'cluster_size': len(cluster)
                })
        
        return pockets[:3]
    
    def _remove_redundant_pockets(self, pockets: List[Dict], min_distance: float = 8.0) -> List[Dict]:
        """Élimine les poches redondantes"""
        if not pockets:
            return []
        
        unique_pockets = [pockets[0]]
        
        for pocket in pockets[1:]:
            is_redundant = False
            for existing in unique_pockets:
                dist = np.sqrt((pocket['center_x'] - existing['center_x'])**2 +
                             (pocket['center_y'] - existing['center_y'])**2 +
                             (pocket['center_z'] - existing['center_z'])**2)
                if dist < min_distance:
                    # Garder la poche avec le meilleur score
                    if pocket.get('score', 0) > existing.get('score', 0):
                        unique_pockets.remove(existing)
                        unique_pockets.append(pocket)
                    is_redundant = True
                    break
            
            if not is_redundant:
                unique_pockets.append(pocket)
        
        return unique_pockets

# Instance globale
pocket_detector_enriched_fixed = PocketDetectorEnrichedFixed()

def detect_binding_pockets_enriched_fixed(protein_atoms: List[Dict]) -> Tuple[Optional[List[Dict]], Optional[str]]:
    """
    Fonction wrapper CORRIGÉE pour la détection de poches
    """
    pockets = []
    methods_used = []
    
    # Essayer fpocket corrigé d'abord
    if pocket_detector_enriched_fixed.fpocket_available:
        fpocket_pockets, error = pocket_detector_enriched_fixed.detect_pockets_fpocket(protein_atoms)
        if not error and fpocket_pockets:
            pockets.extend(fpocket_pockets)
            methods_used.append('fpocket_fixed')
    
    # Ajouter les méthodes alternatives
    alt_pockets, error = pocket_detector_enriched_fixed.detect_pockets_alternative_methods(protein_atoms)
    if not error and alt_pockets:
        pockets.extend(alt_pockets)
        if 'alternative' not in methods_used:
            methods_used.append('alternative')
    
    if not pockets:
        return None, "Aucune poche détectée par les méthodes enrichies"
    
    # Dédupliquer et enrichir
    unique_pockets = pocket_detector_enriched_fixed._remove_redundant_pockets(pockets)
    
    for pocket in unique_pockets:
        pocket['enrichment_methods'] = methods_used
        pocket['combined_score'] = pocket.get('score', 0.5)
    
    # Trier par score combiné
    unique_pockets.sort(key=lambda p: p.get('combined_score', 0), reverse=True)
    
    return unique_pockets[:10], None
