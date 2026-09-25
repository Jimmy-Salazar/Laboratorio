#requires -Version 5.1

$ErrorActionPreference = "Stop"

$ProjectPath = "C:\projects\Laboratorio\client"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

Set-Location $ProjectPath

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " PATCH 02.8 - REPARACION UTF-8" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

$BackupPath = Join-Path $ProjectPath "backups\utf8-fix-$Timestamp"
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null

Copy-Item "$ProjectPath\src" "$BackupPath\src" -Recurse -Force

if (Test-Path "$ProjectPath\index.html") {
    Copy-Item "$ProjectPath\index.html" "$BackupPath\index.html" -Force
}

Write-Host "Backup creado:" -ForegroundColor Green
Write-Host $BackupPath
Write-Host ""

$Files = @()

$Files += Get-ChildItem "$ProjectPath\src" -Recurse -File |
    Where-Object {
        $_.Extension -in @(".js", ".jsx", ".css", ".json", ".html")
    }

if (Test-Path "$ProjectPath\index.html") {
    $Files += Get-Item "$ProjectPath\index.html"
}

$Replacements = [ordered]@{
    "ÃƒÂ¡" = "á"
    "ÃƒÂ©" = "é"
    "ÃƒÂ­" = "í"
    "ÃƒÂ³" = "ó"
    "ÃƒÂº" = "ú"
    "ÃƒÂ±" = "ñ"
    "Ã¡" = "á"
    "Ã©" = "é"
    "Ã­" = "í"
    "Ã³" = "ó"
    "Ãº" = "ú"
    "Ã±" = "ñ"
    "Ã" = "Á"
    "Ã‰" = "É"
    "Ã" = "Í"
    "Ã“" = "Ó"
    "Ãš" = "Ú"
    "Ã‘" = "Ñ"
    "Â¿" = "¿"
    "Â¡" = "¡"
    "Â°" = "°"
    "Â·" = "·"
    "â€œ" = "“"
    "â€" = "”"
    "â€˜" = "‘"
    "â€™" = "’"
    "â€“" = "–"
    "â€”" = "—"
    "â€¦" = "…"
}

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$ModifiedFiles = 0
$ReplacementCount = 0

foreach ($File in $Files) {
    $OriginalContent = [System.IO.File]::ReadAllText(
        $File.FullName,
        [System.Text.Encoding]::UTF8
    )

    $NewContent = $OriginalContent

    for ($Pass = 1; $Pass -le 3; $Pass++) {
        $BeforePass = $NewContent

        foreach ($BadText in $Replacements.Keys) {
            if ($NewContent.Contains($BadText)) {
                $Occurrences = (
                    [regex]::Matches(
                        $NewContent,
                        [regex]::Escape($BadText)
                    )
                ).Count

                $ReplacementCount += $Occurrences

                $NewContent = $NewContent.Replace(
                    $BadText,
                    $Replacements[$BadText]
                )
            }
        }

        if ($NewContent -eq $BeforePass) {
            break
        }
    }

    if ($NewContent -ne $OriginalContent) {
        [System.IO.File]::WriteAllText(
            $File.FullName,
            $NewContent,
            $Utf8NoBom
        )

        $ModifiedFiles++

        Write-Host "CORREGIDO: " -NoNewline -ForegroundColor Green
        Write-Host ($File.FullName.Replace("$ProjectPath\", ""))
    }
}

Write-Host ""
Write-Host "Archivos modificados: $ModifiedFiles" -ForegroundColor Green
Write-Host "Reemplazos realizados: $ReplacementCount" -ForegroundColor Green

Write-Host ""
Write-Host "Ejecutando build..." -ForegroundColor Yellow
Write-Host ""

& npm.cmd run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD FALLIDO" -ForegroundColor Red
    Write-Host "Backup disponible en:" -ForegroundColor Yellow
    Write-Host $BackupPath
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host " PATCH 02.8 APLICADO CORRECTAMENTE" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora ejecuta:" -ForegroundColor Cyan
Write-Host "npm.cmd run dev"
Write-Host ""
