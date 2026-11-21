<script lang="ts">
	import teaching from '$lib/data/teaching.json';

	type Item = {
		id: string;
		title: string | null;
		code: string | null;
		type: string | null;
		season: string | null;
		year: number | null;
		oneLiner: string | null;
		link: string | null;
		at: { name: string | null }[];
	};

	const items = teaching as Item[];

	// One section per Type, in a fixed order; anything untyped goes last.
	const order = [
		'Course',
		'Workshop',
		'Guest lecture',
		'Guest critic',
		'Juror',
		'Panel',
		'Residency',
		'Conference',
		'Thesis advising'
	];
	const groups = order
		.map((type) => ({ type, rows: items.filter((i) => i.type === type) }))
		.filter((g) => g.rows.length);
	const untyped = items.filter((i) => !i.type || !order.includes(i.type));
	if (untyped.length) groups.push({ type: 'Other', rows: untyped });
</script>

<svelte:head>
	<title>Teaching — Kristian Bjørnard</title>
	<meta name="description" content="Courses, workshops, lectures and crits taught by Kristian Bjørnard." />
</svelte:head>

<header class="mb-8 border-b-2 border-border pb-4">
	<h1 class="m-0">Teaching</h1>
	<p class="m-0 text-text-muted">Kristian Bjørnard</p>
</header>

{#if !items.length}
	<p>Nothing published yet. Mark rows Public in Notion, then run <code>npm run sync</code>.</p>
{/if}

{#each groups as group (group.type)}
	<section class="mb-8">
		<h2 class="mb-2 border-b border-border pb-1">{group.type}</h2>
		<ul class="m-0 list-none p-0">
			{#each group.rows as item (item.id)}
				<li class="border-b border-border py-2">
					<p class="m-0">
						{#if item.code}<span class="text-text-muted">{item.code}</span>{/if}
						{#if item.link}
							<a href={item.link}>{item.title}</a>
						{:else}
							{item.title}
						{/if}
					</p>
					<p class="m-0 text-sm text-text-muted">
						{[item.season, item.year].filter(Boolean).join(' ')}{#if item.at.length}
							· {item.at.map((a) => a.name).join(', ')}{/if}
					</p>
					{#if item.oneLiner}<p class="m-0 text-sm">{item.oneLiner}</p>{/if}
				</li>
			{/each}
		</ul>
	</section>
{/each}

<footer class="mt-12 border-t border-border pt-2 text-sm text-text-muted">
	<p class="m-0">
		Text <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. Code
		<a href="https://github.com/bjornmeansbear/teaching-site">AGPL-3.0</a>.
	</p>
</footer>
