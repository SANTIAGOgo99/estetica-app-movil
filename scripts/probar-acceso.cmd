@echo off
cd /d "%~dp0.."
if not exist ".env" copy ".env.example" ".env" >nul
powershell.exe -NoLogo -NoExit -Command "Write-Host 'PRUEBA DE ACCESO - APP MOVIL' -ForegroundColor Cyan; Write-Host 'Usa una cuenta de CLIENTE existente. Introduce la contrasena solo en la app.'; Write-Host 'Espera a que Expo este listo y pulsa w para abrir http://localhost:5173/sign-in'; Write-Host 'Para telefono, usa el QR con Expo Go compatible con SDK 57.'; npm.cmd start"
