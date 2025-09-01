#!/bin/bash
set -e

# Crear usuario si no existe
if ! id -u sftpuser >/dev/null 2>&1; then
    useradd -m sftpuser
    echo "sftpuser:pass" | chpasswd
fi

# Asegurar estructura de carpetas
mkdir -p /home/sftpuser/output \
         /home/sftpuser/backup \
         /home/sftpuser/rejected \
         /home/sftpuser/upload


# Ajustar propietario y permisos
chown root:root /home/sftpuser/output
chown root:root /home/sftpuser/backup
chown root:root /home/sftpuser/rejected

chmod 755 /home/sftpuser/output
chmod 755 /home/sftpuser/backup
chmod 755 /home/sftpuser/rejected
chmod 733 /home/sftpuser/upload


# Archivos con permisos 644
find /home/sftpuser -type f -exec chmod 644 {} \;

# Iniciar SFTP/SSH en primer plano
exec /usr/sbin/sshd -D
