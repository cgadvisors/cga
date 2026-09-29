#!/bin/bash
# Starts (or reattaches to) a tmux session with:
#   - one big pane on the left running `claude --resume`
#   - five stacked panes on the right running your dev commands
#
# Usage:
#   chmod +x startdev.sh
#   ./startdev.sh

SESSION="dev"
PROJECT_DIR="$HOME/adarose2"   # <-- edit if adarose2 isn't directly under $HOME

# Ports used by each service - adjust these if your setup differs
PORT_DEV=3000          # pnpm dev
PORT_INNGEST=8288      # pnpm inngest:dev
PORT_DB_STUDIO=4983    # pnpm db:studio (drizzle default; use 5555 for prisma studio)
PORT_NGROK_TARGET=3001 # the app port ngrok forwards to
PORT_NGROK_INSPECTOR=4040  # ngrok's own local web inspector

# If the session already exists, just attach to it instead of rebuilding it
if tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux attach -t "$SESSION"
  exit 0
fi

# Kills whatever is bound to a given local port, if anything
free_port() {
  local port="$1"
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "Freeing port $port (killing PID(s): $pids)"
    kill -9 $pids 2>/dev/null
  fi
}

# Clear every port these services will want, before anything starts
free_port "$PORT_DEV"
free_port "$PORT_INNGEST"
free_port "$PORT_DB_STUDIO"
free_port "$PORT_NGROK_TARGET"
free_port "$PORT_NGROK_INSPECTOR"

# Pane 0: left side, big pane
tmux new-session -d -s "$SESSION" -n main -c "$PROJECT_DIR"
tmux send-keys -t "$SESSION:0.0" 'claude --resume' Enter

# Pane 1: right column, split off from pane 0
tmux split-window -h -t "$SESSION:0.0" -c "$PROJECT_DIR"
tmux send-keys -t "$SESSION:0.1" 'pnpm dev' Enter

# Panes 2-5: stack four more onto the right column
tmux split-window -v -t "$SESSION:0.1" -c "$PROJECT_DIR"
tmux send-keys -t "$SESSION:0.2" 'pnpm inngest:dev' Enter

tmux split-window -v -t "$SESSION:0.2" -c "$PROJECT_DIR"
tmux send-keys -t "$SESSION:0.3" 'pnpm db:studio' Enter

tmux split-window -v -t "$SESSION:0.3" -c "$PROJECT_DIR"
tmux send-keys -t "$SESSION:0.4" "ngrok http $PORT_NGROK_TARGET" Enter

tmux split-window -v -t "$SESSION:0.4" -c "$PROJECT_DIR"
tmux send-keys -t "$SESSION:0.5" 'caffeinate -d' Enter

# Lay out: one main pane on the left, the rest stacked evenly on the right
tmux set-window-option -t "$SESSION:0" main-pane-width 40%
tmux select-layout -t "$SESSION:0" main-vertical

# Land focus back on the Claude pane
tmux select-pane -t "$SESSION:0.0"

tmux attach -t "$SESSION"
