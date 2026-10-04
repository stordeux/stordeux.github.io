# Met à jour les polycopiés du site depuis Dropbox, puis publie.
# Usage : powershell -File maj_polys.ps1
# Ajouter une ligne dans $polys quand un poly a une source Dropbox ; le nom de destination ne doit jamais changer.

$dropbox = "C:\Users\stordeux\Dropbox\COURS"
$polys = @{
    "Algebre_numerique.pdf" = "$dropbox\ANALYSE_NUMERIQUE\ALGEBRE NUMERIQUE\POLY_ALGEBRE\Algebre_numerique.pdf"
}

Set-Location $PSScriptRoot
foreach ($nom in $polys.Keys) {
    $src = $polys[$nom]
    if (Test-Path $src) { Copy-Item $src "cours\$nom" -Force; Write-Host "OK  $nom" }
    else { Write-Warning "Introuvable : $src" }
}

git add cours
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    git commit -m "Mise à jour des polycopiés"
    git push
} else {
    Write-Host "Aucun changement."
}
