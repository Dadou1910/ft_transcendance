#!/bin/sh

sqlite3 /data/base.db <<EOF
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL
);
EOF