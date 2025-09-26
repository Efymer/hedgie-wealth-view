# Admin Endpoints

This directory contains administrative endpoints for managing the Hedgie Wealth View application.

## Refresh Snapshots Endpoint

**Endpoint:** `POST /api/admin/refresh-snapshots`

### Purpose
This endpoint removes the latest snapshot for every account (or specified accounts) and recreates fresh snapshots with current market data. This is useful when:
- Market data was incorrect during the last snapshot
- API endpoints were returning bad data
- You need to force a refresh of all account net worth calculations

### Authentication
Requires an `ADMIN_KEY` environment variable to be set. The request must include this key in the request body.

### Request Format

```json
{
  "adminKey": "your-admin-key-here",
  "accounts": ["0.0.123", "0.0.456"] // Optional: specific accounts to refresh
}
```

### Parameters

- `adminKey` (required): Must match the `ADMIN_KEY` environment variable
- `accounts` (optional): Array of account IDs to refresh. If not provided, all accounts with existing snapshots will be refreshed.

### Response Format

**Success Response (200):**
```json
{
  "ok": true,
  "message": "Snapshots refreshed successfully",
  "date": "2024-01-15",
  "summary": {
    "totalAccounts": 10,
    "successful": 9,
    "failed": 1,
    "snapshotsRemoved": 8
  },
  "results": [
    {
      "accountId": "0.0.123",
      "removedSnapshot": true,
      "newValue": 1234.56
    },
    {
      "accountId": "0.0.456",
      "removedSnapshot": false,
      "newValue": 0,
      "error": "Account not found"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing admin key
- `405 Method Not Allowed`: Non-POST request
- `400 Bad Request`: No accounts to process
- `500 Internal Server Error`: Server error during processing

### Environment Variables Required

- `ADMIN_KEY`: Secret key for admin authentication
- `REDIS_URL`: Redis connection string (same as main app)
- `ACCOUNTS_CSV`: Optional fallback for account list

### Usage Examples

**Refresh all accounts:**
```bash
curl -X POST https://your-domain.com/api/admin/refresh-snapshots \
  -H "Content-Type: application/json" \
  -d '{"adminKey": "your-secret-key"}'
```

**Refresh specific accounts:**
```bash
curl -X POST https://your-domain.com/api/admin/refresh-snapshots \
  -H "Content-Type: application/json" \
  -d '{
    "adminKey": "your-secret-key",
    "accounts": ["0.0.123", "0.0.456", "0.0.789"]
  }'
```

### How It Works

1. **Authentication**: Validates the provided admin key against `ADMIN_KEY` environment variable
2. **Account Discovery**: Either uses provided accounts or discovers all accounts with existing snapshots in Redis
3. **Snapshot Removal**: For each account, removes the latest snapshot (highest timestamp) from the Redis sorted set
4. **Fresh Calculation**: Fetches current balances and market prices to calculate new net worth
5. **New Snapshot**: Stores the fresh snapshot with today's date
6. **Results**: Returns detailed results including success/failure status for each account

### Security Notes

- The admin key should be a strong, randomly generated secret
- This endpoint has significant impact on stored data - use with caution
- Consider rate limiting or additional security measures in production
- Logs all operations for audit purposes

### Monitoring

The endpoint provides comprehensive logging with the prefix `[admin:refresh-snapshots]`. Monitor logs for:
- Authentication attempts
- Account processing status
- API call success/failure rates
- Performance metrics
