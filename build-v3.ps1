# LOL 智能助手 v3.0 (Rust & Tauri 2.0) 极速构建打包脚本
$ErrorActionPreference = "Stop"

# 1. 确保旧版本进程退出，防止文件占用
Get-Process | Where-Object { $_.ProcessName -like "*lol-helper*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 300

$env:PATH = "$env:USERPROFILE\.cargo\bin;" + $env:PATH

Write-Host ">>> [1/2] 使用 Tauri CLI 完整编译打包 (内嵌全部前端资产)..." -ForegroundColor Cyan
& ".\frontend\node_modules\.bin\tauri.cmd" build --no-bundle

Write-Host ">>> [2/2] 正在生成 v3.0 独立可执行程序..." -ForegroundColor Cyan
Copy-Item "src-tauri/target/release/lol-helper.exe" -Destination "lol-helper-v3.0.exe" -Force

$desktopPath = [Environment]::GetFolderPath("Desktop")
if (Test-Path $desktopPath) {
    Copy-Item "src-tauri/target/release/lol-helper.exe" -Destination "$desktopPath\lol-helper-v3.0.exe" -Force
    Write-Host ">>> 已同步到桌面: $desktopPath\lol-helper-v3.0.exe" -ForegroundColor Green
}

$size = (Get-Item "lol-helper-v3.0.exe").Length / 1MB
Write-Host (">>> 构建完成！LOL 智能助手 v3.0 独立离线体积: {0:N2} MB" -f $size) -ForegroundColor Green
