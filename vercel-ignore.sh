#!/bin/bash
# Vercel Ignore Script
# This script tells Vercel when to skip deployments
# Reference: https://vercel.com/docs/deployments/ignore-script

# Get the commit message
COMMIT_MSG=$(git log -1 --pretty=%B)

# Skip deployment for documentation-only changes
if [[ $VERCEL_GIT_COMMIT_REF == "docs/"* ]]; then
  echo "📝 Documentation change detected. Skipping deployment."
  exit 0
fi

# Skip deployment for test-only changes
if [[ $VERCEL_GIT_COMMIT_REF == "test/"* ]]; then
  echo "🧪 Test change detected. Skipping deployment."
  exit 0
fi

# Skip deployment for WIP commits
if [[ $COMMIT_MSG == *"WIP"* ]] || [[ $COMMIT_MSG == *"wip"* ]]; then
  echo "⏳ WIP commit detected. Skipping deployment."
  exit 0
fi

# Skip deployment for chore commits (unless specifically marked)
if [[ $COMMIT_MSG == "chore:"* ]] || [[ $COMMIT_MSG == "chore("* ]]; then
  if [[ $COMMIT_MSG != *"deploy"* ]]; then
    echo "🔧 Chore commit detected. Skipping deployment."
    exit 0
  fi
fi

# Deploy for all other cases
echo "✓ Proceeding with deployment"
exit 1
