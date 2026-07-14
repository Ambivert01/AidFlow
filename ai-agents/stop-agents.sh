#!/bin/bash
# Stops all AI agents started by start-agents.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -f "$SCRIPT_DIR/.agent_pids" ]; then
  echo "No .agent_pids file found - nothing to stop (or they weren't started with start-agents.sh)"
  exit 0
fi

while read -r pid; do
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid"
    echo "Stopped process $pid"
  fi
done < "$SCRIPT_DIR/.agent_pids"

rm -f "$SCRIPT_DIR/.agent_pids"
echo "All agents stopped."
