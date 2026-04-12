#!/bin/bash
# Script pour simuler l'exécution sous Apache (utilisateur www-data ou daemon)

echo "=== Simulation exécution sous Apache ==="
echo ""

# Trouver l'utilisateur Apache
APACHE_USER=$(ps aux | grep -E '[a]pache|[h]ttpd' | head -1 | awk '{print $1}')
if [ -z "$APACHE_USER" ]; then
    APACHE_USER="www-data"
fi

echo "Utilisateur Apache détecté: $APACHE_USER"
echo ""

# Tester si le script peut être exécuté
cd /home/empereur/Bureau/Nexora

echo "Test 1: Vérification permissions sur le dossier site-packages..."
if [ -r "/home/empereur/.local/lib/python3.12/site-packages" ]; then
    echo "✅ Le dossier est lisible"
else
    echo "❌ Le dossier n'est PAS lisible"
fi

echo ""
echo "Test 2: Exécution du script Python..."
/usr/bin/python3 docking_from_db_xampp.py 20 "CCO" 2>&1 | head -30

echo ""
echo "=== Fin du test ==="
