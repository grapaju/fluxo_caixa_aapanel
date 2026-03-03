$ErrorActionPreference = 'Stop'

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  Write-Error "psql nao encontrado. Instale PostgreSQL e adicione o bin ao PATH."
}

$pgHost = if ($env:PGHOST) { $env:PGHOST } else { '127.0.0.1' }
$pgPort = if ($env:PGPORT) { $env:PGPORT } else { '5432' }
$pgUser = if ($env:PGUSER) { $env:PGUSER } else { 'postgres' }
$pgPassword = if ($env:PGPASSWORD) { $env:PGPASSWORD } else { 'postgres' }
$dbName = if ($env:FLUXOCASH_DB_NAME) { $env:FLUXOCASH_DB_NAME } else { 'fluxocash' }

$env:PGPASSWORD = $pgPassword

$exists = psql -h $pgHost -p $pgPort -U $pgUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$dbName';"
if ($LASTEXITCODE -ne 0) {
  Write-Error "Falha ao verificar se o banco '$dbName' existe. Verifique PGHOST/PGPORT/PGUSER/PGPASSWORD."
}

$exists = ($exists | Out-String).Trim()
if ($exists -eq '1') {
  Write-Host "Banco '$dbName' já existe."
  exit 0
}

psql -h $pgHost -p $pgPort -U $pgUser -d postgres -c "CREATE DATABASE $dbName;"
if ($LASTEXITCODE -ne 0) {
  Write-Error "Falha ao criar o banco '$dbName'. Verifique credenciais/permissões do usuário '$pgUser'."
}

Write-Host "Banco '$dbName' criado com sucesso."
