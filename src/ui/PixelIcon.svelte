<script lang="ts">
  import { ICONS, type IconId } from './icons';

  /** Pixelsymbol 16×16, ganzzahlig skaliert und nie weichgezeichnet */
  let { id, scale = 1, title = '' }: { id: IconId; scale?: number; title?: string } = $props();

  /** Gleichfarbige Pixel einer Reihe werden zu einem Rechteck zusammengefasst */
  const rects = $derived.by(() => {
    const icon = ICONS[id];
    const palette: Record<string, string> = icon.palette;
    const out: { x: number; y: number; w: number; color: string }[] = [];
    icon.rows.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const c = row[x]!;
        let w = 1;
        while (row[x + w] === c) w += 1;
        const color = palette[c];
        if (c !== '.' && color) out.push({ x, y, w, color });
        x += w;
      }
    });
    return out;
  });
</script>

<svg
  class="icon"
  viewBox="0 0 16 16"
  width={16 * scale}
  height={16 * scale}
  shape-rendering="crispEdges"
  role={title ? 'img' : 'presentation'}
  aria-label={title || undefined}
  aria-hidden={title ? undefined : 'true'}
>
  {#each rects as r, i (i)}
    <rect x={r.x} y={r.y} width={r.w} height="1" fill={r.color} />
  {/each}
</svg>

<style>
  .icon {
    display: inline-block;
    flex: none;
    vertical-align: middle;
  }
</style>
