#!/bin/bash

SCRIPT_DIR="/home/sftpuser/upload"
cd "$SCRIPT_DIR"

echo "🚀 Iniciando File Processor con PM2..."

# Verificar si ya está corriendo
if pm2 list | grep -q "file-processor"; then
    echo "⚠️  File Processor ya está corriendo"
    pm2 status file-processor
    exit 1
fi

# Iniciar con PM2
pm2 start ecosystem.config.js

echo "✅ File Processor iniciado con PM2"
echo "📊 Estado del proceso:"
pm2 status file-processor

echo ""
echo "📋 Comandos útiles:"
echo "   pm2 logs file-processor    # Ver logs en tiempo real"
echo "   pm2 status                 # Ver estado de procesos"
echo "   pm2 stop file-processor    # Detener proceso"
echo "   pm2 restart file-processor # Reiniciar proceso"