Add-Type -AssemblyName System.Drawing

$maxSide = 800
$quality = 75L
$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $quality)

function Fix-Orientation {
    param($img)
    $orientationId = 0x0112
    if ($img.PropertyIdList -contains $orientationId) {
        $prop = $img.GetPropertyItem($orientationId)
        $orientation = $prop.Value[0]
        switch ($orientation) {
            2 { $img.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX) }
            3 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
            4 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipX) }
            5 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipX) }
            6 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
            7 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipX) }
            8 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
        }
        # убираем тег, чтобы вьюеры не применили поворот повторно
        $img.RemovePropertyItem($orientationId)
    }
}

$photoDirs = Get-ChildItem -Path '.' -Recurse -Directory | Where-Object { $_.Name -eq 'photos' }

foreach ($photoDir in $photoDirs) {
    $thumbsDir = Join-Path $photoDir.Parent.FullName 'thumbs'
    if (-not (Test-Path $thumbsDir)) { New-Item -ItemType Directory -Path $thumbsDir | Out-Null }

    Write-Host "=== Processing: $($photoDir.FullName) ==="
    $searchPath = Join-Path $photoDir.FullName '*'
    $files = Get-ChildItem -Path $searchPath -File -Include *.jpg, *.jpeg

    if (-not $files -or $files.Count -eq 0) {
        Write-Host " (no .jpg files found)"
        continue
    }

    foreach ($file in $files) {
        $img = [System.Drawing.Image]::FromFile($file.FullName)
        Fix-Orientation $img

        if ($img.Width -gt $maxSide -or $img.Height -gt $maxSide) {
            $ratio = [Math]::Min($maxSide / $img.Width, $maxSide / $img.Height)
            $newW = [int]($img.Width * $ratio)
            $newH = [int]($img.Height * $ratio)
        } else {
            $newW = $img.Width
            $newH = $img.Height
        }

        $bmp = New-Object System.Drawing.Bitmap($newW, $newH)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.DrawImage($img, 0, 0, $newW, $newH)
        $img.Dispose()

        $outPath = Join-Path $thumbsDir $file.Name
        $bmp.Save($outPath, $encoder, $encParams)
        $bmp.Dispose()
        $g.Dispose()

        Write-Host " $($file.Name) -> thumbs/$($file.Name)"
    }
}