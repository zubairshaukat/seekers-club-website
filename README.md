# The Seekers Club – static website

Plain HTML + CSS + JavaScript. All changing content (events, gallery, stories, people, videos, contact details) is in `data/*.json` and is rendered in the browser by `assets/js/app.js`. No database, no CMS, no build step.

```
index.html  about.html  projects.html  youth.html
events.html event.html  gallery.html   album.html
stories.html story.html people.html    contact.html  donate.html  404.html
data/        site.json events.json albums.json stories.json people.json videos.json
assets/      css/style.css  js/app.js
images/      local photos
tools/       localize-images.py  (one-off migration helper)
.htaccess    Apache: 404 page, no-cache for JSON, 301s from old WordPress URLs
HOW-TO-UPDATE.md   guide for the person who maintains content
```

## Run locally

The pages load JSON with `fetch()`, so they must be served over HTTP (opening `index.html` as a file shows an error box):

```bash
python3 -m http.server 8080      # then open http://localhost:8080
```

## Migration from the WordPress site

1. **Copy the photos first.** The JSON still points at `theseekersclub.org/wp-content/uploads/…`. While WordPress is still live, run from this folder:
   ```bash
   python3 tools/localize-images.py
   ```
   It downloads every referenced photo into `images/` and rewrites the JSON/HTML to use the local copies. Team photo paths were inferred (`2025/09/…`) — any that fail are listed and simply show initials until replaced.
2. Upload the folder to the web root (Apache, Nginx, cPanel, Netlify, Cloudflare Pages or GitHub Pages all work).
3. Point the domain at it.

### Nginx (instead of .htaccess)

```nginx
root /var/www/theseekersclub;
index index.html;
error_page 404 /404.html;

location ~* \.json$ { add_header Cache-Control "no-cache"; }
location ~* \.(css|js|jpg|jpeg|png|webp|svg)$ { expires 30d; }

# Old WordPress addresses
rewrite ^/about/?$          /about.html permanent;
rewrite ^/people/?$         /people.html?group=team permanent;
rewrite ^/advisors/?$       /people.html?group=advisors permanent;
rewrite ^/volunteers/?$     /people.html?group=volunteers permanent;
rewrite ^/projects/?$       /projects.html permanent;
rewrite ^/youth/?$          /youth.html permanent;
rewrite ^/contact/?$        /contact.html permanent;
rewrite ^/donate/?$         /donate.html permanent;
rewrite ^/news-and-events/?$ /stories.html permanent;
rewrite ^/category/         /stories.html permanent;
rewrite ^/(\d{4}/\d{2}/\d{2}/)?sawabi-support/?$  /story.html?id=swabi-cloudburst-relief permanent;
rewrite ^/(\d{4}/\d{2}/\d{2}/)?jallalpur/?$       /story.html?id=jalalpur-pirwala-outreach permanent;
rewrite ^/(\d{4}/\d{2}/\d{2}/)?vestibulum-commodo-volutpat-laoreet/?$ /story.html?id=mansehra-cash-distribution permanent;
rewrite ^/(\d{4}/\d{2}/\d{2}/)?plantation/?$      /story.html?id=tree-plantation-and-coolers permanent;
rewrite ^/(\d{4}/\d{2}/\d{2}/)?southpunjab/?$     /story.html?id=south-punjab-tree-plantation permanent;
rewrite ^/(\d{4}/\d{2}/\d{2}/)?ration/?$          /story.html?id=sindh-ration-distribution permanent;
```

## Content still to confirm with the client

- Event list is empty (one hidden example in `events.json`). Add real upcoming events.
- Dates for five older stories/albums are blank: the WordPress posts were dated 2014, before the trust was founded (July 2015), so those dates were wrong.
- Impact numbers on the home page (`site.json → stats`) – hidden until filled.
- Bank / mobile wallet details for the Donate page (`site.json → donate.bankDetails`).
- Contact form: set `site.json → contact.contactFormUrl` to a Google Form if they want one.
- Email: the old site showed `support@theseekersclube.org` (typo). This build uses `support@theseekersclub.org` – confirm it receives mail.
- Gallery albums currently hold 1–2 photos each (that is all the old site had). Add the full sets from their WhatsApp/Drive.
- Two images in the old plantation post (`home_ngo_blog1-4.jpg`) were BeNGO theme demo photos and were dropped.

## Notes

- Fonts: Outfit (headings) + Nunito Sans (body) from Google Fonts. Colours are CSS variables at the top of `style.css`.
- Draft content: any item with `"draft": true` in a JSON file is hidden.
- YouTube videos load only when tapped (fast pages, no tracking until play).

## Deployment (GitHub Actions)

Every push to `main` runs `.github/workflows/deploy.yml`:

1. **Check** – every `data/*.json` must be valid JSON, otherwise nothing is uploaded (the live site is never broken by a typo).
2. **Upload** – only changed files are sent to the server over FTPS/FTP.

Set these once in the repo under **Settings → Secrets and variables → Actions**:

| Type     | Name           | Example                         |
|----------|----------------|---------------------------------|
| Secret   | `FTP_SERVER`   | `ftp.theseekersclub.org`        |
| Secret   | `FTP_USERNAME` | `deploy@theseekersclub.org`     |
| Secret   | `FTP_PASSWORD` | ••••••                          |
| Variable | `FTP_DIR`      | `/public_html/` (must end in `/`) |
| Variable | `FTP_PROTOCOL` | `ftps` (default) or `ftp`       |
| Variable | `FTP_PORT`     | `21` (default)                  |
| Variable | `FTP_SECURITY` | `loose` only if `FTP_SERVER` is an IP address (certificate won't match) |

Re-run a deploy any time from **Actions → Deploy website → Run workflow**.
The first run uploads everything; later runs upload only what changed (a `.ftp-deploy-sync-state.json` file on the server tracks this — don't delete it).
