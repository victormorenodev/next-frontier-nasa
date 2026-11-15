#!/usr/bin/env python3
"""Create WebP assets from preserved originals; requires ImageMagick (magick)."""
from pathlib import Path
import subprocess
root=Path(__file__).resolve().parents[1]
files=[p for p in (root/'images').rglob('*') if p.suffix.lower() in ('.jpg','.jpeg','.png')]
before=after=0
for p in files:
 target=p.with_suffix('.webp')
 limit='960x960>' if p.parent.name=='cards' else '1280x1280>'
 subprocess.run(['magick',str(p),'-auto-orient','-resize',limit,'-strip','-quality','82','-define','webp:method=6',str(target)],check=True)
 before+=p.stat().st_size;after+=target.stat().st_size
 print(f'{p.name}: {p.stat().st_size//1024} -> {target.stat().st_size//1024} KiB')
print(f'TOTAL {before} -> {after} bytes; reduction {100*(1-after/before):.1f}%')
