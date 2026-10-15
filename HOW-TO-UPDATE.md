# How to update the website

All changing content lives in the **`data`** folder. You never need to touch the HTML pages to add an event, photos or a story.

| To change…                              | Edit this file          |
|-----------------------------------------|-------------------------|
| Events (upcoming and past)              | `data/events.json`      |
| Photo albums (gallery)                  | `data/albums.json`      |
| Stories / news                          | `data/stories.json`     |
| Team, advisors, volunteers              | `data/people.json`      |
| Counselling videos                      | `data/videos.json`      |
| Phone, email, address, social links, home banner, impact numbers, bank details, menu | `data/site.json` |

Photos go in the **`images`** folder. Refer to them as `images/file-name.jpg`.

---

## Golden rules for JSON

1. Text goes inside **"double quotes"**. Use the curly/typographic apostrophe ’ or a plain ' inside text — never a double quote.
2. Items in a list are separated by a **comma**. No comma after the last item.
3. After saving, paste the file into **https://jsonlint.com** and press *Validate*. If it says valid, upload it. If one file is broken, that part of the site shows a "could not be loaded" message — nothing else breaks.
4. Dates are always **YYYY-MM-DD**, for example `2026-11-20`.
5. Keep `"id"` values lower-case with dashes, and never reuse one: `tree-plantation-2026`.

Tip: use a free editor such as **VS Code** or **Notepad++** – they colour the text and highlight mistakes.

---

## Add an event

Open `data/events.json`, copy an existing block `{ … }` and paste it at the top of the list (after `"events": [`), add a comma after it, then change the details:

```json
{
  "id": "tree-plantation-swabi-2026",
  "title": "Tree plantation drive, Swabi",
  "type": "Environment",
  "date": "2026-11-20",
  "endDate": "",
  "time": "9:00 am – 12:00 pm",
  "venue": "Government High School, Swabi",
  "mapUrl": "https://maps.app.goo.gl/…",
  "registerUrl": "https://forms.gle/…",
  "image": "images/swabi-plantation-banner.jpg",
  "summary": "Join us to plant 500 saplings with local students.",
  "body": [
    "First paragraph.",
    "Second paragraph."
  ],
  "album": ""
},
```

- `type`: use the same words every time (Counselling, Welfare, Relief, Environment) — they become the filter buttons.
- `registerUrl`: a Google Form or WhatsApp link. Leave `""` and the button goes to the Contact page.
- The event moves to **Past events** by itself the day after its date. No need to edit it.
- `"draft": true` hides an event while you prepare it.
- After the event, create an album (below) and put its id in `"album"` — the photos then appear on the event page.

## Add a photo album

1. Resize photos to about **1600 px wide** (phone photos are often 4000 px and load slowly). Free tool: https://squoosh.app
2. Upload them to the `images` folder.
3. Add a block to `data/albums.json`:

```json
{
  "id": "tree-plantation-swabi-2026",
  "title": "Tree plantation, Swabi",
  "type": "Environment",
  "date": "2026-11-20",
  "story": "",
  "description": "Students and volunteers planted 500 saplings.",
  "photos": [
    "images/swabi-01.jpg",
    "images/swabi-02.jpg",
    "images/swabi-03.jpg"
  ]
},
```

The first photo is the cover. Albums are sorted newest first by `date`.

## Add a story

Add a block to `data/stories.json` (newest at the top). Each paragraph is one line in `"body"`. Link it to an album with `"album": "album-id"`.

## Add a team member or volunteer

Add a block to `data/people.json`:

```json
{ "group": "volunteers", "name": "Full Name", "role": "", "photo": "images/full-name.jpg" },
```

`group` is `team`, `advisors` or `volunteers`. People show in the order they appear in the file. A square photo works best; if a photo is missing, their initials are shown instead.

## Home page impact numbers

In `data/site.json`, fill in `"number"` under `"stats"`, e.g. `"number": "1,200+"`. The strip stays hidden until at least one number is filled in.

## Bank details for donations

In `data/site.json` under `"donate"`, put the details in `"bankDetails"`. Use `\n` for a new line:

```json
"bankDetails": "Account title: The Seekers Club\nBank: …\nIBAN: …\nJazzCash: 03xx xxxxxxx"
```

---

## Uploading changes

Upload the changed files to the same place on the server (File Manager, FTP or Git — whichever your host uses). Changes show immediately; if you don't see them, refresh the page (Ctrl + F5).
