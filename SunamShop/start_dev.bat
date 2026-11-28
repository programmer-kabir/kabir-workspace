@echo off
chcp 65001 > nul
echo ========================================================
echo SUNAM SHOP — Starting All Development Servers
echo Location: Sunamganj Sadar, Bangladesh
echo ========================================================

echo 1. Starting Core PHP REST API on http://localhost:8000 ...
start "Sunam Shop - PHP API" cmd /k "chcp 65001 > nul && C:\xampp\php\php.exe -S localhost:8000 -t backend/api backend/api/index.php"

echo 2. Starting Customer Storefront on http://localhost:3000 ...
start "Sunam Shop - Customer Web" cmd /k "npm.cmd --prefix customer-frontend run dev"

echo 3. Starting Admin Portal on http://localhost:3001 ...
start "Sunam Shop - Admin Portal" cmd /k "npm.cmd --prefix admin-frontend run dev"

echo ========================================================
echo All servers launched!
echo - Customer Storefront: http://localhost:3000
echo - Admin Portal:        http://localhost:3001
echo - Backend REST API:    http://localhost:8000/api/v1/health
echo ========================================================
pause
