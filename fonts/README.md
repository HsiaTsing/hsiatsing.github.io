# Self-hosted homepage fonts

Windows, macOS and iOS use the installed Georgia font for Latin text. Other
platforms, including Android and Linux, load the self-hosted Gelasio font.
An inline script in `index.html` selects the font before the stylesheet loads,
using `navigator.userAgentData.platform` or `navigator.platform`, with a user-agent
fallback when neither is available. iPadOS reporting `MacIntel` takes the Georgia
path too. If Georgia is unavailable, Gelasio remains its fallback.

The Chinese name always uses the same self-hosted Noto Serif SC subset, including
on Windows, so changing the Latin font does not change the Chinese typeface.
There are no runtime Google Fonts or other third-party font requests.

- `gelasio-latin-variable.woff2`: Gelasio v14, normal style, variable weights
  400–700, Latin subset. Used for body text, headings and research tabs on platforms
  other than Windows, macOS and iOS, and as a fallback when Georgia is unavailable.
  Upstream: https://github.com/SorkinType/Gelasio
  Download: https://fonts.gstatic.com/s/gelasio/v14/cIf9MaFfvUQxTTqS9C6hYQ.woff2
  License: `Gelasio-OFL.txt` (SIL Open Font License 1.1).
- `noto-serif-sc-name-bold.woff2`: Noto Serif SC v36, weight 700, containing
  only `夏清（）` (U+590F, U+6E05, U+FF08, U+FF09). Used for the Chinese name
  in the page heading, so these glyphs also have a fixed source across platforms.
  Upstream: https://github.com/google/fonts/tree/main/ofl/notoserifsc
  Subset request: https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&display=swap&text=%E5%A4%8F%E6%B8%85%EF%BC%88%EF%BC%89
  License: `NotoSerifSC-OFL.txt` (SIL Open Font License 1.1).

The fonts were obtained on 2026-10-24. Keep both license files when redistributing
the assets. Extend the subsets before adding text in unsupported scripts; in
particular, the Chinese font currently covers only the heading above.

`index.html` always preloads the Chinese name font and preloads Gelasio only on
the platforms that prefer it. The stylesheet uses `font-display: swap` to keep
text readable during loading. Research labels are measured again after
`document.fonts.ready` resolves.
