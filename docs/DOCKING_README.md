# Module d'Amarrage Moléculaire Nexora

## Vue d'ensemble

Ce module implémente la fonctionnalité d'amarrage moléculaire selon les spécifications OFFICIELLES de Nexora. Il permet le docking moléculaire basé exclusivement sur la séquence protéique brute, conformément aux exigences scientifiques rigoureuses.

## Architecture Scientifique

### Flux Technique Exact

1. **Séquence Protéique Brute** (FASTA) → Base de données MySQL
2. **Modélisation 3D Temporaire** → MODELLER 10.2
3. **Préparation Récepteur** → AutoDock Tools
4. **Docking Moléculaire** → AutoDock Vina 1.2.3
5. **Résultats** → JSON + Visualisation 3D

### Technologies Utilisées

| Composant | Technologie | Version | Rôle |
|-----------|-------------|---------|------|
| Docking | AutoDock Vina | 1.2.3 | Calcul d'amarrage moléculaire |
| Modélisation 3D | MODELLER | 10.2 | Génération structure temporaire |
| Préparation | AutoDock Tools | - | Conversion PDB → PDBQT |
| Backend | PHP | 8.0+ | API et orchestration |
| Frontend | JavaScript ES6+ + Three.js | - | Interface et visualisation 3D |
| Base de données | MySQL | 8.0+ | Stockage séquences et résultats |

## Installation

### Prérequis

- Python 3.10+
- PHP 8.0+
- MySQL 8.0+
- Accès internet pour les dépendances

### Installation Automatisée

```bash
cd /home/empereur/Bureau/Nexora
./install_docking.sh
```

### Installation Manuelle

1. **Base de données**
   ```sql
   mysql -u root -p nexora_db < docking_schema.sql
   ```

2. **Python packages**
   ```bash
   pip3 install numpy scipy biopython pandas matplotlib seaborn
   ```

3. **AutoDock Vina**
   ```bash
   wget https://github.com/ccsb-scripps/AutoDock-Vina/releases/download/v1.2.3/vina_1.2.3_linux_x86_64.tar.gz
   tar -xzf vina_1.2.3_linux_x86_64.tar.gz
   sudo cp vina_1.2.3_linux_x86_64/bin/vina /usr/local/bin/
   ```

4. **MODELLER**
   - Télécharger depuis https://salilab.org/modeller/
   - Configurer la licence académique gratuite
   - Définir la variable d'environnement MODELLER

## Configuration

### Variables d'Environnement

```bash
export MODELLER_KEY="votre_clé_modeller"
export PATH=$PATH:/opt/mgltools/bin
```

### Configuration PHP

Assurez-vous que `api.php` a les permissions d'exécution et que le serveur web peut exécuter des scripts Python.

## Utilisation

### Interface Web

1. Accédez à Nexora via votre navigateur
2. Cliquez sur l'onglet "Amarrage"
3. Sélectionnez une analyse contenant une séquence protéique
4. Entrez un ligand en format SMILES (défaut: éthanol "CCO")
5. Cliquez sur "Lancer l'Amarrage"

### API Directe

```javascript
// Démarrer un docking
POST /api.php?action=start_docking
{
    "analysis_id": 123,
    "ligand_smiles": "CCO"
}

// Récupérer les résultats
GET /api.php?action=get_docking_results&analysis_id=123
```

### Ligne de Commande

```bash
python3 docking.py "MSTAVKQLALALAGV" "CCO"
```

## Résultats

### Format de Réponse

```json
{
    "success": true,
    "docking_score": -5.234,
    "binding_energy": -5.234,
    "execution_time": 45.67,
    "modeling_method": "modeller",
    "pose_data": {
        "atoms": [
            {"x": 1.23, "y": -2.45, "z": 0.67, "atom": "C", "residue": "ALA"},
            ...
        ]
    }
}
```

### Visualisation 3D

Les résultats incluent une visualisation 3D interactive avec Three.js:
- Rotation et zoom interactifs
- Coloration par type d'atome
- Animation automatique

## Validation Scientifique

### Contraintes Respectées

 **Aucune retranscription ADN/ARN**
 **Aucun réalignement génomique** 
 **Aucune interprétation par IA**
 **Aucune structure 3D persistée**
 **Docking basé exclusivement sur la séquence protéique brute**

### Hiérarchie Biologique

```
ADN/ARN (≤ 100 kb) → PROTÉINE (entrée canonique) → STRUCTURE 3D (temporaire) → INTERACTION MOLÉCULAIRE
```

## Dépannage

### Erreurs Communes

1. **MODELLER non trouvé**
   - Vérifiez l'installation et la variable MODELLER_KEY
   - Assurez-vous que MODELLER est dans votre PATH

2. **AutoDock Tools manquant**
   - Installez MGLTools: `conda install -c conda-forge mgltools`
   - Vérifiez prepare_receptor4.py et prepare_ligand4.py

3. **Permission denied**
   - `chmod +x docking.py`
   - Vérifiez les permissions du serveur web

4. **Base de données inaccessible**
   - Vérifiez les credentials dans `config.php`
   - Exécutez le schéma SQL

### Logs

- Logs Python: `docking.log`
- Logs PHP: Logs du serveur web
- Logs MySQL: Logs MySQL

## Performance

### Temps d'Exécution Typique

- Modélisation 3D: 10-30 secondes
- Préparation récepteur: 5-10 secondes 
- Docking Vina: 20-60 secondes
- **Total**: 1-2 minutes

### Limites

- Séquences protéiques: 10-2000 acides aminés
- Taille mémoire: < 1GB par docking
- Timeout: 10 minutes maximum

## Sécurité

### Mesures Implémentées

- Validation stricte des entrées
- Échappement des commandes shell
- Timeout sur les exécutions
- Nettoyage automatique des fichiers temporaires
- Pas de persistance des structures 3D

## Maintenance

### Nettoyage Automatique

- Structures temporaires: expiration 24h
- Logs: rotation hebdomadaire
- Cache: nettoyage toutes les heures

### Mises à Jour

- MODELLER: vérifier les mises à jour annuelles
- AutoDock Vina: suivre les releases GitHub
- Dépendances Python: mises à jour mensuelles

## Support

### Documentation Scientifique

- [MODELLER Manual](https://salilab.org/modeller/manual/)
- [AutoDock Vina Guide](http://vina.scripps.edu/)
- [AutoDock Tools Tutorial](https://ccsb.scripps.edu/mgltools/)

### Contact

Pour toute question technique ou scientifique concernant ce module:
- Développeur: Ibrahima Mohamed Diarra
- Version: 1.0.0
- Date: 2026-02-07

---

**Note**: Ce module respecte rigoureusement les spécifications OFFICIELLES de Nexora et garantit une reproductibilité totale avec une séparation stricte entre analyse génomique et modélisation interactionnelle.
