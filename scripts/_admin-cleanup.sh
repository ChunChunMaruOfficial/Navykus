#!/usr/bin/env bash
set -u
echo "CONNECTED_AS_ROOT"
cd /root/Navykus || { echo "no dir /root/Navykus"; exit 1; }
echo "=== BEFORE ==="
echo "--- admin/payload.db* ---"
ls -la admin/payload.db* 2>/dev/null || echo "нет admin/payload.db*"
echo "--- admin/uploads ---"
du -sh admin/uploads 2>/dev/null || echo "нет admin/uploads"
STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP="stale-backup-$STAMP"
if [ -f admin/payload.db ]; then
  # Правильная проверка "пустоты": Payload при schema push создаёт полную схему
  # (десятки таблиц), поэтому sqlite_master != 0 даже у пустой БД.
  # Смотрим строки в контент-таблицах: если все 0 — это пустой артефакт расщепления.
  HAS_DATA=$(python3 -c "
import sqlite3, sys
try:
    db = sqlite3.connect('admin/payload.db')
    for t in ('users','tournaments','events','activities','faqs','opportunities','team_members'):
        try:
            n = db.execute('SELECT COUNT(*) FROM ' + t).fetchone()[0]
            if n and n > 0:
                print(t, n)
        except Exception:
            pass
except Exception:
    print('ERR')
" 2>/dev/null)
  echo "контент-таблицы в admin/payload.db: ${HAS_DATA:-все пусты}"
  if [ -z "$HAS_DATA" ] || [ "$HAS_DATA" = "ERR" ]; then
    mkdir -p "$BACKUP"
    mv admin/payload.db admin/payload.db-shm admin/payload.db-wal "$BACKUP"/ 2>/dev/null && echo "-> admin/payload.db* перемещены в $BACKUP/"
  else
    echo "-> ВНИМАНИЕ: в admin/payload.db ЕСТЬ данные ($HAS_DATA) — не трогаю, проверь вручную"
  fi
fi
if [ -d admin/uploads ]; then
  mkdir -p "$BACKUP"
  mv admin/uploads "$BACKUP/uploads" && echo "-> admin/uploads перемещена в $BACKUP/uploads"
fi
echo "=== AFTER ==="
ls admin/ | grep -iE 'payload|upload' || echo "admin/ чисто (нет payload/uploads)"
echo "=== root payload.db (не трогаем) ==="
ls -la payload.db* 2>/dev/null
echo "DONE"
