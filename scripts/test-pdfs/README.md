# Test samples published in `public/examples/`

Small self-made drawings (not real products) linked from the help and learn pages.

| File | Made with |
|---|---|
| `formats-vector.pdf` | `python3 gen-formats.py formats-vector.pdf` (ReportLab) |
| `formats-image.pdf` | `pdftoppm -r 150 -png -singlefile formats-vector.pdf img` then `img2pdf img.png -o formats-image.pdf` (img2pdf 0.6.3) |
| `formats-password.pdf` | `qpdf --encrypt schematic schematic 256 -- formats-vector.pdf formats-password.pdf` (qpdf 11.9.0; open password `schematic`, a published test value) |
| `read-practice.pdf` | `python3 gen-read.py read-practice.pdf` (ReportLab) |

ReportLab output and the image and password files embed dates and random values, so re-made files differ
in bytes. The pages show the SHA-256 of the files actually published; update those when a file is replaced.
