# JUNGLE RUSH
3D jungle endless runner (Three.js r128, no build step). Portrait mobile browser.

## Deploy (GitHub Pages, from phone)
1. Extract the ZIP. Create a repo (e.g. `JUNGLE-RUSH`) and upload ALL files/folders keeping the structure (`index.html` at repo root).
2. If `.nojekyll` did not upload: Add file > Create new file > name `.nojekyll`.
3. Settings > Pages > Source: "Deploy from a branch" > `main` / `/ (root)` > Save.
4. Open `https://YOUR-USERNAME.github.io/JUNGLE-RUSH/` after ~1 minute.
(`.github/workflows/deploy.yml` is optional; only for Source = "GitHub Actions".)

## Offline
First visit needs internet: the service worker caches the game and Three.js (cdnjs, pinned r128). After that it should launch offline. **Untested on a real device — verify with airplane mode.**

## Update tip
Change `V` in `sw.js` (e.g. `v3`) whenever you edit files, or phones keep the old cached version. Saves are in localStorage and are not erased by updates.

## Troubleshooting
Blank page: check file paths/case. Old version showing: bump `V`, reload twice. 404: Pages not enabled or wrong folder.
