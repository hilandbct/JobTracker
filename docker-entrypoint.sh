#!/bin/sh
set -e

# Ensure the data directory exists (Fly volume)
mkdir -p /data

exec "$@"
