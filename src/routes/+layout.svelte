<script lang="ts">
	import './layout.css';
	let { children } = $props();
</script>

<div class="mx-auto max-w-desktop px-4 py-8">
	{@render children()}
</div>
