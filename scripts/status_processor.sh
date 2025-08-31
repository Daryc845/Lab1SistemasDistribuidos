#!/bin/bash


echo "📊 Estado del File Processor:"
echo "=============================="

pm2 status file-processor

echo ""
echo "📄 Últimas líneas del log:"
echo "=========================="
pm2 logs file-processor --lines 10 --nostream

echo ""
echo "💾 Archivos procesados:"
echo "======================"
echo "Output: $(ls -1 output/*.txt 2>/dev/null | wc -l) reportes"
echo "Backup: $(ls -1 backup/* 2>/dev/null | wc -l) archivos"
echo "Rejected: $(ls -1 rejected/* 2>/dev/null | wc -l) archivos rechazados"