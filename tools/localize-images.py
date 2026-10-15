#!/usr/bin/env python3
"""
Copy every photo the site still loads from the old WordPress site
(theseekersclub.org/wp-content/uploads/...) into the local images/ folder,
then point the JSON and HTML files at the local copies.

Run it ONCE, from the site folder, BEFORE the old WordPress site is switched off:

    python3 tools/localize-images.py

Safe to run again: already-downloaded files are skipped.
"""
import pathlib
import re
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMAGES = ROOT / "images"
PATTERN = re.compile(r"https?://(?:www\.)?theseekersclub\.org/wp-content/uploads/[^\"'\s)<>]+")

files = sorted(list((ROOT / "data").glob("*.json")) + list(ROOT.glob("*.html")))
urls = set()
for f in files:
    urls.update(PATTERN.findall(f.read_text(encoding="utf-8")))

if not urls:
    print("Nothing to do: no old WordPress image links found.")
    sys.exit(0)

IMAGES.mkdir(exist_ok=True)
mapping, failed = {}, []
for url in sorted(urls):
    name = url.rsplit("/", 1)[-1]
    if f"images/{name}" in mapping.values():
        # Same file name from a different month folder: keep both.
        ym = "-".join(url.split("/uploads/")[1].split("/")[:2])
        name = f"{ym}-{name}"
    target = IMAGES / name
    if not target.exists():
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (site migration)"})
            with urllib.request.urlopen(req, timeout=60) as r:
                target.write_bytes(r.read())
            print("downloaded", target.name)
        except Exception as e:  # noqa: BLE001
            failed.append((url, str(e)))
            continue
    mapping[url] = f"images/{target.name}"

for f in files:
    text = f.read_text(encoding="utf-8")
    new = PATTERN.sub(lambda m: mapping.get(m.group(0), m.group(0)), text)
    if new != text:
        f.write_text(new, encoding="utf-8")
        print("updated", f.relative_to(ROOT))

print(f"\nDone: {len(mapping)} images now local.")
if failed:
    print(f"{len(failed)} could not be downloaded (left pointing at the old site):")
    for u, e in failed:
        print("  ", u, "->", e)
