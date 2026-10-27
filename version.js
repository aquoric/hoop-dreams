---
# GitHub Pages (Jekyll) fills this in on every release; index.html fetches it fresh on each visit.
---
window.HD_VERSION = '{{ site.github.build_revision }}';
window.HD_DATE = '{{ site.time | date: "%b %-d, %Y" }}';
