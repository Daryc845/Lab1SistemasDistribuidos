#!/bin/bash

echo "🛑 Deteniendo File Processor..."

if pm2 list | grep -q "file-processor"; then
    pm2 stop file-processor
    pm2 delete file-processor
    echo "✅ File Processor detenido y eliminado de PM2"
else
    echo "ℹ️  File Processor no está corriendo"
fi

pm2 status