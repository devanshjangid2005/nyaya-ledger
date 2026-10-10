# Exports docs/Nyaya-Ledger.pptx to docs/Nyaya-Ledger.pdf and, with -Png, slide previews in docs/deck/preview/.
# Needs Microsoft PowerPoint (Windows). Run from anywhere:  powershell -File docs/deck/export.ps1 [-Png]
param([switch]$Png)
$ErrorActionPreference = 'Stop'
$docs = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$pptxPath = Join-Path $docs 'Nyaya-Ledger.pptx'
$pdfPath = Join-Path $docs 'Nyaya-Ledger.pdf'
if (-not (Test-Path $pptxPath)) { throw "Build first: $pptxPath not found" }

$app = New-Object -ComObject PowerPoint.Application
try {
  # Open(FileName, ReadOnly, Untitled, WithWindow)
  $pres = $app.Presentations.Open($pptxPath, -1, 0, 0)
  $pres.SaveAs($pdfPath, 32)  # 32 = ppSaveAsPDF
  Write-Output "Wrote $pdfPath"
  if ($Png) {
    $dir = Join-Path $PSScriptRoot 'preview'
    New-Item -ItemType Directory -Force $dir | Out-Null
    Get-ChildItem $dir -Filter *.png | Remove-Item
    foreach ($slide in $pres.Slides) {
      $file = Join-Path $dir ('slide-{0:D2}.png' -f $slide.SlideIndex)
      $slide.Export($file, 'PNG', 1600, 900)
    }
    Write-Output "Wrote $($pres.Slides.Count) previews to $dir"
  }
  $pres.Close()
} finally {
  $app.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
}
