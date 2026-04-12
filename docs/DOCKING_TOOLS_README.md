# Outils de Docking Moléculaire - Installation Complète

##  Liste des Outils à Installer

###  Logiciels Principaux
1. **MODELLER 10.2** - Modélisation 3D de protéines
2. **AutoDock Vina 1.2.3** - Docking moléculaire
3. **AutoDock Tools 1.5.7** - Préparation des structures
4. **OpenBabel 3.1.1** - Conversion de formats chimiques

###  Packages Python
- **BioPython** - Manipulation de séquences biologiques
- **NumPy/SciPy** - Calcul scientifique
- **RDKit** - Chimie informatique
- **PyMOL** - Visualisation 3D
- **ProDy** - Analyse de structures

##  Installation Automatique

### 1. **Exécuter le script d'installation**
```bash
cd /home/empereur/Bureau/Nexora
sudo ./install_docking_tools.sh
```

### 2. **Redémarrer le terminal**
```bash
source ~/.bashrc
```

##  Vérification de l'Installation

### Test des outils principaux
```bash
# Test AutoDock Vina
vina --version

# Test OpenBabel
obabel -V

# Test MODELLER (Python)
python3 -c "import modeller; print('MODELLER OK')"

# Test BioPython
python3 -c "import Bio; print('BioPython OK')"
```

##  Structure des Répertoires

Après installation, vous aurez :
```
/home/empereur/docking_workspace/
├── structures/     # Fichiers PDB des protéines
├── ligands/        # Fichiers des ligands
├── results/        # Résultats de docking
├── logs/           # Logs d'exécution
└── examples/       # Scripts d'exemple
```

##  Configuration des Variables d'Environnement

Le script configure automatiquement :
```bash
export PATH=/opt/mgltools/MGLToolsPckgs/AutoDockTools/Utilities24:$PATH
export MODeller_HOME=/home/empereur/.local/lib/python3.*/site-packages/modeller
export PYTHONPATH=$MODeller_HOME:$PYTHONPATH
```

##  Utilisation avec Nexora

Une fois installés, les outils seront utilisés automatiquement par :
- `docking_simple.py` - Script de docking de Nexora
- Mode "réel" au lieu du mode "simulation"

##  Commandes Utiles

### Préparation des structures
```bash
# Préparer un récepteur
prepare_receptor4.py -r protein.pdb -o protein.pdbqt

# Préparer un ligand
prepare_ligand4.py -l ligand.pdb -o ligand.pdbqt

# Convertir SMILES en 3D
obabel ligand.smi -O ligand.pdb --gen3d
```

### Docking avec Vina
```bash
vina --receptor protein.pdbqt \
     --ligand ligand.pdbqt \
     --center_x 0 --center_y 0 --center_z 0 \
     --size_x 20 --size_y 20 --size_z 20 \
     --out result.pdbqt
```

##  Notes Importantes

1. **Espace disque**: Prévoir ~2GB pour l'installation complète
2. **Temps**: Installation ~15-20 minutes
3. **Droits**: Nécessite sudo pour l'installation système
4. **Dépendances**: Python 3.8+ requis

##  Mise à Jour du Script Docking

Après installation, modifiez `docking_simple.py` pour utiliser le mode réel :

```python
# Remplacer la simulation par les vrais appels
subprocess.run(["vina", "--receptor", receptor_pdbqt, ...])
```

##  Documentation Complémentaire

- **MODELLER**: https://salilab.org/modeller/
- **AutoDock Vina**: https://vina.scripps.edu/
- **OpenBabel**: https://openbabel.org/
- **RDKit**: https://www.rdkit.org/

---

** Lancez l'installation maintenant et votre docking utilisera de vrais outils scientifiques !**
