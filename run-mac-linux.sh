#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Install Node.js 24 LTS from https://nodejs.org/ then run this file again."
  exit 1
fi
node start.cjs
