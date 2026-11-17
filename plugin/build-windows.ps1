param([Parameter(Mandatory = $true)][string]$Zig)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
Push-Location $taskRoot
try {
  & $Zig c++ -target x86_64-windows-gnu -O2 -shared -std=c++17 -Wall -I plugin/scs_sdk/include plugin/telemetrie_entreprise.cpp plugin/exports.def -lws2_32 -static -o resources/plugin/telemetrie_entreprise.dll
  if ($LASTEXITCODE -ne 0) { throw 'Compilation du plugin échouée.' }
} finally { Pop-Location }
