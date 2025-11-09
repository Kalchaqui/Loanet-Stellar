# Script de despliegue automático de contratos Loanet
# PowerShell Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Despliegue Automático de Contratos Loanet" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
$originalLocation = Get-Location
if (-not (Test-Path "contracts")) {
    Write-Host "ERROR: No se encontró el directorio contracts" -ForegroundColor Red
    Write-Host "Ejecuta este script desde la raíz del proyecto" -ForegroundColor Yellow
    exit 1
}

# Verificar que soroban está instalado
try {
    $null = soroban --version 2>&1
} catch {
    Write-Host "ERROR: Soroban CLI no está instalado" -ForegroundColor Red
    Write-Host "Instala con: cargo install --locked soroban-cli" -ForegroundColor Yellow
    exit 1
}

# Verificar configuración de clave
Write-Host "[1/6] Verificando configuración de clave..." -ForegroundColor Yellow
$keyCheck = soroban keys list 2>&1 | Select-String "loanet-key"
if (-not $keyCheck) {
    Write-Host "Clave 'loanet-key' no encontrada. Creando..." -ForegroundColor Yellow
    soroban keys generate --global loanet-key
    Write-Host "Obteniendo fondos de prueba..." -ForegroundColor Yellow
    soroban keys fund --network testnet loanet-key
}

$address = soroban keys address loanet-key
Write-Host "✓ Address: $address" -ForegroundColor Green
Write-Host ""

# Lista de contratos a desplegar
$contracts = @(
    @{Name="identity_registry"; VarName="IDENTITY_REGISTRY_CONTRACT"},
    @{Name="credit_scoring"; VarName="CREDIT_SCORING_CONTRACT"},
    @{Name="lending_pool"; VarName="LENDING_POOL_CONTRACT"},
    @{Name="loan_manager"; VarName="LOAN_MANAGER_CONTRACT"},
    @{Name="mock_usdc"; VarName="MOCK_USDC_CONTRACT"}
)

$contractIds = @{}
$libRsPath = "contracts\src\lib.rs"
$libRsBackup = "contracts\src\lib.rs.backup"

# Backup del lib.rs original
Copy-Item $libRsPath $libRsBackup -ErrorAction SilentlyContinue
Write-Host "[2/6] Backup de lib.rs creado" -ForegroundColor Green
Write-Host ""

# Cambiar a directorio contracts
Set-Location contracts

foreach ($contract in $contracts) {
    $contractNum = $contracts.IndexOf($contract) + 1
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "[$contractNum/5] Procesando: $($contract.Name)" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    # Crear lib.rs temporal con solo este contrato
    $libContent = "#![no_std]`n"
    $libContent += "pub mod $($contract.Name);`n"
    
    # Escribir lib.rs temporal
    Set-Content -Path "src\lib.rs" -Value $libContent -Encoding utf8
    
    # Compilar
    Write-Host "Compilando..." -ForegroundColor Yellow
    $buildOutput = cargo build --target wasm32-unknown-unknown --release 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR al compilar $($contract.Name)" -ForegroundColor Red
        Write-Host $buildOutput -ForegroundColor Red
        # Restaurar backup
        Copy-Item "src\lib.rs.backup" "src\lib.rs" -ErrorAction SilentlyContinue
        Set-Location $originalLocation
        exit 1
    }
    
    Write-Host "✓ Compilación exitosa" -ForegroundColor Green
    
    # Desplegar
    Write-Host "Desplegando..." -ForegroundColor Yellow
    $deployOutput = soroban contract deploy `
        --wasm target/wasm32-unknown-unknown/release/loanet_contract.wasm `
        --source loanet-key `
        --network testnet 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        # Extraer Contract ID del output
        $contractIdLine = $deployOutput | Select-String "Contract ID:" | Select-Object -First 1
        if ($contractIdLine) {
            $contractId = ($contractIdLine.Line -replace ".*Contract ID:\s*", "").Trim()
            $contractIds[$contract.Name] = $contractId
            Write-Host "✓ Desplegado exitosamente" -ForegroundColor Green
            Write-Host "  Contract ID: $contractId" -ForegroundColor Green
        } else {
            # Intentar extraer de otra forma
            $contractId = ($deployOutput | Select-String "^[A-Z0-9]{56}$" | Select-Object -First 1)
            if ($contractId) {
                $contractIds[$contract.Name] = $contractId.Line.Trim()
                Write-Host "✓ Desplegado exitosamente" -ForegroundColor Green
                Write-Host "  Contract ID: $($contractId.Line.Trim())" -ForegroundColor Green
            } else {
                Write-Host "ADVERTENCIA: No se pudo extraer el Contract ID automáticamente" -ForegroundColor Yellow
                Write-Host "Output completo:" -ForegroundColor Yellow
                Write-Host $deployOutput
                Write-Host ""
                Write-Host "Por favor ingresa el Contract ID manualmente:" -ForegroundColor Yellow
                $manualId = Read-Host "Contract ID"
                if ($manualId) {
                    $contractIds[$contract.Name] = $manualId
                }
            }
        }
    } else {
        Write-Host "ERROR al desplegar $($contract.Name)" -ForegroundColor Red
        Write-Host $deployOutput -ForegroundColor Red
        Write-Host ""
        Write-Host "¿Continuar con el siguiente contrato? (S/N)" -ForegroundColor Yellow
        $continue = Read-Host
        if ($continue -ne "S" -and $continue -ne "s") {
            break
        }
    }
    
    Write-Host ""
}

# Restaurar lib.rs original
Write-Host "[6/6] Restaurando lib.rs original..." -ForegroundColor Yellow
Copy-Item "src\lib.rs.backup" "src\lib.rs" -ErrorAction SilentlyContinue
Remove-Item "src\lib.rs.backup" -ErrorAction SilentlyContinue

# Volver al directorio original
Set-Location $originalLocation

# Mostrar resumen
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMEN DE CONTRATOS DESPLEGADOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Generar contenido para .env
$envContent = "VITE_STELLAR_NETWORK=testnet`n`n"
$envContent += "# Contract IDs`n"

foreach ($contract in $contracts) {
    if ($contractIds.ContainsKey($contract.Name)) {
        $envVar = "VITE_$($contract.VarName)"
        Write-Host "$envVar = $($contractIds[$contract.Name])" -ForegroundColor Green
        $envContent += "$envVar=$($contractIds[$contract.Name])`n"
    } else {
        $envVar = "VITE_$($contract.VarName)"
        Write-Host "$envVar = (NO DESPLEGADO)" -ForegroundColor Red
        $envContent += "$envVar=`n"
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creando archivo .env..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Guardar a archivo
$envContent | Out-File -FilePath ".env" -Encoding utf8 -NoNewline
Write-Host "✓ Archivo .env creado/actualizado" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Próximo paso: Inicializar los contratos" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tu address: $address" -ForegroundColor Green
Write-Host "Guarda este address - lo necesitarás para inicializar los contratos" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para inicializar, ejecuta:" -ForegroundColor Yellow
Write-Host "soroban contract invoke --id <CONTRACT_ID> --source loanet-key --network testnet -- initialize --owner $address" -ForegroundColor White

