<#
    optimize-images.ps1

    Converts any newly-added raster images in assets/ (.png, .bmp, .tiff) to
    quality-85 JPEGs, the same way the existing site images were converted.
    Uses .NET's built-in System.Drawing encoder, so no external tools
    (ImageMagick, cwebp, etc.) are required.

    - Skips a source file if a same-named .jpg already exists (so it's safe
      to re-run any time; it only processes genuinely new images).
    - Flattens transparency onto a white background before encoding, since
      JPEG has no alpha channel. Fine for this project's photographic
      renders/screenshots; if a future image needs real transparency, keep
      it as a PNG and reference that instead.
    - Animated GIFs are left untouched. GDI+ can't re-save an animated GIF
      without collapsing it to a single frame. Large GIFs are better handled
      by converting to a looping video (needs ffmpeg, not covered here).
    - Does NOT delete the original files or touch any HTML/CSS/JS. This
      only produces the .jpg files. Updating references and cleaning up the
      originals is handled by the /optimize-images command, since that part
      requires knowing where each image is actually used.

    Usage:  powershell -File scripts\optimize-images.ps1
#>

Add-Type -AssemblyName System.Drawing

$assetsDir = Join-Path $PSScriptRoot "..\assets"
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]85)

$sourceExtensions = @("*.png", "*.bmp", "*.tiff", "*.tif")
$totalOld = 0
$totalNew = 0
$converted = @()

foreach ($pattern in $sourceExtensions) {
    Get-ChildItem $assetsDir -File -Filter $pattern | ForEach-Object {
        $src = $_.FullName
        $dst = [System.IO.Path]::ChangeExtension($src, ".jpg")

        if (Test-Path $dst) {
            return # already converted previously, skip
        }

        $oldSize = $_.Length
        $img = [System.Drawing.Image]::FromFile($src)
        $bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.Clear([System.Drawing.Color]::White)
        $g.DrawImage($img, 0, 0, $img.Width, $img.Height)
        $g.Dispose()
        $img.Dispose()

        $bmp.Save($dst, $jpegCodec, $encParams)
        $bmp.Dispose()

        $newSize = (Get-Item $dst).Length
        $script:totalOld += $oldSize
        $script:totalNew += $newSize
        $script:converted += [PSCustomObject]@{
            Name   = $_.Name
            OldKB  = [math]::Round($oldSize / 1KB)
            NewKB  = [math]::Round($newSize / 1KB)
            Width  = $bmp.Width
            Height = $bmp.Height
        }
    }
}

if ($converted.Count -eq 0) {
    Write-Host "No new images to convert - everything in assets/ already has a .jpg."
} else {
    $converted | Format-Table -AutoSize
    "Converted {0} image(s): {1} KB -> {2} KB" -f $converted.Count, [math]::Round($totalOld / 1KB), [math]::Round($totalNew / 1KB)
}
