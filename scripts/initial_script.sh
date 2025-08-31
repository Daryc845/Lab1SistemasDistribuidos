#!/bin/bash

# Crear usuario si no existe
if ! id -u sftpuser >/dev/null 2>&1; then
    useradd -m sftpuser
    echo "sftpuser:pass" | chpasswd
fi

# Crear estructura de carpetas
mkdir -p /home/sftpuser/upload/{output,backup,rejected,incoming}

# Asignar propietario y permisos
chown -R sftpuser:sftpuser /home/sftpuser/upload
chmod 555 /home/sftpuser/upload
chmod 555 /home/sftpuser/upload/output
chmod 555 /home/sftpuser/upload/backup
chmod 555 /home/sftpuser/upload/rejected
chmod 555 /home/sftpuser/upload/incoming

# Los archivos pueden ser 644 (lectura para todos, escritura solo para propietario)
find /home/sftpuser/upload -type f -exec chmod 644 {} \;

# Arrancar SFTP en primer plano
exec /usr/sbin/sshd -D
