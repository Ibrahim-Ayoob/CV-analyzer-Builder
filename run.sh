#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

clear
echo ""
echo -e "${BLUE}  ╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}  ║         CV Analyzer & Builder        ║${NC}"
echo -e "${BLUE}  ╚══════════════════════════════════════╝${NC}"
echo ""

# ── FORCE kill any process on 8080 and 3000 ───────────────────────────────
echo -e "${YELLOW}▸ Force-clearing ports 8080 and 3000...${NC}"

for PORT in 8080 3000; do
  PIDS=$(lsof -ti:$PORT 2>/dev/null)
  if [ -n "$PIDS" ]; then
    echo "  Killing PIDs on port $PORT: $PIDS"
    echo "$PIDS" | xargs kill -9 2>/dev/null
  fi
done

# Wait until ports are actually free
for PORT in 8080 3000; do
  for i in 1 2 3 4 5; do
    if lsof -ti:$PORT &>/dev/null; then
      sleep 1
    else
      break
    fi
  done
done

echo -e "${GREEN}  ✓ Ports cleared${NC}"

# ── Check .env ─────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}▸ Checking API key...${NC}"

if [ ! -f "$BACKEND/.env" ]; then
  echo -e "${RED}  ✗ No .env file found.${NC}"
  echo ""
  echo "  Run this first:"
  echo -e "  ${BLUE}echo \"GROQ_API_KEY=gsk_your_key_here\" > $BACKEND/.env${NC}"
  echo "  Get a free key at: https://console.groq.com"
  exit 1
fi

export $(grep -v '^#' "$BACKEND/.env" | xargs) 2>/dev/null || true

if [ -z "$GROQ_API_KEY" ] || [ "$GROQ_API_KEY" = "your_groq_api_key_here" ]; then
  echo -e "${RED}  ✗ GROQ_API_KEY not set in backend/.env${NC}"
  echo "  Get a free key at: https://console.groq.com"
  exit 1
fi
echo -e "${GREEN}  ✓ API key found${NC}"

# ── Python venv ────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}▸ Setting up Python backend...${NC}"
cd "$BACKEND"
if [ ! -d "venv" ]; then
  echo "  Creating virtualenv (first time only)..."
  python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt
echo -e "${GREEN}  ✓ Backend ready${NC}"

# ── Node packages ──────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}▸ Setting up React frontend...${NC}"
cd "$FRONTEND"
if [ ! -d "node_modules" ]; then
  echo "  Installing Node packages (first time only)..."
  npm install --silent
fi
echo -e "${GREEN}  ✓ Frontend ready${NC}"

# ── Start Flask ────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}▸ Starting Flask on port 8080...${NC}"
cd "$BACKEND"
source venv/bin/activate
python app.py &
FLASK_PID=$!

# Wait until Flask is actually responding
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Flask is up${NC}"
    break
  fi
  sleep 1
done

# ── Start React ────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}▸ Starting React on port 3000...${NC}"
cd "$FRONTEND"
BROWSER=none npm start &
REACT_PID=$!

echo ""
echo -e "${GREEN}  ╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}  ║  ✓ CV Analyzer is running!              ║${NC}"
echo -e "${GREEN}  ║                                          ║${NC}"
echo -e "${GREEN}  ║  Open → http://localhost:3000            ║${NC}"
echo -e "${GREEN}  ║                                          ║${NC}"
echo -e "${GREEN}  ║  Press Ctrl+C to stop everything        ║${NC}"
echo -e "${GREEN}  ╚══════════════════════════════════════════╝${NC}"
echo ""

# ── Ctrl+C handler — kills everything cleanly ──────────────────────────────
cleanup() {
  echo ""
  echo -e "${YELLOW}  Stopping...${NC}"
  kill $FLASK_PID $REACT_PID 2>/dev/null
  # Force-kill anything still on the ports
  lsof -ti:8080 | xargs kill -9 2>/dev/null
  lsof -ti:3000 | xargs kill -9 2>/dev/null
  echo -e "${GREEN}  ✓ All stopped. Bye!${NC}"
  echo ""
  exit 0
}
trap cleanup INT TERM

wait $FLASK_PID $REACT_PID
