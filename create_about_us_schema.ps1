# PowerShell script to create ABOUT_US schema in CMS service
# This script sends a POST request to create the schema definition

$schemaJson = Get-Content "about_us_schema.json" -Raw

# Note: Replace YOUR_JWT_TOKEN with an actual JWT token from login
# You can get this by:
# 1. Login to the frontend application
# 2. Open browser DevTools > Application > Local Storage
# 3. Copy the 'token' value

$token = "YOUR_JWT_TOKEN"

# If you don't have a token, you can login first using this endpoint:
# $loginResponse = Invoke-RestMethod -Uri "http://localhost:8888/login" -Method POST -Body (@{username="admin";password="yourpassword"} | ConvertTo-Json) -ContentType "application/json"
# $token = $loginResponse.token

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

try {
    Write-Host "Creating schema for ABOUT_US module..." -ForegroundColor Cyan
    
    $response = Invoke-RestMethod -Uri "http://localhost:8888/api/admin/schema" `
        -Method POST `
        -Headers $headers `
        -Body $schemaJson
    
    Write-Host "✓ Schema created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Schema Details:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "✗ Error creating schema:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}
