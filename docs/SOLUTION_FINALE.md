# ✅ SOLUTION FINALE - Problème mysql-connector-python avec XAMPP

## Problème identifié

Quand Apache/XAMPP exécute le script Python `docking_from_db_xampp.py`, il le fait sous un autre utilisateur (www-data, daemon, etc.) qui n'a **pas les permissions de lecture** sur les fichiers dans `/home/empereur/.local/lib/python3.12/site-packages/mysql/`.

## Solutions appliquées

### 1. ✅ Modification du script Python
- Ajout du chemin absolu `/home/empereur/.local/lib/python3.12/site-packages` au `sys.path`
- Support de PyMySQL en fallback
- Logs de débogage détaillés

### 2. ✅ Modification de l'API PHP
- Ajout de `PYTHONPATH` dans la commande shell
- Activation du mode debug avec `DEBUG_PYTHON_PATH=1`

### 3. ✅ Correction des permissions
Les permissions ont été corrigées pour que tous les utilisateurs (y compris Apache) puissent lire les fichiers :

```bash
# Donner les permissions de lecture aux autres utilisateurs
find /home/empereur/.local/lib/python3.12/site-packages/mysql -type f -name "*.py" -exec chmod o+r {} \;
find /home/empereur/.local/lib/python3.12/site-packages/mysql -type f -name "*.so" -exec chmod o+r {} \;
find /home/empereur/.local/lib/python3.12/site-packages/mysql -type d -exec chmod o+rx {} \;
```

## Vérification

Pour vérifier que tout fonctionne :

1. **Test en ligne de commande** (doit fonctionner) :
```bash
cd /home/empereur/Bureau/Nexora
/usr/bin/python3 docking_from_db_xampp.py 20 "CCO"
```

2. **Test depuis l'interface web** :
- Lancer le docking depuis ton interface principale
- L'erreur "mysql-connector-python non installé" ne devrait plus apparaître

## Si le problème persiste

Si tu vois encore l'erreur après avoir copié les fichiers dans htdocs :

1. **Vérifier les logs Apache** :
```bash
tail -f /opt/lampp/logs/error_log
# ou
tail -f /var/log/apache2/error.log
```

2. **Vérifier que les permissions sont correctes** :
```bash
ls -la /home/empereur/.local/lib/python3.12/site-packages/mysql/connector/__init__.py
# Doit afficher : -rw-rw-r-- ou -rw-r--r--
```

3. **Tester manuellement avec l'utilisateur Apache** :
```bash
sudo -u www-data /usr/bin/python3 -c "import sys; sys.path.insert(0, '/home/empereur/.local/lib/python3.12/site-packages'); import mysql.connector; print('OK')"
```

## Fichiers modifiés

- ✅ `docking_from_db_xampp.py` : Ajout du chemin absolu au sys.path
- ✅ `api.php` : Ajout de PYTHONPATH et DEBUG_PYTHON_PATH

## Note importante

**N'oublie pas de copier les fichiers modifiés dans ton dossier htdocs** après chaque modification !
