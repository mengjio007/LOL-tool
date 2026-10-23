# 一键编译并极限压缩脚本
$ErrorActionPreference = "Stop"

Write-Host ">>> 1. 正在编译 React 前端与 Go 后端..." -ForegroundColor Cyan
wails build -clean -trimpath -ldflags="-s -w -H windowsgui" -o "lol-helper-raw.exe"

Write-Host ">>> 2. 正在使用 UPX 进行极限体积压缩..." -ForegroundColor Cyan
$upx = "C:\Users\Administrator\AppData\Local\Microsoft\WinGet\Packages\UPX.UPX_Microsoft.Winget.Source_8wekyb3d8bbwe\upx-5.2.1-win64\upx.exe"
if (Test-Path $upx) {
    & $upx -9 -f --compress-icons=0 "build\bin\lol-helper-raw.exe" -o "lol-helper.exe"
    Copy-Item "lol-helper.exe" -Destination "build\bin\lol-helper.exe" -Force
    Copy-Item "lol-helper.exe" -Destination "lol-helper-v2.0.0.exe" -Force
    Copy-Item "lol-helper.exe" -Destination "lol-helper-v2.0.exe" -Force
} else {
    Copy-Item "build\bin\lol-helper-raw.exe" -Destination "lol-helper.exe" -Force
    Copy-Item "build\bin\lol-helper-raw.exe" -Destination "lol-helper-v2.0.0.exe" -Force
    Copy-Item "build\bin\lol-helper-raw.exe" -Destination "lol-helper-v2.0.exe" -Force
}

$file = Get-Item "lol-helper.exe"
$sizeMB = [math]::Round($file.Length / 1MB, 2)
Write-Host ">>> 3. 打包完成！最终体积: $sizeMB MB ($($file.Length) 字节)" -ForegroundColor Green
