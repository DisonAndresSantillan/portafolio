#!/usr/bin/env bash
#
# Atajo para desplegar el portafolio a Hostinger por FTP.
# (La lógica real está en _dev/deploy.sh; lee las credenciales de .env.)
#
# Uso:
#   ./desplegar.sh              → sube el sitio a producción
#   ./desplegar.sh test         → solo prueba la conexión (lista public_html)
#   ./desplegar.sh rm <archivo> → borra un archivo del servidor
#
cd "$(dirname "$0")"
exec bash _dev/deploy.sh "$@"
