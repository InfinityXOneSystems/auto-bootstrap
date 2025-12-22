# credentials_sync.ps1
\ = "C:\Users\JARVIS\AppData\Local\InfinityXOne\CredentialManager\"
if (-not (Test-Path \)) { New-Item -ItemType Directory -Force -Path \ | Out-Null }
Write-Host "🔐 Credential sync placeholder created at \"
