#!/bin/bash
# Launches all 4 AidFlow AI agents in the background from one terminal.
# Run from inside the ai-agents/ directory: ./start-agents.sh
# Stop all of them with: ./stop-agents.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

start_agent() {
  local name=$1
  local port=$2
  echo "Starting $name on port $port..."
  cd "$SCRIPT_DIR/$name"
  if [ ! -d "venv" ]; then
    python3 -m venv venv
  fi
  source venv/bin/activate
  pip install -q -r requirements.txt
  nohup uvicorn main:app --host 0.0.0.0 --port "$port" > "$SCRIPT_DIR/$name.log" 2>&1 &
  echo $! >> "$SCRIPT_DIR/.agent_pids"
  deactivate
  cd "$SCRIPT_DIR"
}

rm -f "$SCRIPT_DIR/.agent_pids"

start_agent eligibility_agent 8001
start_agent fraud_agent 8002
start_agent risk_agent 8003
start_agent proof_agent 8004

echo ""
echo "All 4 agents started. Logs: ai-agents/<agent_name>.log"
echo "PIDs saved to .agent_pids. Stop them with: ./stop-agents.sh"
