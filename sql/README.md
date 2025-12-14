# SQL Schema

Database schema for the AI Front Desk Agent queue management system.

## Tables

| Table | Purpose |
|-------|---------|
| `categories` | Service categories (A, B, C, D) with average handling times |
| `sessions` | Conversation sessions with language preference |
| `queue_tickets` | Customer queue entries with status and priority |
| `handoff_notes` | AI-generated summaries for staff |
| `daily_sequences` | Daily queue number sequences per category |

## Schema Files

- **001_init.sql** - Initial schema with all tables, indexes, and seed data

## Queue Number Format

Queue numbers follow the pattern `<CATEGORY>-<DAILY_SEQ>`:
- Example: `A-014` (Category A, 14th ticket of the day)

## Priority Levels

| Level | Name | Use Case |
|-------|------|----------|
| 0 | Urgent/VIP | Emergencies, VIP customers |
| 1 | Normal | Standard requests (default) |
| 2 | Scheduled | Appointments, non-urgent |

## Ticket Status Flow

```
waiting → called → serving → completed
                          ↘ cancelled
```

## Usage

```bash
# PostgreSQL
psql -U postgres -d frontdesk -f schema/001_init.sql

# SQLite (for local testing)
sqlite3 frontdesk.db < schema/001_init.sql
```
