#!/usr/bin/env bash
cd /app
git add .
git commit -m "enterprise-auto-sync: $(date)"
git push origin main
