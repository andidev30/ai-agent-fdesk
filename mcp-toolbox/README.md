# MCP Toolbox

Queue management tools exposed via [MCP Toolbox for Databases](https://googleapis.github.io/genai-toolbox/).

## Tools

| Tool | Description |
|------|-------------|
| `create_queue_ticket` | Create a new queue ticket for a customer |
| `get_queue_status` | Check position and ETA for a queue number |
| `call_next_ticket` | Staff calls the next waiting customer |
| `get_waiting_count` | Get current queue lengths per category |

## Configuration

The `tools.yaml` file defines:
- **Sources**: PostgreSQL database connection
- **Tools**: SQL-based queue operations
- **Toolsets**: Grouped tools for `frontdesk` and `staff` roles

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `127.0.0.1` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `frontdesk` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |

## Development

### Prerequisites

Install MCP Toolbox: https://googleapis.github.io/genai-toolbox/getting-started/introduction/

```bash
brew install mcp-toolbox
```

### Setup

1. Create `.env` file from example:
```bash
cp .env.example .env
```

2. Edit `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fdesk_live
DB_USER=****
DB_PASSWORD=****
```

3. Run the toolbox with UI:
```bash
./start.sh
```

4. Open http://localhost:5000/ui to test tools

### Running without UI

```bash
set -a && source .env && set +a
toolbox --tools-file tools.yaml
```

## Docker

```bash
# Build image
docker build -t frontdesk-toolbox . --load

# Run container
docker run -d -p 5000:5000 \
  --network your-network \
  -e DB_HOST=your-db-host \
  -e DB_USER=**=** \
  -e DB_PASSWORD=****** \
  -e DB_NAME=yourdb \
  frontdesk-toolbox

# Check logs
docker logs <container-id>
```

### Toolbox CLI Flags

| Flag | Description | Default |
|------|-------------|---------|
| `-a`, `--address` | Interface IP to listen on | `127.0.0.1` |
| `-p`, `--port` | Port to listen on | `5000` |
| `--tools-file` | Path to tools.yaml | - |

## Integration with ADK Agent

The AI agent loads tools from this server using:
```python
from toolbox_core import ToolboxSyncClient

client = ToolboxSyncClient("http://localhost:5000")
tools = client.load_toolset("frontdesk")
```
