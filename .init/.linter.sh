#!/bin/bash
cd /home/kavia/workspace/code-generation/contentmaster-pro-118042-c8d939d0/backend_api
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

