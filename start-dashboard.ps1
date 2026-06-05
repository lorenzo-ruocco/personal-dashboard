$backendDir = Join-Path $PSScriptRoot 'backend'
$mavenCmd = 'C:\Program Files\Apache\apache-maven-3.9.12\bin\mvn.cmd'

if (-not (Test-Path $mavenCmd)) {
  $mavenCmd = 'mvn.cmd'
}

$portInUse = Test-NetConnection -ComputerName '127.0.0.1' -Port 8080 -InformationLevel Quiet

if ($portInUse) {
  exit 0
}

Start-Process `
  -FilePath 'cmd.exe' `
  -ArgumentList @('/c', "`"$mavenCmd`" spring-boot:run") `
  -WorkingDirectory $backendDir `
  -WindowStyle Hidden
