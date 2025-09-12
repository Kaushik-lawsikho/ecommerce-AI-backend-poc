$body = @{
    searchQuery = "wireless headphones"
    limit = 3
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:4000/api/v1/ai/recommendations" -Method POST -ContentType "application/json" -Body $body

Write-Host "Response:"
$response | ConvertTo-Json -Depth 10
