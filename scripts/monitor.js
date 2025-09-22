const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');
const moment = require('moment');

class FileProcessor {
    constructor(watchDirectory) {
        this.watchDirectory = watchDirectory;
        const baseDir = '/home/sftpuser';
        this.outputDir = path.join(baseDir, 'output');
        this.backupDir = path.join(baseDir, 'backup');
        this.rejectedDir = path.join(baseDir, 'rejected');
        
        console.log(`🔍 Monitoreando directorio: ${watchDirectory}`);
        console.log(`📁 Directorios configurados:`);
        console.log(`   - Output: ${this.outputDir}`);
        console.log(`   - Backup: ${this.backupDir}`);
        console.log(`   - Rejected: ${this.rejectedDir}`);
        
        this.initializeDirectories();
    }

    async initializeDirectories() {
        // Crear directorios si no existen
        await fs.ensureDir(this.outputDir);
        await fs.ensureDir(this.backupDir);
        await fs.ensureDir(this.rejectedDir);
    }

    startWatching() {
        // Configurar watcher solo para archivos en el directorio raíz
        const watcher = chokidar.watch(this.watchDirectory, {
            ignored: [
                '**/output/**',
                '**/backup/**',
                '**/rejected/**',
                '**/node_modules/**',
                '**/*.js',
                '**/*.json',
                '**/*.log',
                '**/*.pid',
                '**/*.sh'
            ],
            persistent: true,
            ignoreInitial: true
        });

        watcher.on('add', (filePath) => {
            this.processFile(filePath);
        });

        watcher.on('error', (error) => {
            console.error('❌ Error en el watcher:', error);
        });

        console.log('✅ File Processor iniciado correctamente');
        console.log('⏳ Esperando archivos... (Ctrl+C para detener)');

        return watcher;
    }

    async processFile(filePath) {
        const filename = path.basename(filePath);
        const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
        
        console.log(`\n📥 [${timestamp}] Archivo detectado: ${filename}`);
        
        // Esperar a que el archivo se complete
        await this.waitForFileComplete(filePath);
        
        try {
            // Verificar si es un archivo CSV
            if (filename.toLowerCase().endsWith('.csv')) {
                console.log(`✅ Archivo CSV válido: ${filename}`);
                await this.processCSV(filePath, filename, timestamp);
            } else {
                console.log(`❌ Tipo de archivo no válido: ${filename}`);
                await this.rejectFile(filePath, filename, timestamp);
            }
        } catch (error) {
            console.log(`⚠️  Error procesando ${filename}: ${error.message}`);
            await this.rejectFile(filePath, filename, timestamp);
        }
    }

    async waitForFileComplete(filePath, maxWait = 10000) {
        return new Promise((resolve) => {
            let lastSize = 0;
            let stableCount = 0;
            
            const checkInterval = setInterval(async () => {
                try {
                    const stats = await fs.stat(filePath);
                    if (stats.size === lastSize) {
                        stableCount++;
                        if (stableCount >= 3) { // 3 checks consecutivos con mismo tamaño
                            clearInterval(checkInterval);
                            resolve();
                        }
                    } else {
                        lastSize = stats.size;
                        stableCount = 0;
                    }
                } catch (error) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 1000);
            
            // Timeout de seguridad
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, maxWait);
        });
    }

    async processCSV(filePath, filename, timestamp) {
        try {
            const data = await this.readCSV(filePath);
            console.log(`📊 CSV leído exitosamente. Filas: ${data.length}`);
            
            if (data.length > 0) {
                console.log(`📋 Columnas: ${Object.keys(data[0]).join(', ')}`);
            }
            
            // Generar reporte de ventas
            const reportContent = this.generateSalesReport(data, filename, timestamp);
            
            // Guardar reporte
            const reportFilename = `reporte_${filename.replace('.csv', '')}_${moment().format('YYYYMMDD_HHmmss')}.txt`;
            const reportPath = path.join(this.outputDir, reportFilename);
            
            await fs.writeFile(reportPath, reportContent, 'utf8');
            console.log(`📄 Reporte generado: ${reportFilename}`);
            
            // Mover archivo a backup
            const backupFilename = path.basename(filename);
            const backupPath = path.join(this.backupDir, backupFilename);
            
            await fs.move(filePath, backupPath);
            console.log(`💾 Archivo movido a backup: ${backupPath}`);


            // Crear reporte de aceptación
            const acceptReport = `reporte_${filename}_${moment().format('YYYYMMDD_HHmmss')}.txt`;
            const acceptPath = path.join(this.outputDir, rejectReport);

            const acceptContent = [
                'REPORTE DE ACEPTACIÓN',
                '================',
                `Archivo: ${filename}`,
                `Fecha: ${timestamp}`,
                `Motivo: Cumple con la extensión .csv`,
                `Ubicación: ${rejectedPath}`
            ].join('\n');
            
            await fs.writeFile(acceptPath, acceptContent, 'utf8');
            
        } catch (error) {
            console.log(`⚠️  Error procesando CSV ${filename}: ${error.message}`);
            await this.rejectFile(filePath, filename, timestamp);
        }
    }

    async readCSV(filePath) {
        return new Promise((resolve, reject) => {
            const results = [];
            
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => resolve(results))
                .on('error', (error) => reject(error));
        });
    }

    generateSalesReport(data, filename, timestamp) {
        const report = [];
        report.push('='.repeat(60));
        report.push('           REPORTE DE PROCESAMIENTO DE VENTAS');
        report.push('='.repeat(60));
        report.push(`Archivo procesado: ${filename}`);
        report.push(`Fecha de procesamiento: ${timestamp}`);
        report.push('');
        
        // Información básica del dataset
        report.push('INFORMACIÓN GENERAL:');
        report.push(`- Total de registros: ${data.length}`);
        
        if (data.length > 0) {
            const columns = Object.keys(data[0]);
            report.push(`- Columnas disponibles: ${columns.join(', ')}`);
            report.push('');
            
            // Buscar columnas relacionadas con ventas/montos
            const amountColumns = columns.filter(col => {
                const lowerCol = col.toLowerCase();
                return ['venta', 'monto', 'total', 'precio', 'amount', 'price', 'sale'].some(keyword => 
                    lowerCol.includes(keyword)
                );
            });
            
            if (amountColumns.length > 0) {
                report.push('ANÁLISIS DE VENTAS:');
                
                amountColumns.forEach(col => {
                    const values = data.map(row => parseFloat(row[col]) || 0).filter(val => !isNaN(val));
                    
                    if (values.length > 0) {
                        const total = values.reduce((sum, val) => sum + val, 0);
                        const average = total / values.length;
                        const max = Math.max(...values);
                        const min = Math.min(...values);
                        
                        report.push(`- ${col}:`);
                        report.push(`  * Total: $${total.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
                        report.push(`  * Promedio: $${average.toFixed(2)}`);
                        report.push(`  * Máximo: $${max.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
                        report.push(`  * Mínimo: $${min.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
                        report.push('');
                    }
                });
                
                // Top 5 ventas
                if (amountColumns.length > 0) {
                    const sortedData = [...data].sort((a, b) => {
                        const aVal = parseFloat(a[amountColumns[0]]) || 0;
                        const bVal = parseFloat(b[amountColumns[0]]) || 0;
                        return bVal - aVal;
                    }).slice(0, 5);
                    
                    report.push('TOP 5 VENTAS:');
                    sortedData.forEach((row, index) => {
                        const value = parseFloat(row[amountColumns[0]]) || 0;
                        report.push(`${index + 1}. ${amountColumns[0]}: $${value.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
                    });
                    report.push('');
                }
            }
            
            // Muestra de datos
            report.push('MUESTRA DE DATOS (primeras 3 filas):');
            data.slice(0, 3).forEach((row, index) => {
                report.push(`Registro ${index + 1}: ${JSON.stringify(row)}`);
            });
            
        } else {
            report.push('- No hay datos para analizar');
        }
        
        report.push('');
        report.push('='.repeat(60));
        report.push('Procesamiento completado exitosamente');
        report.push('='.repeat(60));
        
        return report.join('\n');
    }

    async rejectFile(filePath, filename, timestamp) {
        try {
            // Mover archivo a rejected
            const rejectedFilename = path.basename(filename);
            const rejectedPath = path.join(this.rejectedDir, rejectedFilename);
            await fs.move(filePath, rejectedPath);
            
            
            
            
            console.log(`🗑️  Archivo rechazado: ${rejectedPath}`);
            console.log(`📄 Reporte de rechazo generado: ${rejectReport}`);
            
        } catch (error) {
            console.log(`❌ Error moviendo archivo rechazado: ${error.message}`);
        }
    }
}

// Función principal
function main() {
    const watchDirectory = '/home/sftpuser/upload';
    
    console.log('🚀 Iniciando File Processor...');
    console.log(`📂 Directorio de monitoreo: ${watchDirectory}`);
    
    const processor = new FileProcessor(watchDirectory);
    const watcher = processor.startWatching();
    
    // Manejar señales de interrupción
    process.on('SIGINT', () => {
        console.log('\n🛑 Deteniendo File Processor...');
        watcher.close();
        console.log('✅ File Processor detenido');
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n🛑 Deteniendo File Processor...');
        watcher.close();
        console.log('✅ File Processor detenido');
        process.exit(0);
    });
}

// Iniciar si se ejecuta directamente
if (require.main === module) {
    main();
}

module.exports = FileProcessor;