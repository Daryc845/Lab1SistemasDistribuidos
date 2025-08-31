FROM atmoz/sftp:alpine

USER root

# Instala Node.js, npm, pm2 y bash
RUN apk update && \
    apk add --no-cache nodejs npm bash && \
    npm install -g pm2

# Copia scripts de inicialización y monitoreo
COPY ./scripts/initial_script.sh /tmp/initial_script.sh
COPY ./scripts/monitor.js /monitor.js

# Crea estructura de directorios (sin chown)
RUN mkdir -p /home/sftpuser/upload/output /home/sftpuser/upload/backup /home/sftpuser/upload/rejected

# Comando por defecto: ejecuta initial_script.sh, luego el monitor
CMD ["/bin/sh", "-c", "/tmp/initial_script.sh & pm2-runtime /monitor.js"]