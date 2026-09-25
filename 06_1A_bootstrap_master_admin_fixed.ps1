#requires -Version 5.1
# DR. CHASI - BOOTSTRAP MASTER ADMIN v2
# Fixes pasted Supabase key values that contain hidden control characters.

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " DR. CHASI - CREATE MASTER ADMIN v2" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

function Convert-SecureToPlainText {
    param(
        [Parameter(Mandatory = $true)]
        [Security.SecureString]$SecureValue
    )

    $Ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)

    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($Ptr)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Ptr)
    }
}

function Normalize-HeaderValue {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Value
    )

    # Remove CR/LF/TAB and every other ASCII control character.
    $Clean = [regex]::Replace($Value, '[\x00-\x1F\x7F]', '')
    return $Clean.Trim()
}

$SupabaseUrl = (Read-Host "Supabase Project URL").Trim().TrimEnd("/")

if (-not $SupabaseUrl.StartsWith("https://")) {
    throw "Supabase Project URL must start with https://"
}

$ServiceRoleSecure = Read-Host "Supabase service_role/secret key" -AsSecureString
$ServiceRoleKey = Convert-SecureToPlainText $ServiceRoleSecure
$ServiceRoleKey = Normalize-HeaderValue $ServiceRoleKey

if ([string]::IsNullOrWhiteSpace($ServiceRoleKey)) {
    throw "Supabase service_role/secret key is required."
}

if ($ServiceRoleKey -match '\s') {
    throw "The Supabase key still contains whitespace. Copy only the key value, without quotes or spaces."
}

$MasterId = (Read-Host "Master identification number").Trim()

if ($MasterId -notmatch '^[0-9]{8,15}$') {
    throw "Identification number must contain only digits (8 to 15)."
}

$MasterName = (Read-Host "Master display name [Administrador Master]").Trim()

if ([string]::IsNullOrWhiteSpace($MasterName)) {
    $MasterName = "Administrador Master"
}

$MasterPasswordSecure = Read-Host "Master password" -AsSecureString
$MasterPassword = Convert-SecureToPlainText $MasterPasswordSecure
$MasterPassword = [regex]::Replace($MasterPassword, '[\x00-\x1F\x7F]', '')

if ($MasterPassword.Length -lt 8) {
    throw "Master password must contain at least 8 characters."
}

$AliasEmail = "$MasterId@admin.drchasi.local"

$Headers = @{
    "apikey"        = $ServiceRoleKey
    "Authorization" = "Bearer $ServiceRoleKey"
    "Content-Type"  = "application/json"
}

Write-Host ""
Write-Host "Checking Supabase Auth..." -ForegroundColor Yellow

try {
    $UsersResponse = Invoke-RestMethod `
        -Method Get `
        -Uri "$SupabaseUrl/auth/v1/admin/users?page=1&per_page=1000" `
        -Headers $Headers
}
catch {
    Write-Host ""
    Write-Host "Could not access Supabase Auth Admin API." -ForegroundColor Red
    Write-Host ""
    Write-Host "Check that you copied the SERVICE ROLE / SECRET key, not the anon/publishable key." -ForegroundColor Yellow
    Write-Host "Copy only the key characters; do not include quotes or labels." -ForegroundColor Yellow
    Write-Host ""
    throw
}

$ExistingUser = $null

if ($UsersResponse.users) {
    $ExistingUser = $UsersResponse.users |
        Where-Object { $_.email -eq $AliasEmail } |
        Select-Object -First 1
}

if ($ExistingUser) {
    $UserId = $ExistingUser.id
    Write-Host "Master Auth user already exists. Reusing it." -ForegroundColor Yellow
}
else {
    Write-Host "Creating master Auth user..." -ForegroundColor Yellow

    $CreateBody = @{
        email         = $AliasEmail
        password      = $MasterPassword
        email_confirm = $true
        user_metadata = @{
            identification_number = $MasterId
            role                  = "master"
        }
    } | ConvertTo-Json -Depth 6

    $CreatedUser = Invoke-RestMethod `
        -Method Post `
        -Uri "$SupabaseUrl/auth/v1/admin/users" `
        -Headers $Headers `
        -Body $CreateBody

    if ($CreatedUser.id) {
        $UserId = $CreatedUser.id
    }
    elseif ($CreatedUser.user.id) {
        $UserId = $CreatedUser.user.id
    }
    else {
        throw "Supabase created the user but no user id was returned."
    }

    Write-Host "Master Auth user created." -ForegroundColor Green
}

Write-Host "Linking staff profile..." -ForegroundColor Yellow

$ProfileBody = @{
    user_id               = $UserId
    full_name             = $MasterName
    role                  = "master"
    active                = $true
    identification_number = $MasterId
} | ConvertTo-Json -Depth 4

$ProfileHeaders = @{
    "apikey"        = $ServiceRoleKey
    "Authorization" = "Bearer $ServiceRoleKey"
    "Content-Type"  = "application/json"
    "Prefer"        = "resolution=merge-duplicates,return=representation"
}

try {
    $ProfileResult = Invoke-RestMethod `
        -Method Post `
        -Uri "$SupabaseUrl/rest/v1/staff_profiles?on_conflict=user_id" `
        -Headers $ProfileHeaders `
        -Body $ProfileBody
}
catch {
    Write-Host ""
    Write-Host "Auth user exists, but staff_profiles could not be linked." -ForegroundColor Red
    Write-Host "Send me the complete error shown below." -ForegroundColor Yellow
    Write-Host ""
    throw
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host " MASTER ADMIN READY" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Login identifier:" -ForegroundColor Cyan
Write-Host $MasterId
Write-Host ""
Write-Host "Role:" -ForegroundColor Cyan
Write-Host "master"
Write-Host ""
Write-Host "No password or Supabase secret was written to disk." -ForegroundColor Green
Write-Host ""

$MasterPassword = $null
$ServiceRoleKey = $null
