Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Administrator\.gemini\antigravity\brain\ff762761-ff14-47fc-9b39-78cfc9a554ce\lol_hextech_assistant_icon_1792671551392.jpg"
$src = [System.Drawing.Image]::FromFile($srcPath)

$sizes = @(512, 256, 128, 64, 48, 32, 16)
foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($s, $s, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($src, 0, 0, $s, $s)
    $g.Dispose()

    $outPath = "build\icon_$s.png"
    if ($s -eq 512) { $outPath = "build\appicon.png" }
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Saved $outPath"
}
$src.Dispose()

Copy-Item "build\appicon.png" -Destination "frontend\src\assets\appicon.png" -Force
Copy-Item "build\icon_64.png" -Destination "frontend\public\favicon.png" -Force
