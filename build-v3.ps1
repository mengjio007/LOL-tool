# LOL 智能助手 v3.0 (Rust & Tauri 2.0) 极速构建打包脚本
$ErrorActionPreference = "Stop"

$env:PATH = "$env:USERPROFILE\.cargo\bin;" + $env:PATH

Write-Host ">>> [1/4] 正在编译 React 19 前端..." -ForegroundColor Cyan
Set-Location frontend
npm run build
Set-Location ..

Write-Host ">>> [2/4] 正在编译 Rust 后端 (Tauri 2.0 优化发布模式)..." -ForegroundColor Cyan
cargo build --release --manifest-path src-tauri/Cargo.toml

Write-Host ">>> [3/4] 正在生成 v3.0 独立可执行程序..." -ForegroundColor Cyan
Copy-Item "src-tauri/target/release/lol-helper.exe" -Destination "lol-helper-v3.0.exe" -Force

if (Get-Command upx -ErrorAction SilentlyContinue) {
    Write-Host ">>> [4/4] 正在使用 UPX 压缩可执行文件体积..." -ForegroundColor Cyan
    upx --best --lzma lol-helper-v3.0.exe
}

$desktopPath = [Environment]::GetFolderPath("Desktop")
if (Test-Path $desktopPath) {
    Copy-Item "lol-helper-v3.0.exe" -Destination "$desktopPath\lol-helper-v3.0.exe" -Force
    Write-Host ">>> 已同步到桌面: $desktopPath\lol-helper-v3.0.exe" -ForegroundColor Green
}

$size = (Get-Item "lol-helper-v3.0.exe").Length / 1MB
Write-Host (">>> 构建完成！LOL 智能助手 v3.0 体积: {0:N2} MB" -f $size) -ForegroundColor Green
