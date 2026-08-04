$files = Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if ($null -eq $content) { continue }
    
    $original = $content
    
    # Remove emoji with trailing space
    $content = $content -replace [char]::ConvertFromUtf32(0x1F4CA) + " ", ""   # 📊
    $content = $content -replace [char]::ConvertFromUtf32(0x1F4C8) + " ", ""   # 📈
    $content = $content -replace [char]::ConvertFromUtf32(0x1F4CB) + " ", ""   # 📋
    $content = $content -replace [char]::ConvertFromUtf32(0x1F4CC) + " ", ""   # 📌
    $content = $content -replace [char]::ConvertFromUtf32(0x1F4CD) + " ", ""   # 📍
    $content = $content -replace [char]::ConvertFromUtf32(0x1F3EB) + " ", ""   # 🏫
    $content = $content -replace [char]::ConvertFromUtf32(0x1F4DD) + " ", ""   # 📝
    $content = $content -replace [char]::ConvertFromUtf32(0x1F4C5) + " ", ""   # 📅
    $content = $content -replace [char]::ConvertFromUtf32(0x1F393) + " ", ""   # 🎓
    $content = $content -replace [char]::ConvertFromUtf32(0x1F3C6) + " ", ""   # 🏆
    
    # Remove emoji without trailing space  
    $content = $content -replace [char]::ConvertFromUtf32(0x1F4CA), ""   # 📊
    $content = $content -replace [char]::ConvertFromUtf32(0x1F4C8), ""   # 📈
    $content = $content -replace [char]::ConvertFromUtf32(0x1F4CB), ""   # 📋
    $content = $content -replace [char]::ConvertFromUtf32(0x1F4CC), ""   # 📌
    $content = $content -replace [char]::ConvertFromUtf32(0x1F4CD), ""   # 📍
    $content = $content -replace [char]::ConvertFromUtf32(0x1F3EB), ""   # 🏫
    $content = $content -replace [char]::ConvertFromUtf32(0x1F4DD), ""   # 📝
    $content = $content -replace [char]::ConvertFromUtf32(0x1F4C5), ""   # 📅
    $content = $content -replace [char]::ConvertFromUtf32(0x1F393), ""   # 🎓
    $content = $content -replace [char]::ConvertFromUtf32(0x1F3C6), ""   # 🏆
    
    # ✅ (U+2705)
    $content = $content -replace ([char]0x2705).ToString() + " ", ""
    $content = $content -replace ([char]0x2705).ToString(), ""
    
    # ⚠️ (U+26A0 + U+FE0F)
    $content = $content -replace ([char]0x26A0).ToString() + ([char]0xFE0F).ToString() + " ", ""
    $content = $content -replace ([char]0x26A0).ToString() + ([char]0xFE0F).ToString(), ""
    
    # ✏️ (U+270F + U+FE0F)  
    $content = $content -replace ([char]0x270F).ToString() + ([char]0xFE0F).ToString() + " ", ""
    $content = $content -replace ([char]0x270F).ToString() + ([char]0xFE0F).ToString(), ""
    
    # 🗑️ -> Xóa
    $content = $content -replace [char]::ConvertFromUtf32(0x1F5D1) + ([char]0xFE0F).ToString(), "Xoa"
    $content = $content -replace [char]::ConvertFromUtf32(0x1F5D1), "Xoa"
    
    # 👨🎓 👨🏫 (complex emoji with ZWJ)
    $content = $content -replace [char]::ConvertFromUtf32(0x1F468) + ([char]0x200D).ToString() + [char]::ConvertFromUtf32(0x1F393), ""
    $content = $content -replace [char]::ConvertFromUtf32(0x1F468) + ([char]0x200D).ToString() + [char]::ConvertFromUtf32(0x1F3EB), ""
    
    if ($content -ne $original) {
        Set-Content $file.FullName $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}
Write-Host "Done!"
