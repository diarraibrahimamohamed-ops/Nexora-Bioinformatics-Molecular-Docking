# 📋 Guide Configuration XAMPP pour Nexora

## ⚠️ IMPORTANT : Arrêter Apache2 et MySQL système

Pour que XAMPP fonctionne correctement, tu **DOIS** arrêter les services Apache2 et MySQL du système car ils utilisent les mêmes ports (80 et 3306).

### Commandes pour arrêter les services système :

```bash
# Arrêter Apache2 système
sudo systemctl stop apache2
sudo systemctl disable apache2  # Pour éviter qu'il redémarre automatiquement

# Arrêter MySQL système
sudo systemctl stop mysql
sudo systemctl disable mysql  # Pour éviter qu'il redémarre automatiquement
```

### Vérifier que les services sont bien arrêtés :

```bash
sudo systemctl status apache2
sudo systemctl status mysql
```

Les deux doivent afficher `inactive (dead)`.

## 🚀 Démarrage de XAMPP

1. **Démarrer XAMPP** :
   - Via l'interface graphique XAMPP Control Panel
   - Ou via terminal : `/opt/lampp/lampp start`

2. **Vérifier que XAMPP fonctionne** :
   - Apache doit être démarré (port 80)
   - MySQL doit être démarré (port 3306)
   - Accéder à `http://localhost` pour voir le dashboard XAMPP

## 📁 Structure des fichiers

### Emplacement des fichiers web :
```
/opt/lampp/htdocs/Nexora/
├── api.php
├── docking_from_db_xampp.py
├── config.php
├── index.html
└── ... (tous tes fichiers)
```

### Configuration MySQL XAMPP :
- **Host**: `localhost`
- **Port**: `3306`
- **Socket**: `/opt/lampp/var/mysql/mysql.sock`
- **User**: `root`
- **Password**: `` (vide)
- **Database**: `nexora_db`

## ✅ Vérification complète

Exécute le script de vérification :

```bash
cd /home/empereur/Bureau/Nexora
./verification_xampp.sh
```

Ce script vérifie :
- ✅ Que Apache2 et MySQL système sont arrêtés
- ✅ Que XAMPP est installé
- ✅ Que le socket MySQL XAMPP existe
- ✅ Que les fichiers sont dans htdocs
- ✅ Que les modules Python sont installés et accessibles
- ✅ Que la connexion MySQL fonctionne depuis Python
- ✅ Que le script de docking fonctionne

## 🔧 Correction des permissions

Si tu vois encore l'erreur "mysql-connector-python non installé" :

```bash
cd /home/empereur/Bureau/Nexora
./fix_permissions.sh
```

Ce script corrige les permissions pour que XAMPP/Apache puisse lire les modules Python.

## 🧪 Test depuis l'interface web

1. **Accéder à ton application** :
   ```
   http://localhost/Nexora/
   ```

2. **Tester le docking** :
   - Utilise l'ID 20 (258 aa) pour un test rapide
   - Ou l'ID 23/24 (8658 aa) pour tester les longues séquences

3. **Vérifier les logs en cas d'erreur** :
   ```bash
   tail -f /opt/lampp/logs/error_log
   ```

## 📝 Checklist avant de tester

- [ ] Apache2 système arrêté
- [ ] MySQL système arrêté
- [ ] XAMPP démarré (Apache + MySQL)
- [ ] Fichiers copiés dans `/opt/lampp/htdocs/Nexora/`
- [ ] Permissions corrigées (`fix_permissions.sh`)
- [ ] Base de données `nexora_db` créée dans XAMPP MySQL
- [ ] Tables créées (analyses, validated_ligands, etc.)

## 🆘 En cas de problème

1. **Vérifier les logs XAMPP** :
   ```bash
   tail -f /opt/lampp/logs/error_log
   tail -f /opt/lampp/logs/mysql_error.log
   ```

2. **Tester la connexion MySQL depuis PHP** :
   ```bash
   php /opt/lampp/htdocs/Nexora/test_xampp.php
   ```

3. **Tester le script Python directement** :
   ```bash
   cd /opt/lampp/htdocs/Nexora
   /usr/bin/python3 docking_from_db_xampp.py 20 "CCO"
   ```

4. **Vérifier les permissions** :
   ```bash
   ls -la /home/empereur/.local/lib/python3.12/site-packages/mysql/connector/__init__.py
   # Doit afficher : -rw-rw-r-- ou -rw-r--r--
   ```

## 🎯 Résumé

**Pour que tout fonctionne avec XAMPP :**

1. ✅ Arrêter Apache2 et MySQL système
2. ✅ Démarrer XAMPP
3. ✅ Copier les fichiers dans `/opt/lampp/htdocs/Nexora/`
4. ✅ Exécuter `fix_permissions.sh` si nécessaire
5. ✅ Tester depuis `http://localhost/Nexora/`
