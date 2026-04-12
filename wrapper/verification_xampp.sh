#!/bin/bash
# Script de vérification pour XAMPP
# Vérifie que tout est correctement configuré pour fonctionner avec XAMPP

echo "=== VÉRIFICATION CONFIGURATION XAMPP ===\n"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Vérifier que Apache2 et MySQL système sont arrêtés
echo "1. Vérification des services système..."
APACHE2_RUNNING=$(systemctl is-active apache2 2>/dev/null || echo "inactive")
MYSQL_RUNNING=$(systemctl is-active mysql 2>/dev/null || echo "inactive")

if [ "$APACHE2_RUNNING" = "active" ]; then
    echo -e "${RED}⚠️  Apache2 système est actif - doit être arrêté pour XAMPP${NC}"
    echo "   Commande: sudo systemctl stop apache2"
else
    echo -e "${GREEN}✅ Apache2 système est arrêté${NC}"
fi

if [ "$MYSQL_RUNNING" = "active" ]; then
    echo -e "${RED}⚠️  MySQL système est actif - doit être arrêté pour XAMPP${NC}"
    echo "   Commande: sudo systemctl stop mysql"
else
    echo -e "${GREEN}✅ MySQL système est arrêté${NC}"
fi

# 2. Vérifier que XAMPP est installé
echo -e "\n2. Vérification XAMPP..."
if [ -d "/opt/lampp" ]; then
    echo -e "${GREEN}✅ XAMPP installé dans /opt/lampp${NC}"
else
    echo -e "${RED}❌ XAMPP non trouvé dans /opt/lampp${NC}"
    exit 1
fi

# 3. Vérifier le socket MySQL XAMPP
echo -e "\n3. Vérification socket MySQL XAMPP..."
SOCKET_PATH="/opt/lampp/var/mysql/mysql.sock"
if [ -S "$SOCKET_PATH" ]; then
    echo -e "${GREEN}✅ Socket MySQL XAMPP trouvé: $SOCKET_PATH${NC}"
else
    echo -e "${YELLOW}⚠️  Socket MySQL XAMPP non trouvé: $SOCKET_PATH${NC}"
    echo "   Assure-toi que MySQL XAMPP est démarré"
fi

# 4. Vérifier htdocs
echo -e "\n4. Vérification htdocs..."
HTDOCS_PATH="/opt/lampp/htdocs"
if [ -d "$HTDOCS_PATH" ]; then
    echo -e "${GREEN}✅ Dossier htdocs trouvé: $HTDOCS_PATH${NC}"
    if [ -d "$HTDOCS_PATH/Nexora" ]; then
        echo -e "${GREEN}✅ Dossier Nexora trouvé dans htdocs${NC}"
    else
        echo -e "${YELLOW}⚠️  Dossier Nexora non trouvé dans htdocs${NC}"
        echo "   Tu dois copier tes fichiers dans $HTDOCS_PATH/Nexora"
    fi
else
    echo -e "${RED}❌ Dossier htdocs non trouvé${NC}"
fi

# 5. Vérifier les modules Python
echo -e "\n5. Vérification modules Python..."
PYTHON_VERSION=$(python3 --version | grep -oP '\d+\.\d+' | head -1)
SITE_PACKAGES="/home/empereur/.local/lib/python${PYTHON_VERSION}/site-packages"

if [ -d "$SITE_PACKAGES/mysql" ]; then
    echo -e "${GREEN}✅ mysql-connector-python trouvé${NC}"
    
    # Vérifier les permissions
    INIT_FILE="$SITE_PACKAGES/mysql/connector/__init__.py"
    if [ -f "$INIT_FILE" ]; then
        PERMS=$(stat -c "%a" "$INIT_FILE" 2>/dev/null || stat -f "%OLp" "$INIT_FILE" 2>/dev/null)
        if [[ "$PERMS" == *"4"* ]] || [[ "$PERMS" == *"6"* ]]; then
            echo -e "${GREEN}✅ Permissions OK (lisible par tous)${NC}"
        else
            echo -e "${YELLOW}⚠️  Permissions à vérifier: $PERMS${NC}"
            echo "   Exécute: /home/empereur/Bureau/Nexora/fix_permissions.sh"
        fi
    fi
else
    echo -e "${RED}❌ mysql-connector-python non trouvé${NC}"
fi

# 6. Test connexion MySQL depuis Python
echo -e "\n6. Test connexion MySQL depuis Python..."
cd /home/empereur/Bureau/Nexora
python3 -c "
import sys
import os
python_version = f'{sys.version_info.major}.{sys.version_info.minor}'
path = f'/home/empereur/.local/lib/python{python_version}/site-packages'
if path not in sys.path:
    sys.path.insert(0, path)
try:
    import mysql.connector
    conn = mysql.connector.connect(
        host='localhost',
        port=3306,
        database='nexora_db',
        user='root',
        password=''
    )
    print('✅ Connexion MySQL réussie depuis Python')
    conn.close()
except Exception as e:
    print(f'❌ Erreur connexion MySQL: {e}')
" 2>&1

# 7. Test script docking
echo -e "\n7. Test script docking..."
if [ -f "/home/empereur/Bureau/Nexora/docking_from_db_xampp.py" ]; then
    echo "   Test avec ID 20 (séquence courte)..."
    timeout 10 python3 /home/empereur/Bureau/Nexora/docking_from_db_xampp.py 20 "CCO" 2>&1 | head -5
else
    echo -e "${RED}❌ Script docking_from_db_xampp.py non trouvé${NC}"
fi

echo -e "\n=== FIN DE LA VÉRIFICATION ==="
echo -e "\n${YELLOW}Rappel important:${NC}"
echo "1. Assure-toi que Apache2 et MySQL système sont arrêtés"
echo "2. Démarre XAMPP (Apache + MySQL)"
echo "3. Copie tes fichiers dans /opt/lampp/htdocs/Nexora"
echo "4. Teste depuis l'interface web"
