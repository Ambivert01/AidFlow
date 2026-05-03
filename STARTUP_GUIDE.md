# 🚀 AidFlow Complete Startup Guide

## Prerequisites

- Node.js (v18+)
- Python (v3.8+)
- MongoDB
- Redis
- npm/pip installed

---

## Complete Startup Sequence

### Terminal 1: Redis Server

```bash
# Start Redis server
sudo systemctl start redis-server

# Verify Redis is running
redis-cli ping
# Expected output: PONG
```

**Keep this terminal open** (Redis runs as a service)

---

### Terminal 2: Backend Workers

```bash
cd backend
npm run workers
```

**Keep this terminal open** - This runs:
- AI processing workers
- Donation processing workers
- Fraud detection workers
- Blockchain anchoring workers

You should see:
```
Worker: ai-processing started
Worker: donation-processing started
Worker: fraud-detection started
Worker: blockchain-anchor started
```

---

### Terminal 3: Backend Main Server

```bash
cd backend
npm run dev
```

**Keep this terminal open** - This runs the main Express server

You should see:
```
MongoDB connected
AidFlow server running on port 5000
```

---

### Terminal 4: Frontend Dev Server

```bash
cd frontend
npm run dev
```

**Keep this terminal open** - This runs the React dev server

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

### Terminal 5: AI Agent - Eligibility

```bash
cd ai-agents/eligibility_agent

# Activate virtual environment
source venv/bin/activate

# Run the agent
python main.py
```

**Keep this terminal open**

You should see:
```
INFO:     Started server process
INFO:     Uvicorn running on http://127.0.0.1:8001
```

---

### Terminal 6: AI Agent - Fraud

```bash
cd ai-agents/fraud_agent

# Activate virtual environment
source venv/bin/activate

# Run the agent
python main.py
```

**Keep this terminal open**

You should see:
```
INFO:     Started server process
INFO:     Uvicorn running on http://127.0.0.1:8002
```

---

### Terminal 7: AI Agent - Risk

```bash
cd ai-agents/risk_agent

# Activate virtual environment
source venv/bin/activate

# Run the agent
python main.py
```

**Keep this terminal open**

You should see:
```
INFO:     Started server process
INFO:     Uvicorn running on http://127.0.0.1:8003
```

---

### Terminal 8: Blockchain (Optional)

```bash
cd blockchain

# If using Hardhat local node
npx hardhat node

# Or if deploying contracts
npx hardhat run scripts/deploy.js --network localhost
```

**Keep this terminal open** (if using local blockchain)

---

## Quick Verification Checklist

After starting all services, verify:

### 1. Redis
```bash
redis-cli ping
# Should return: PONG
```

### 2. MongoDB
```bash
mongosh
# Should connect successfully
```

### 3. Backend Main
```bash
curl http://localhost:5000/health
# Should return: {"status":"OK","service":"AidFlow Backend"}
```

### 4. Backend Workers
Check Terminal 2 - should show no errors

### 5. Frontend
Open browser: `http://localhost:5173/`
Should load homepage without errors

### 6. AI Agents
```bash
# Eligibility Agent
curl http://localhost:8001/health
# Should return: {"status":"ok","service":"eligibility_agent"}

# Fraud Agent
curl http://localhost:8002/health
# Should return: {"status":"ok","service":"fraud_agent"}

# Risk Agent
curl http://localhost:8003/health
# Should return: {"status":"ok","service":"risk_agent"}
```

---

## Service Ports Summary

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend API | 5000 | http://localhost:5000 |
| Eligibility Agent | 8001 | http://localhost:8001 |
| Fraud Agent | 8002 | http://localhost:8002 |
| Risk Agent | 8003 | http://localhost:8003 |
| MongoDB | 27017 | mongodb://localhost:27017 |
| Redis | 6379 | redis://localhost:6379 |
| Blockchain (optional) | 8545 | http://localhost:8545 |

---

## Startup Order (Important!)

**Must start in this order:**

1. ✅ **Redis** (required by workers)
2. ✅ **Backend Workers** (processes queue jobs)
3. ✅ **Backend Main** (API server)
4. ✅ **Frontend** (UI)
5. ✅ **AI Agents** (all 3 - can be parallel)
6. ⚠️ **Blockchain** (optional - system works without it)

---

## Shutdown Sequence

**Reverse order:**

1. Stop Frontend (Ctrl+C in Terminal 4)
2. Stop Backend Main (Ctrl+C in Terminal 3)
3. Stop Backend Workers (Ctrl+C in Terminal 2)
4. Stop AI Agents (Ctrl+C in Terminals 5, 6, 7)
5. Stop Blockchain (Ctrl+C in Terminal 8) - if running
6. Stop Redis (optional):
   ```bash
   sudo systemctl stop redis-server
   ```

---

## Troubleshooting

### Issue: "Redis connection refused"
**Solution:**
```bash
sudo systemctl start redis-server
redis-cli ping  # Verify
```

### Issue: "MongoDB connection failed"
**Solution:**
```bash
sudo systemctl start mongod
mongosh  # Verify
```

### Issue: "Port already in use"
**Solution:**
```bash
# Find process using port
lsof -i :5000  # or :5173, :8001, etc.

# Kill process
kill -9 <PID>
```

### Issue: "AI Agent not responding"
**Solution:**
1. Check if virtual environment is activated
2. Check if dependencies are installed: `pip install -r requirements.txt`
3. Check if port is available: `lsof -i :8001`

### Issue: "Workers not processing jobs"
**Solution:**
1. Ensure Redis is running
2. Check worker logs in Terminal 2
3. Restart workers: Ctrl+C then `npm run workers`

---

## Development Tips

### Hot Reload
- **Frontend**: Auto-reloads on file changes
- **Backend Main**: Auto-reloads with nodemon
- **Backend Workers**: Auto-reloads with nodemon
- **AI Agents**: Manual restart required

### Logs
- **Backend**: Check Terminal 3 (main) and Terminal 2 (workers)
- **Frontend**: Check browser console (F12)
- **AI Agents**: Check respective terminals (5, 6, 7)

### Database
```bash
# Connect to MongoDB
mongosh

# Use AidFlow database
use aidflow

# Check collections
show collections

# Query data
db.donations.find().limit(5)
```

### Redis
```bash
# Connect to Redis
redis-cli

# Check keys
KEYS *

# Monitor commands
MONITOR
```

---

## Production Deployment

For production, use process managers:

### Backend (PM2)
```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start server.js --name aidflow-api
pm2 start src/workers/index.js --name aidflow-workers

# Monitor
pm2 monit

# Logs
pm2 logs
```

### AI Agents (Supervisor or PM2)
```bash
# Using PM2
pm2 start "python main.py" --name eligibility-agent --interpreter python3 --cwd ai-agents/eligibility_agent
pm2 start "python main.py" --name fraud-agent --interpreter python3 --cwd ai-agents/fraud_agent
pm2 start "python main.py" --name risk-agent --interpreter python3 --cwd ai-agents/risk_agent
```

### Frontend (Nginx)
```bash
# Build frontend
cd frontend
npm run build

# Serve with nginx
# Configure nginx to serve dist/ folder
```

---

## Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/aidflow
JWT_SECRET=your_secret_key
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
AI_ELIGIBILITY_URL=http://localhost:8001
AI_FRAUD_URL=http://localhost:8002
AI_RISK_URL=http://localhost:8003
RPC_URL=http://127.0.0.1:8545
AUDIT_CONTRACT_ADDRESS=0x...
BLOCKCHAIN_PRIVATE_KEY=0x...
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Quick Start Script (Optional)

Create `start-all.sh`:

```bash
#!/bin/bash

echo "Starting AidFlow..."

# Start Redis
echo "1. Starting Redis..."
sudo systemctl start redis-server
sleep 2

# Start Backend Workers
echo "2. Starting Backend Workers..."
cd backend
gnome-terminal -- bash -c "npm run workers; exec bash"
sleep 3

# Start Backend Main
echo "3. Starting Backend Main..."
gnome-terminal -- bash -c "npm run dev; exec bash"
sleep 3

# Start Frontend
echo "4. Starting Frontend..."
cd ../frontend
gnome-terminal -- bash -c "npm run dev; exec bash"
sleep 2

# Start AI Agents
echo "5. Starting AI Agents..."
cd ../ai-agents/eligibility_agent
gnome-terminal -- bash -c "source venv/bin/activate && python main.py; exec bash"

cd ../fraud_agent
gnome-terminal -- bash -c "source venv/bin/activate && python main.py; exec bash"

cd ../risk_agent
gnome-terminal -- bash -c "source venv/bin/activate && python main.py; exec bash"

echo "✅ All services started!"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:5000"
```

Make executable:
```bash
chmod +x start-all.sh
./start-all.sh
```

---

## System Requirements

### Minimum
- CPU: 2 cores
- RAM: 4 GB
- Disk: 10 GB

### Recommended
- CPU: 4 cores
- RAM: 8 GB
- Disk: 20 GB
- SSD for database

---

## Success Indicators

When everything is running correctly:

✅ 8 terminals open (or 7 if no blockchain)
✅ No error messages in any terminal
✅ Frontend loads at http://localhost:5173
✅ Backend responds at http://localhost:5000/health
✅ All AI agents respond to /health endpoints
✅ Redis responds to PING
✅ MongoDB is connected
✅ Workers are processing jobs

---

## Common Workflow

### Daily Development
1. Start Redis
2. Start Backend Workers
3. Start Backend Main
4. Start Frontend
5. Start AI Agents (if testing AI features)

### Testing Donations
1. Ensure all services running
2. Register as Donor
3. Create donation
4. Check workers processing (Terminal 2)
5. Check AI agent logs (Terminals 5, 6, 7)

### Testing NGO Workflow
1. Ensure all services running
2. Register as NGO (needs admin approval)
3. Create campaign
4. Register beneficiaries
5. Check AI eligibility processing

---

**Remember**: Always start services in the correct order!

**Redis → Workers → Backend → Frontend → AI Agents → Blockchain**
