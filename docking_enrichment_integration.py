#!/usr/bin/env python3
"""
Module d'enrichissement principal - Intégration sans modification des codes existants
Permet d'ajouter fpocket et autres détecteurs aux moteurs de docking existants
CONSERVATION: Ne modifie PAS les codes existants
"""

import sys
import os
import json
from typing import List, Dict, Optional, Tuple

# Importer les modules d'enrichissement
try:
    from pocket_detection_enriched import detect_binding_pockets_enriched
    from biological_site_detector import detect_biological_sites
except ImportError as e:
    print(f"⚠️  Modules d'enrichissement non disponibles: {e}", file=sys.stderr)
    detect_binding_pockets_enriched = None
    detect_biological_sites = None

class DockingEnrichmentManager:
    """
    Gestionnaire d'enrichissement pour les moteurs de docking existants
    S'interface SANS modifier les codes originaux
    """
    
    def __init__(self):
        self.enrichment_enabled = True
        self.methods_available = []
        
        if detect_binding_pockets_enriched:
            self.methods_available.append('fpocket_enhanced')
        if detect_biological_sites:
            self.methods_available.append('biological_sites')
        
        print(f"📊 Méthodes d'enrichissement disponibles: {self.methods_available}", file=sys.stderr)
    
    def enhance_pocket_detection(self, protein_atoms: List[Dict], protein_sequence: str = None, 
                              use_original_method: bool = True) -> Tuple[Optional[List[Dict]], Optional[str]]:
        """
        Enrichit la détection de poches avec fpocket ET sites biologiques
        Préserve la méthode originale comme fallback
        """
        all_pockets = []
        methods_used = []
        
        # 1. Essayer les méthodes enrichies d'abord
        if detect_binding_pockets_enriched:
            try:
                enriched_pockets, error = detect_binding_pockets_enriched(protein_atoms)
                if not error and enriched_pockets:
                    all_pockets.extend(enriched_pockets)
                    methods_used.append('fpocket_enhanced')
                    print(f"   ✅ fpocket enrichi: {len(enriched_pockets)} poches détectées", file=sys.stderr)
            except Exception as e:
                print(f"   ⚠️  fpocket enrichi erreur: {e}", file=sys.stderr)
        
        # 2. Ajouter les sites biologiques
        if detect_biological_sites and protein_sequence:
            try:
                bio_sites, error = detect_biological_sites(protein_atoms, protein_sequence)
                if not error and bio_sites:
                    # Convertir les sites biologiques en format poche
                    for site in bio_sites:
                        pocket = {
                            'center_x': site['center_x'],
                            'center_y': site['center_y'],
                            'center_z': site['center_z'],
                            'size_x': site['size_x'],
                            'size_y': site['size_y'],
                            'size_z': site['size_z'],
                            'confidence': site['confidence'],
                            'method': site['method'],
                            'site_type': site.get('site_type', 'biological'),
                            'description': site.get('description', ''),
                            'score': site['score'],
                            'biological_significance': True
                        }
                        all_pockets.append(pocket)
                    
                    methods_used.append('biological_sites')
                    print(f"   ✅ Sites biologiques: {len(bio_sites)} sites détectés", file=sys.stderr)
            except Exception as e:
                print(f"   ⚠️  Sites biologiques erreur: {e}", file=sys.stderr)
        
        # 3. Utiliser la méthode originale si demandé et si aucune poche enrichie
        if use_original_method and len(all_pockets) < 3:
            try:
                # Import dynamique de la fonction originale (sans la modifier)
                from docking_complete import detect_binding_pockets as original_detection
                
                original_pockets, error = original_detection(protein_atoms)
                if not error and original_pockets:
                    # Marquer comme méthode originale
                    for pocket in original_pockets:
                        pocket['method'] = 'original_grid'
                        pocket['biological_significance'] = False
                    
                    all_pockets.extend(original_pockets[:5])  # Limiter pour éviter surcharge
                    methods_used.append('original_grid')
                    print(f"   ✅ Méthode originale: {len(original_pockets)} poches détectées", file=sys.stderr)
            except Exception as e:
                print(f"   ⚠️  Méthode originale erreur: {e}", file=sys.stderr)
        
        if not all_pockets:
            return None, "Aucune poche détectée par aucune méthode"
        
        # 4. Fusionner et dédupliquer
        unique_pockets = self._merge_and_deduplicate_pockets(all_pockets)
        
        # 5. Ajouter métadonnées d'enrichissement
        for pocket in unique_pockets:
            pocket['enrichment_methods'] = methods_used
            pocket['enrichment_score'] = self._calculate_enrichment_score(pocket, methods_used)
        
        # 6. Trier par score d'enrichissement
        unique_pockets.sort(key=lambda p: p['enrichment_score'], reverse=True)
        
        print(f"   🎯 Final: {len(unique_pockets)} poches uniques avec enrichissement", file=sys.stderr)
        
        return unique_pockets[:15], None  # Top 15 pour éviter surcharge
    
    def _merge_and_deduplicate_pockets(self, pockets: List[Dict], min_distance: float = 8.0) -> List[Dict]:
        """Fusionne et déduplique les poches de différentes méthodes"""
        if not pockets:
            return []
        
        # Trier par confiance d'abord
        pockets.sort(key=lambda p: p.get('confidence', 0.5), reverse=True)
        
        unique_pockets = []
        
        for pocket in pockets:
            is_redundant = False
            
            for existing in unique_pockets:
                dist = ((pocket['center_x'] - existing['center_x'])**2 +
                        (pocket['center_y'] - existing['center_y'])**2 +
                        (pocket['center_z'] - existing['center_z'])**2)**0.5
                
                if dist < min_distance:
                    # Fusionner les informations
                    if pocket.get('biological_significance') and not existing.get('biological_significance'):
                        # Donner priorité aux sites biologiques
                        unique_pockets.remove(existing)
                        unique_pockets.append(pocket)
                    elif pocket.get('confidence', 0.5) > existing.get('confidence', 0.5):
                        # Remplacer si meilleure confiance
                        unique_pockets.remove(existing)
                        unique_pockets.append(pocket)
                    
                    is_redundant = True
                    break
            
            if not is_redundant:
                unique_pockets.append(pocket)
        
        return unique_pockets
    
    def _calculate_enrichment_score(self, pocket: Dict, methods_used: List[str]) -> float:
        """Calcule un score d'enrichissement combiné"""
        base_score = pocket.get('score', pocket.get('confidence', 0.5))
        
        # Bonus pour les méthodes enrichies
        method_bonus = 0
        if 'fpocket_enhanced' in methods_used:
            method_bonus += 0.2
        if 'biological_sites' in methods_used:
            method_bonus += 0.3
        
        # Bonus pour la signification biologique
        bio_bonus = 0.4 if pocket.get('biological_significance') else 0
        
        # Score final combiné
        final_score = min(base_score + method_bonus + bio_bonus, 1.0)
        
        return round(final_score, 3)
    
    def get_enrichment_report(self, pockets: List[Dict]) -> Dict:
        """Génère un rapport d'enrichissement détaillé"""
        if not pockets:
            return {'error': 'Aucune poche à analyser'}
        
        report = {
            'total_pockets': len(pockets),
            'methods_used': list(set([p.get('method', 'unknown') for p in pockets])),
            'biological_sites': sum(1 for p in pockets if p.get('biological_significance')),
            'fpocket_sites': sum(1 for p in pockets if 'fpocket' in p.get('method', '')),
            'average_confidence': sum(p.get('confidence', 0.5) for p in pockets) / len(pockets),
            'high_confidence_pockets': sum(1 for p in pockets if p.get('confidence', 0.5) > 0.7),
            'pocket_types': {}
        }
        
        # Analyser les types de sites
        for pocket in pockets:
            site_type = pocket.get('site_type', 'unknown')
            if site_type not in report['pocket_types']:
                report['pocket_types'][site_type] = 0
            report['pocket_types'][site_type] += 1
        
        return report

# Instance globale pour utilisation facile
docking_enrichment_manager = DockingEnrichmentManager()

def enhanced_detect_binding_pockets(protein_atoms: List[Dict], protein_sequence: str = None) -> Tuple[Optional[List[Dict]], Optional[str]]:
    """
    Fonction wrapper REMPLAÇANT la détection de poches originale
    PEUT être utilisée pour remplacer l'appel dans les codes existants SANS les modifier
    """
    return docking_enrichment_manager.enhance_pocket_detection(
        protein_atoms, 
        protein_sequence,
        use_original_method=True  # Conserver la méthode originale comme fallback
    )

# Fonction d'intégration pour docking_from_db.py
def integrate_enhanced_detection_in_docking_from_db():
    """
    Instructions d'intégration pour docking_from_db.py
    SANS modifier le fichier original
    """
    integration_code = '''
# DANS docking_from_db.py - AUTOUR DE LA LIGNE 160:
# REMPLACER:
# binding_pockets, error = docking_funcs['detect_binding_pockets'](protein_atoms)

# PAR:
try:
    from docking_enrichment_integration import enhanced_detect_binding_pockets
    binding_pockets, error = enhanced_detect_binding_pockets(protein_atoms, metadata.get('protein_sequence'))
except ImportError:
    # Fallback vers méthode originale
    binding_pockets, error = docking_funcs['detect_binding_pockets'](protein_atoms)
'''
    
    return integration_code

# Fonction d'intégration pour docking_complete.py  
def integrate_enhanced_detection_in_docking_complete():
    """
    Instructions d'intégration pour docking_complete.py
    SANS modifier le fichier original
    """
    integration_code = '''
# DANS docking_complete.py - AUTOUR DE LA LIGNE 834:
# REMPLACER:
# candidate_pockets, error = detect_binding_pockets(protein_atoms)

# PAR:
try:
    from docking_enrichment_integration import enhanced_detect_binding_pockets
    candidate_pockets, error = enhanced_detect_binding_pockets(protein_atoms)
except ImportError:
    # Fallback vers méthode originale
    candidate_pockets, error = detect_binding_pockets(protein_atoms)
'''
    
    return integration_code

if __name__ == "__main__":
    print("🧪 Module d'enrichissement de docking initialisé")
    print(f"📊 Méthodes disponibles: {docking_enrichment_manager.methods_available}")
    print("\n📋 Instructions d'intégration:")
    print("1. Importer: from docking_enrichment_integration import enhanced_detect_binding_pockets")
    print("2. Remplacer l'appel de detect_binding_pockets() par enhanced_detect_binding_pockets()")
    print("3. Les codes originaux ne sont PAS modifiés!")
