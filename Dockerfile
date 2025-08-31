FROM atmoz/sftp:alpine

USER root

# Instala Node.js, npm, pm2 y bash
RUN apk update && \
    apk add --no-cache nodejs npm bash && \
    npm install -g pm2
 
# Copia package.json y dependencias
COPY ./package*.json /
RUN npm install

# Copia scripts de inicialización y monitoreo
COPY ./scripts/initial_script.sh /tmp/initial_script.sh
COPY ./scripts/monitor.js /monitor.js
COPY ./scripts/ecosystem.config.js /scripts/ecosystem.config.js
COPY ./scripts/start_processor.sh /scripts/start_processor.sh
COPY ./scripts/status_processor.sh /scripts/status_processor.sh
COPY ./scripts/stop_processor.sh /scripts/stop_processor.sh
# Da permisos de ejecución a los scripts
RUN chmod +x /tmp/initial_script.sh /scripts/start_processor.sh /scripts/status_processor.sh /scripts/stop_processor.sh
# Crea estructura de directorios (sin chown)
RUN mkdir -p /home/sftpuser/upload/output /home/sftpuser/upload/backup /home/sftpuser/upload/rejected /home/logs

# Comando por defecto: ejecuta initial_script.sh, luego el monitor
CMD ["/bin/sh", "-c", "/tmp/initial_script.sh & pm2-runtime /monitor.js"]