# danlaws.com

Personal portfolio for Dan Laws: work, background and contact.

Built from the **Stipple** template in the Sandbanks Digital template library: plain HTML, CSS and JavaScript with no build step, deployed on Vercel.

| File | What it is |
| --- | --- |
| `index.html` | Home: hero film, find-me line, latest work, principles, who I've built for |
| `work.html` | Products and client sites as a filterable timeline |
| `about.html` | Bio, career, what I do, tools |
| `contact.html` | Links and a contact form |
| `404.html` | Not-found page (Vercel serves it automatically) |
| `style.css` | The Stipple template stylesheet, unchanged |
| `site.css` | Additions for this site |
| `script.js` | Template script, adapted (fixed dates on the timeline, portfolio wording) |
| `assets/` | Fonts, hero film and posters, photographs, Motion library |
| `vercel.json` | Clean URLs (`/work` rather than `/work.html`) and long caching for assets |

## Before launch

- Rewrite the four "What I hold to" lines on the home page in your own words (currently a draft).
- Connect the contact form (it validates but sends nothing yet).
- Remove `<meta name="robots" content="noindex">` from every page.

## Preview locally

```
python3 -m http.server 4321
```

then open http://localhost:4321.
