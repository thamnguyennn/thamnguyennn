FROM postgres:16
RUN apt-get update && apt-get install -y --no-install-recommends rclone openssl curl cron ca-certificates && rm -rf /var/lib/apt/lists/*
COPY backup.sh /usr/local/bin/backup.sh
COPY restore.sh /usr/local/bin/restore.sh
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /usr/local/bin/*.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
