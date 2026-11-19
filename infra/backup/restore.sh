#!/bin/bash
# Khôi phục:  restore.sh /backups/emr-YYYYMMDD-HHMMSS.sql.gz.enc   (GHI ĐÈ toàn bộ dữ liệu hiện tại!)
set -euo pipefail
FILE="${1:?Cần đường dẫn file .enc}"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_PASSPHRASE -in "$FILE" | gunzip | psql -v ON_ERROR_STOP=1 -q
echo "Khôi phục xong."
