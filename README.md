# teaching-site

A reference site of the courses, projects, workshops and lectures I've taught
over the years. Lives at teaching.kristianbjornard.com.

## How it works

The record lives in Notion (the **Teaching** database in Portfolio Index,
linked to Course Projects and People & Organizations). A sync script that I run
by hand reads Notion and writes `src/lib/data/teaching.json`, which gets
committed. The site is fully static (SvelteKit + `adapter-static`) and the
build never talks to Notion.

What gets published is decided in Notion, and enforced by the sync script:

- only Teaching rows with **Visibility = Public**
- people and organizations only if **OK to name** is checked
- linked course projects only if their own Visibility is Public
- Notes fields are never synced

## Updating

```sh
cp .env.example .env    # once: add the Notion integration token
npm install             # once
npm run sync            # Notion -> src/lib/data/teaching.json
npm run dev             # look at it
git add src/lib/data && git commit -m "sync teaching data"
```

The Notion integration needs access to Teaching, People & Organizations and
Course Projects. `.env` is git-ignored; never commit the token.

## Design

Styled with `src/lib/kit.css`, copied verbatim from
`~/Code/color-system-and-guidelines` and mapped into Tailwind 4 in
`src/routes/layout.css`. Re-copy it with that repo's `scripts/sync.py`.

## License

Writing and data: CC BY-SA 4.0. Code: AGPL-3.0. `kit.css` is public domain;
student work belongs to the students. See `LICENSE`.
