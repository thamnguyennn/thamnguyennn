#!/bin/bash
# Chạy sao lưu lúc 02:00 mỗi đêm (giờ Việt Nam)
export TZ=Asia/Ho_Chi_Minh
printenv | grep -E '^(PG|BACKUP_|RCLONE_|HEALTHCHECK_|ALERT_|KEEP_|TZ)' | sed 's/^/export /; s/=/="/; s/$/"/' > /etc/backup.env
echo "0 2 * * * . /etc/backup.env; /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1" | crontab -
echo "Lịch sao lưu: 02:00 hằng đêm. Chạy thử ngay: docker compose exec backup backup.sh"
cron -f
