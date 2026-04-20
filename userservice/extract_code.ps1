# Script to extract all backend and frontend code into a single text file

$outputFile = "complete_codebase.txt"
$output = ""

# Header
$output += "=" * 100 + "`n"
$output += "COMPLETE CODEBASE - BACKEND AND FRONTEND CODE`n"
$output += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"
$output += "=" * 100 + "`n`n"

# ============================================================================
# BACKEND CODE
# ============================================================================
$output += "`n`n"
$output += "=" * 100 + "`n"
$output += "SECTION 1: BACKEND CODE (Java/Spring Boot)`n"
$output += "=" * 100 + "`n`n"

# POM.XML
$output += "`n" + "=" * 100 + "`n"
$output += "FILE: pom.xml`n"
$output += "=" * 100 + "`n"
$output += Get-Content "pom.xml" -Raw -ErrorAction SilentlyContinue
$output += "`n"

# Application Properties
$output += "`n" + "=" * 100 + "`n"
$output += "FILE: src\main\resources\application.properties`n"
$output += "=" * 100 + "`n"
$output += Get-Content "src\main\resources\application.properties" -Raw -ErrorAction SilentlyContinue
$output += "`n"

# Java Source Files
Get-ChildItem -Path "src\main\java" -Recurse -Filter "*.java" | Sort-Object FullName | ForEach-Object {
    $relativePath = $_.FullName.Replace("$PWD\", "")
    $output += "`n" + "=" * 100 + "`n"
    $output += "FILE: $relativePath`n"
    $output += "=" * 100 + "`n"
    $output += Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    $output += "`n"
}

# ============================================================================
# FRONTEND CODE
# ============================================================================
$output += "`n`n"
$output += "=" * 100 + "`n"
$output += "SECTION 2: FRONTEND CODE (React/TypeScript)`n"
$output += "=" * 100 + "`n`n"

# Package.json
$output += "`n" + "=" * 100 + "`n"
$output += "FILE: adminsuite-ui-main\package.json`n"
$output += "=" * 100 + "`n"
$output += Get-Content "adminsuite-ui-main\package.json" -Raw -ErrorAction SilentlyContinue
$output += "`n"

# Vite Config
$output += "`n" + "=" * 100 + "`n"
$output += "FILE: adminsuite-ui-main\vite.config.ts`n"
$output += "=" * 100 + "`n"
$output += Get-Content "adminsuite-ui-main\vite.config.ts" -Raw -ErrorAction SilentlyContinue
$output += "`n"

# Tailwind Config
$output += "`n" + "=" * 100 + "`n"
$output += "FILE: adminsuite-ui-main\tailwind.config.ts`n"
$output += "=" * 100 + "`n"
$output += Get-Content "adminsuite-ui-main\tailwind.config.ts" -Raw -ErrorAction SilentlyContinue
$output += "`n"

# TypeScript/TSX/CSS Files
$extensions = @("*.tsx", "*.ts", "*.css")
foreach ($ext in $extensions) {
    Get-ChildItem -Path "adminsuite-ui-main\src" -Recurse -Filter $ext | 
        Where-Object { $_.Name -ne "vite-env.d.ts" } |
        Sort-Object FullName | 
        ForEach-Object {
            $relativePath = $_.FullName.Replace("$PWD\", "")
            $output += "`n" + "=" * 100 + "`n"
            $output += "FILE: $relativePath`n"
            $output += "=" * 100 + "`n"
            $output += Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
            $output += "`n"
        }
}

# HTML
$output += "`n" + "=" * 100 + "`n"
$output += "FILE: adminsuite-ui-main\index.html`n"
$output += "=" * 100 + "`n"
$output += Get-Content "adminsuite-ui-main\index.html" -Raw -ErrorAction SilentlyContinue
$output += "`n"

# Write to file
$output | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "Code extraction complete!"
Write-Host "Output file: $outputFile"
Write-Host "File size: $((Get-Item $outputFile).Length / 1MB) MB"
