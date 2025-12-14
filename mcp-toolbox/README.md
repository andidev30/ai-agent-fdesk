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

## Running Locally

```bash
# Install toolbox
brew install mcp-toolbox

# Or use npx
npx @toolbox-sdk/server --tools-file tools.yaml

# With environment variables
DB_PASSWORD=mysecretpass npx @toolbox-sdk/server --tools-file tools.yaml
```

## Docker

```bash
cd docker
docker build -t frontdesk-toolbox ..
docker run -p 5000:5000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PASSWORD=yourpassword \
  frontdesk-toolbox
```

## Integration with ADK Agent

The AI agent loads tools from this server using:
```python
from toolbox_core import ToolboxSyncClient

client = ToolboxSyncClient("http://localhost:5000")
tools = client.load_toolset("frontdesk")
```
