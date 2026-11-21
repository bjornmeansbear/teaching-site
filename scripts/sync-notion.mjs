// Hand-run sync: Notion -> src/lib/data/teaching.json.
// Run with `npm run sync` (reads NOTION_TOKEN from .env). The site build never
// talks to Notion; it only reads the JSON this writes, which gets committed.
//
// Privacy rules, enforced here and nowhere else:
//   - Only Teaching rows with Visibility = Public are written.
//   - Notes fields are never read into the output.
//   - A person or organization (At / With / Invited by) is named only if its
//     People & Organizations row has "OK to name" checked; otherwise dropped.
//   - A linked course project is included only if its own Visibility is Public.

import { writeFile } from 'node:fs/promises';

const TOKEN = process.env.NOTION_TOKEN;
if (!TOKEN) {
	console.error('NOTION_TOKEN is missing. Copy .env.example to .env and fill it in.');
	process.exit(1);
}

const TEACHING_DS = '41855aa2-8d71-81b9-8e62-000b26ef320e';
const OUT = new URL('../src/lib/data/teaching.json', import.meta.url);
const API = 'https://api.notion.com/v1';
const HEADERS = {
	Authorization: `Bearer ${TOKEN}`,
	'Notion-Version': '2025-09-03',
	'Content-Type': 'application/json'
};

async function notion(path, body) {
	const res = await fetch(`${API}${path}`, {
		method: body ? 'POST' : 'GET',
		headers: HEADERS,
		body: body ? JSON.stringify(body) : undefined
	});
	if (res.status === 429) {
		await new Promise((r) => setTimeout(r, 1000));
		return notion(path, body);
	}
	if (!res.ok) throw new Error(`${res.status} ${path}: ${await res.text()}`);
	return res.json();
}

async function queryAll(dataSourceId, filter) {
	const rows = [];
	let cursor;
	do {
		const page = await notion(`/data_sources/${dataSourceId}/query`, {
			filter,
			start_cursor: cursor,
			page_size: 100
		});
		rows.push(...page.results);
		cursor = page.has_more ? page.next_cursor : undefined;
	} while (cursor);
	return rows;
}

// Property readers
const text = (p) => (p?.rich_text ?? p?.title ?? []).map((t) => t.plain_text).join('').trim() || null;
const select = (p) => p?.select?.name ?? null;
const multi = (p) => (p?.multi_select ?? []).map((o) => o.name);
const num = (p) => p?.number ?? null;
const url = (p) => p?.url ?? null;
const date = (p) => (p?.date ? { start: p.date.start, end: p.date.end } : null);
const relIds = (p) => (p?.relation ?? []).map((r) => r.id);
const titleOf = (page) => {
	const prop = Object.values(page.properties).find((p) => p.type === 'title');
	return text(prop);
};

// Linked pages are fetched once each and cached.
const pageCache = new Map();
async function getPage(id) {
	if (!pageCache.has(id)) pageCache.set(id, notion(`/pages/${id}`));
	return pageCache.get(id);
}

async function namedPeople(ids) {
	const out = [];
	for (const id of ids) {
		const p = await getPage(id);
		if (p.properties['OK to name']?.checkbox) {
			out.push({ name: titleOf(p), website: url(p.properties.Website) });
		}
	}
	return out;
}

async function publicProjects(ids) {
	const out = [];
	for (const id of ids) {
		const p = await getPage(id);
		if (select(p.properties.Visibility) === 'Public') {
			out.push({
				title: titleOf(p),
				oneLiner: text(p.properties['One-liner']),
				link: url(p.properties['Source URL'])
			});
		}
	}
	return out;
}

const rows = await queryAll(TEACHING_DS, {
	property: 'Visibility',
	select: { equals: 'Public' }
});

const items = [];
for (const row of rows) {
	const p = row.properties;
	items.push({
		id: row.id,
		title: text(p.Title),
		code: text(p.Code),
		type: select(p.Type),
		role: select(p.Role),
		level: multi(p.Level),
		season: select(p.Season),
		year: num(p.Year),
		date: date(p.Date),
		sections: num(p.Sections),
		oneLiner: text(p['One-liner']),
		link: url(p.Link),
		at: await namedPeople(relIds(p.At)),
		with: await namedPeople(relIds(p.With)),
		invitedBy: await namedPeople(relIds(p['Invited by'])),
		projects: await publicProjects(relIds(p['Course projects']))
	});
}

const seasonOrder = { Winter: 0, Spring: 1, Summer: 2, Fall: 3 };
items.sort(
	(a, b) =>
		(b.year ?? 0) - (a.year ?? 0) ||
		(seasonOrder[b.season] ?? -1) - (seasonOrder[a.season] ?? -1) ||
		(a.title ?? '').localeCompare(b.title ?? '')
);

await writeFile(OUT, JSON.stringify(items, null, '\t') + '\n');
console.log(`Wrote ${items.length} public rows to src/lib/data/teaching.json`);
