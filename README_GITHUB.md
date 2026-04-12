# Nexora - Plateforme Bioinformatique

![Nexora Logo](https://img.shields.io/badge/Nexora-Bioinformatics-blue?style=for-the-badge&logo=biotechnology)

## Description

Nexora est une plateforme web complète pour l'analyse bioinformatique de séquences ADN/ARN, offrant des fonctionnalités avancées de détection de mutations, d'analyse de résistance aux antibiotiques, et de visualisation 3D.

## Fonctionnalités principales

### Biologie Moléculaire
- **Analyse de séquences ADN/ARN** : Transcription, traduction, contenu GC
- **Détection de mutations** : Identification automatique des variants
- **Analyse phylogénétique** : Arbres évolutifs et relations entre séquences

### Docking Moléculaire
- **Analyse docking** : Simulation d'interactions ligand-protéine
- **Base de données de ligands** : Molécules validées et prêtes à l'analyse
- **Visualisation 3D** : Représentation interactive des structures

### Résistance aux Antibiotiques
- **Détection automatique** : Identification de gènes de résistance
- **Base de données intégrée** : Références croisées avec les banques de données
- **Rapports détaillés** : Analyses complètes et recommandations

## Architecture

### Domain-Driven Design (DDD)
```
src/
Domain/           # Coeur métier
  User/           # Gestion utilisateurs
  Analysis/       # Analyses bioinformatiques
  Docking/        # Docking moléculaire
  Ligand/         # Ligands chimiques
  Bioinformatics/ # Séquences ADN/ARN

Application/      # Services applicatifs
  Service/        # Cas d'usage
  Handler/        # Handlers API

Infrastructure/   # Couche technique
  Database/       # Base de données
  Cache/          # Système cache
  Api/            # API REST
  Security/       # Sécurité

Shared/           # Composants partagés
  Exception/      # Gestion erreurs
  ValueObject/    # Value objects
  Utility/        # Utilitaires
```

## Installation

### Prérequis
- PHP 8.0+
- MySQL/MariaDB
- Python 3.8+
- XAMPP (recommandé pour le développement)

### Installation rapide avec XAMPP

1. **Cloner le dépôt**
```bash
git clone https://github.com/diarraibrahimamohamed-ops/Nexora.git
cd Nexora
```

2. **Déployer avec le script**
```bash
chmod +x deploy_xampp.sh
./deploy_xampp.sh
```

3. **Configurer la base de données**
- Ouvrir `http://localhost/phpmyadmin`
- Importer `legacy/sql/database_schema.sql`

4. **Accéder à l'application**
- Interface : `http://localhost/nexora/`
- API : `http://localhost/nexora/api.php`

### Installation manuelle

1. **Base de données**
```bash
mysql -u root -p
CREATE DATABASE nexora_db;
mysql -u root -p nexora_db < legacy/sql/database_schema.sql
```

2. **Configuration**
```bash
cp env.example.php env.php
# Éditer env.php avec vos configurations
```

3. **Permissions**
```bash
chmod 777 cache/ logs/ uploads/ tmp/
```

## Utilisation

### Authentification
- **Email** : `diarra@gmail.com`
- **Mot de passe** : `ibadia2004@2004`

### API REST

#### Enregistrement utilisateur
```bash
curl -X POST "http://localhost/nexora/api.php?action=register" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'
```

#### Analyse de séquence
```bash
curl -X POST "http://localhost/nexora/api.php?action=analyze" \
  -H "Content-Type: application/json" \
  -d '{"sequence":"ATCGATCG","type":"DNA"}'
```

## Documentation

- [Architecture DDD](STRUCTURE_DDD.md)
- [Guide XAMPP](LANCER_XAMPP.md)
- [Documentation Docking](docs/DOCKING_README.md)
- [Validation Scientifique](docs/VALIDATION_SCIENTIFIQUE.md)

## Technologies

### Backend
- **PHP 8.0** : Architecture DDD, API REST
- **MySQL** : Base de données relationnelle
- **Python 3.8** : Analyse bioinformatique, docking

### Frontend
- **HTML5/CSS3** : Interface moderne
- **JavaScript ES6** : Modules, API client
- **Three.js** : Visualisation 3D
- **Chart.js** : Graphiques analytiques

### Bioinformatique
- **Biopython** : Manipulation séquences
- **AutoDock Vina** : Docking moléculaire
- **NCBI BLAST** : Alignement de séquences

## Tests

### Tests unitaires
```bash
# Tests DDD
php test_ddd.php

# Tests API
php test_api_ddd_final.php

# Tests base de données
php test_db_direct.php
```

### Tests d'intégration
```bash
# Test complet d'authentification
php test_login.php

# Test docking moléculaire
python test_enrichment_integration.py
```

## Déploiement

### Production
1. Configurer les variables d'environnement
2. Mettre à jour `env.php`
3. Configurer le serveur web (Apache/Nginx)
4. Importer la base de données
5. Configurer les permissions

### Docker (bientôt disponible)
```bash
docker build -t nexora .
docker run -p 80:80 nexora
```

## Contribution

1. Forker le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commiter (`git commit -am 'Ajouter nouvelle fonctionnalité'`)
4. Pousser (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour les détails.

## Auteur

**Diarra Ibrahim Mohamed** - [GitHub](https://github.com/diarraibrahimamohamed-ops)

## Remerciements

- NCBI pour les bases de données génomiques
- L'équipe AutoDock pour les outils de docking
- La communauté bioinformatique open-source

---

**Nexora** - *L'excellence de l'analyse bioinformatique*
