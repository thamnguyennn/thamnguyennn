#!/bin/bash
# Sao lưu CSDL: pg_dump → nén → MÃ HÓA (AES-256) → lưu local + đẩy Google Drive → dọn bản cũ.
# Thất bại ở bất kỳ bước nào → gửi cảnh báo.
set -uo pipefail
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="/backups/emr-$STAMP.sql.gz.enc"
KEEP_DAYS=${KEEP_DAYS:-60}

alert() {
  echo "[$(date)] LỖI SAO LƯU: $1" >&2
  [ -n "${HEALTHCHECK_URL:-}" ] && curl -fsS -m 10 --retry 3 "$HEALTHCHECK_URL/fail" --data-raw "$1" >/dev/null 2>&1
  [ -n "${ALERT_WEBHOOK_URL:-}" ] && curl -fsS -m 10 -H 'Content-Type: application/json' -d "{\"text\":\"[EMR Khởi Phúc Việt] Sao lưu thất bại: $1\"}" "$ALERT_WEBHOOK_URL" >/dev/null 2>&1
  exit 1
}

[ -n "${BACKUP_PASSPHRASE:-}" ] || alert "thiếu BACKUP_PASSPHRASE"
[ -n "${HEALTHCHECK_URL:-}" ] && curl -fsS -m 10 "$HEALTHCHECK_URL/start" >/dev/null 2>&1

pg_dump --no-owner --clean --if-exists | gzip -9 | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass env:BACKUP_PASSPHRASE -out "$OUT"
ST=("${PIPESTATUS[@]}")
[ "${ST[0]}" = 0 ] && [ "${ST[1]}" = 0 ] && [ "${ST[2]}" = 0 ] || { rm -f "$OUT"; alert "pg_dump/mã hóa lỗi"; }
[ "$(stat -c %s "$OUT")" -gt 1000 ] || { rm -f "$OUT"; alert "file sao lưu rỗng"; }

# Kiểm tra giải mã được trước khi tin tưởng bản sao lưu
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_PASSPHRASE -in "$OUT" | gzip -t || alert "bản sao lưu không giải mã được"

rclone copy "$OUT" "$RCLONE_REMOTE" --retries 3 || alert "đẩy lên cloud thất bại"
find /backups -name 'emr-*.enc' -mtime +"$KEEP_DAYS" -delete
rclone delete "$RCLONE_REMOTE" --min-age "${KEEP_DAYS}d" >/dev/null 2>&1

echo "[$(date)] Sao lưu OK: $OUT ($(du -h "$OUT" | cut -f1))"
[ -n "${HEALTHCHECK_URL:-}" ] && curl -fsS -m 10 --retry 3 "$HEALTHCHECK_URL" >/dev/null 2>&1
exit 0
