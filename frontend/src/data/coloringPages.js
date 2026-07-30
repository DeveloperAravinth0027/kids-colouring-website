// ============================================================
// Sample colouring-page outlines (vector line art).
//
// In production these pages come from the backend PDF pipeline:
//   PDF -> Apache PDFBox render -> PNG per page -> outline layer.
// Here we ship a set of self-contained SVG outlines so the
// Coeuring Studio is fully usable without the backend.
// Each outline: transparent background, dark closed strokes,
// framed so the paint bucket can't leak to the page edge.
// ============================================================

const wrap = (inner) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000' width='1000' height='1000'>
      <g fill='none' stroke='#111827' stroke-width='5' stroke-linejoin='round' stroke-linecap='round'>
        <rect x='16' y='16' width='968' height='968' rx='30'/>
        ${inner}
      </g>
    </svg>`.replace(/\s+/g, ' ')
  )}`;

export const OUTLINES = [
  {
    id: 'flower',
    name: 'Pretty Flower',
    svg: wrap(`
      <rect x='485' y='560' width='30' height='330' rx='12'/>
      <ellipse cx='430' cy='700' rx='72' ry='34' transform='rotate(-25 430 700)'/>
      <ellipse cx='578' cy='760' rx='72' ry='34' transform='rotate(25 578 760)'/>
      <circle cx='500' cy='230' r='78'/>
      <circle cx='630' cy='305' r='78'/>
      <circle cx='630' cy='455' r='78'/>
      <circle cx='500' cy='530' r='78'/>
      <circle cx='370' cy='455' r='78'/>
      <circle cx='370' cy='305' r='78'/>
      <circle cx='500' cy='380' r='82'/>
    `),
  },
  {
    id: 'butterfly',
    name: 'Happy Butterfly',
    svg: wrap(`
      <ellipse cx='500' cy='500' rx='26' ry='180'/>
      <ellipse cx='368' cy='388' rx='150' ry='120'/>
      <ellipse cx='632' cy='388' rx='150' ry='120'/>
      <ellipse cx='392' cy='624' rx='120' ry='100'/>
      <ellipse cx='608' cy='624' rx='120' ry='100'/>
      <circle cx='360' cy='378' r='42'/>
      <circle cx='640' cy='378' r='42'/>
      <circle cx='392' cy='624' r='34'/>
      <circle cx='608' cy='624' r='34'/>
      <path d='M500 330 C 470 268 440 250 418 232'/>
      <path d='M500 330 C 530 268 560 250 582 232'/>
    `),
  },
  {
    id: 'car',
    name: 'Speedy Car',
    svg: wrap(`
      <rect x='170' y='555' width='660' height='140' rx='46'/>
      <path d='M320 560 L406 466 L640 466 L706 560 Z'/>
      <rect x='424' y='486' width='96' height='70' rx='12'/>
      <rect x='540' y='486' width='128' height='70' rx='12'/>
      <circle cx='322' cy='705' r='72'/>
      <circle cx='678' cy='705' r='72'/>
      <circle cx='322' cy='705' r='28'/>
      <circle cx='678' cy='705' r='28'/>
      <circle cx='808' cy='600' r='20'/>
    `),
  },
  {
    id: 'fish',
    name: 'Friendly Fish',
    svg: wrap(`
      <ellipse cx='470' cy='500' rx='232' ry='150'/>
      <path d='M694 500 L860 398 L838 500 L860 602 Z'/>
      <path d='M360 396 Q382 500 360 604'/>
      <circle cx='330' cy='452' r='26'/>
      <circle cx='330' cy='452' r='10'/>
      <path d='M470 612 Q506 706 566 682 Q522 640 500 600 Z'/>
      <path d='M430 360 Q474 282 566 320 Q512 360 482 382 Z'/>
      <circle cx='250' cy='300' r='24'/>
      <circle cx='196' cy='236' r='15'/>
    `),
  },
  {
    id: 'house',
    name: 'Cosy House',
    svg: wrap(`
      <rect x='300' y='500' width='400' height='320'/>
      <path d='M266 500 L500 316 L734 500 Z'/>
      <rect x='448' y='648' width='104' height='172' rx='8'/>
      <rect x='338' y='558' width='94' height='94'/>
      <rect x='568' y='558' width='94' height='94'/>
      <circle cx='806' cy='230' r='66'/>
      <path d='M806 132 v-34 M806 362 v-34 M708 230 h-34 M938 230 h-34 M737 161 l-24 -24 M899 299 l-24 -24 M875 161 l24 -24 M713 299 l24 -24'/>
      <path d='M150 262 q-42 0 -42 42 q0 42 42 42 h150 q42 0 42 -42 q0 -42 -42 -42 q-12 -42 -64 -30 q-32 -30 -86 30 Z'/>
    `),
  },
  {
    id: 'star',
    name: 'Night Star',
    svg: wrap(`
      <polygon points='500,262 553,408 709,412 586,508 629,656 500,570 371,656 414,508 291,412 447,408'/>
      <circle cx='772' cy='250' r='64'/>
      <path d='M210 620 l16 42 l42 16 l-42 16 l-16 42 l-16 -42 l-42 -16 l42 -16 Z'/>
      <path d='M300 760 l12 32 l32 12 l-32 12 l-12 32 l-12 -32 l-32 -12 l32 -12 Z'/>
      <path d='M760 640 l12 32 l32 12 l-32 12 l-12 32 l-12 -32 l-32 -12 l32 -12 Z'/>
    `),
  },
];

// In production: fetch the book's rendered pages from the API.
// Here: give every book the sample outline set as its pages.
export const getPagesForBook = (book) => {
  const offset = ((book?.id ?? 0) % OUTLINES.length);
  return OUTLINES.map((_, i) => {
    const o = OUTLINES[(i + offset) % OUTLINES.length];
    return { id: `${book?.slug || 'demo'}-${i}`, index: i, name: o.name, svg: o.svg };
  });
};
