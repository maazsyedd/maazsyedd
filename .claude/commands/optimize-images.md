---
description: Convert newly-added images in assets/ to optimized JPEGs and wire up their references (width/height, lazy loading) the same way the rest of the site's images were done.
---

Run the full image-optimization pipeline for this site, following the same conventions used across the existing codebase (see `scripts/optimize-images.ps1` for the rationale on JPEG-85 + flattening).

1. **Convert.** Run `scripts/optimize-images.ps1` via the PowerShell tool. It converts any `.png`/`.bmp`/`.tiff` in `assets/` that doesn't already have a same-named `.jpg` into a quality-85 JPEG, and reports before/after sizes. It never touches files that are already `.jpg`, `.gif`, or `.webp`, and it never deletes anything.

2. **Find where the new images are used (or should be).** Grep the repo (`*.html`, `*.css`, `*.js`) for references to the old filenames/extensions. If a newly-converted image isn't referenced anywhere yet, ask the user which page(s) it belongs on rather than guessing.

3. **Update references.** For every place a converted image is used:
   - Point `src` (or `background-image: url(...)`, or a `data-image` attribute) at the new `.jpg` instead of the original extension.
   - Read the new JPG's actual pixel dimensions (PowerShell + `System.Drawing.Image` works without any extra tooling: `[System.Drawing.Image]::FromFile($path)`) and set `width`/`height` attributes on the `<img>` tag to match, so the browser reserves the right space before it loads.
   - Add `loading="lazy"` unless the image is the first visible/hero image on the page (the largest above-the-fold image should stay eager so it isn't delayed as the LCP element).

4. **Animated GIFs are out of scope for this script.** If a new large GIF gets added, flag its size to the user and ask whether they want it kept as-is, or converted to a looping `<video>` (needs ffmpeg, which isn't installed in this environment - ask before installing anything).

5. **Clean up.** Once every reference is confirmed updated and nothing in the repo still points at the old extension, delete the original source files (they're git-tracked, so this is reversible via history) - mirror how the existing PNG-to-JPEG migration was done.

6. **Report.** Summarize what was converted, the size before/after, and which files/lines were updated.
