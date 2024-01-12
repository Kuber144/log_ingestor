# Log Ingestor URL
$LOG_INGESTOR_URL='http://localhost:3000/ingest'

# Sample Log Data
$LOG_DATA_1='{
    "level": "error",
    "message": "Failed to connect to DB",
    "resourceId": "server-1234",
    "timestamp": "2023-09-15T08:00:00Z",
    "traceId": "abc-xyz-123",
    "spanId": "span-456",
    "commit": "5e5342f",
    "metadata": {
        "parentResourceId": "server-0987"
    }
}'

$LOG_DATA_2='{
    "level": "info",
    "message": "Application started",
    "resourceId": "server-5678",
    "timestamp": "2023-09-16T10:30:00Z",
    "traceId": "def-456-789",
    "spanId": "span-789",
    "commit": "abc123",
    "metadata": {
        "parentResourceId": "server-123"
    }
}'

# Ingest logs
Write-Host "Ingesting log 1..."
Invoke-RestMethod -Uri $LOG_INGESTOR_URL -Method Post -Body $LOG_DATA_1 -Headers @{"Content-Type"="application/json"}

Write-Host "Log 1 ingested successfully!"

Write-Host "Ingesting log 2..."
Invoke-RestMethod -Uri $LOG_INGESTOR_URL -Method Post -Body $LOG_DATA_2 -Headers @{"Content-Type"="application/json"}

Write-Host "Log 2 ingested successfully!"
