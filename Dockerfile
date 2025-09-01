FROM atmoz/sftp:alpine

USER root

# Instala Node.js, npm, pm2 y bash
RUN apk update && \
    apk add --no-cache nodejs npm bash openssh && \
    npm install -g pm2
 
# Copia package.json y dependencias
COPY ./package*.json /
RUN npm install

# Copia scripts de inicialización y monitoreo
COPY ./scripts/initial_script.sh /tmp/initial_script.sh
COPY ./scripts/monitor.js /monitor.js
COPY ./scripts/ecosystem.config.js /scripts/ecosystem.config.js

# Da permisos de ejecución a los scripts
RUN chmod +x /tmp/initial_script.sh

# Expone puerto SFTP (22) y define comando de arranque
EXPOSE 22
CMD ["/bin/sh", "-c", "/tmp/initial_script.sh & pm2-runtime /monitor.js"]
