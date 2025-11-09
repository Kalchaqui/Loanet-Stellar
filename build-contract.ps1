# Script para compilar contratos Loanet
# Este script configura el PATH correctamente y compila el contrato

Write-Host "Configurando entorno..." -ForegroundColor Cyan

# Configurar PATH para usar rustup primero (sobre la instalacion antigua)
$env:PATH = "C:\Users\Kalcha\.cargo\bin;" + $env:PATH

# Verificar version de Rust
Write-Host ""
Write-Host "Verificando Rust..." -ForegroundColor Cyan
$rustVersion = rustc --version
Write-Host "Rust: $rustVersion" -ForegroundColor Green

# Verificar que el target esta instalado
Write-Host ""
Write-Host "Verificando target wasm32-unknown-unknown..." -ForegroundColor Cyan
$targetInstalled = rustup target list --installed | Select-String "wasm32-unknown-unknown"
if (-not $targetInstalled) {
    Write-Host "Instalando target wasm32-unknown-unknown..." -ForegroundColor Yellow
    rustup target add wasm32-unknown-unknown
}

# Ir al directorio de contratos
Set-Location "$PSScriptRoot\contracts"

Write-Host ""
Write-Host "Limpiando cache anterior..." -ForegroundColor Cyan
# Limpiar solo release para evitar problemas con archivos bloqueados
if (Test-Path "target\release") {
    Remove-Item -Recurse -Force "target\release" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Compilando contrato Identity Registry..." -ForegroundColor Cyan
Write-Host "Esto puede tardar varios minutos..." -ForegroundColor Yellow

# Verificar que testutils no está en Cargo.toml (no compatible con wasm32)
$cargoContent = Get-Content "Cargo.toml" -Raw
if ($cargoContent -match 'features.*testutils') {
    Write-Host "Advertencia: testutils feature detectado. Removiendo..." -ForegroundColor Yellow
    (Get-Content "Cargo.toml") -replace 'features = \["testutils"\]', '' -replace 'soroban-sdk = \{ version = "([^"]+)", \}', 'soroban-sdk = "$1"' | Set-Content "Cargo.toml"
}

# Compilar
cargo build --target wasm32-unknown-unknown --release

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Compilacion exitosa!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Archivo WASM generado en:" -ForegroundColor Cyan
    Write-Host "   contracts\target\wasm32-unknown-unknown\release\loanet_contract.wasm" -ForegroundColor White
    
    # Verificar que el archivo existe
    $wasmPath = "target\wasm32-unknown-unknown\release\loanet_contract.wasm"
    if (Test-Path $wasmPath) {
        $fileSize = (Get-Item $wasmPath).Length / 1KB
        Write-Host ""
        Write-Host "Tamaño del archivo: $([math]::Round($fileSize, 2)) KB" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "Error en la compilacion" -ForegroundColor Red
    Write-Host "Revisa los errores arriba" -ForegroundColor Yellow
    exit 1
}

Set-Location $PSScriptRoot
