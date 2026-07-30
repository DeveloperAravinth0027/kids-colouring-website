// ============================================================
// Sample catalogue data (front-end demo)
// Used until the backend API is connected. Each book has a real
// photo (Unsplash) plus a guaranteed colourful SVG fallback cover
// so nothing ever renders as a broken image — even offline.
// ============================================================

// Build a cheerful gradient + emoji cover as an inline SVG data URI.
export const svgCover = (emoji, c1, c2) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='500' height='600'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0' stop-color='${c1}'/>
          <stop offset='1' stop-color='${c2}'/>
        </linearGradient>
      </defs>
      <rect width='500' height='600' rx='24' fill='url(#g)'/>
      <circle cx='90' cy='110' r='60' fill='rgba(255,255,255,0.15)'/>
      <circle cx='420' cy='500' r='90' fill='rgba(255,255,255,0.12)'/>
      <text x='50%' y='48%' font-size='210' text-anchor='middle' dominant-baseline='central'>${emoji}</text>
    </svg>`.replace(/\s+/g, ' ')
  )}`;

const U = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=80`;

export const categories = [
  { id: 1, slug: 'animals',   name: 'Animals',   emoji: '🦁', colors: ['#FF9F43', '#FF6B6B'], description: 'Lions, kittens, farm friends and more!' },
  { id: 2, slug: 'ocean',     name: 'Ocean',     emoji: '🐠', colors: ['#4D96FF', '#48D1CC'], description: 'Dive into a world of fish and mermaids.' },
  { id: 3, slug: 'space',     name: 'Space',     emoji: '🚀', colors: ['#9B5DE5', '#5D2E8C'], description: 'Rockets, planets and shining stars.' },
  { id: 4, slug: 'dinosaurs', name: 'Dinosaurs', emoji: '🦕', colors: ['#6BCB77', '#2E8B57'], description: 'Roar back to the age of dinos!' },
  { id: 5, slug: 'fantasy',   name: 'Fantasy',   emoji: '🦄', colors: ['#FF6B6B', '#9B5DE5'], description: 'Unicorns, castles and fairy magic.' },
  { id: 6, slug: 'vehicles',  name: 'Vehicles',  emoji: '🚗', colors: ['#4D96FF', '#3A7DDB'], description: 'Zoom-zoom cars, trucks and trains.' },
];

const raw = [
  { slug: 'safari-friends', title: 'Safari Friends', cat: 'animals',   emoji: '🦁', photo: '1611145367651-6303c8b8b5f7', price: 199, finalPrice: 149, rating: 4.9, reviews: 214, pages: 32, age: '3-6',  bestseller: true,  featured: true,  desc: 'Meet lions, giraffes, zebras and elephants on a sunny safari. 32 big, bold outlines perfect for little hands.' },
  { slug: 'farm-animals',   title: 'Farm Animals',   cat: 'animals',   emoji: '🐄', photo: '1500595046743-cd271d694d30', price: 179, finalPrice: 179, rating: 4.7, reviews: 98,  pages: 28, age: '2-5',  bestseller: false, featured: false, free: true,  desc: 'Cows, pigs, ducks and clucky hens! A gentle farmyard set for the youngest colourers.' },
  { slug: 'under-the-sea',  title: 'Under the Sea',  cat: 'ocean',     emoji: '🐠', photo: '1518837695005-2083093ee35b', price: 199, finalPrice: 159, rating: 4.8, reviews: 176, pages: 30, age: '4-8',  bestseller: true,  featured: true,  desc: 'Clownfish, turtles and playful dolphins glide across every page of this ocean adventure.' },
  { slug: 'ocean-explorers',title: 'Ocean Explorers',cat: 'ocean',     emoji: '🐙', photo: '1546026423-cc4642628d2b', price: 189, finalPrice: 189, rating: 4.6, reviews: 61,  pages: 26, age: '5-9',  bestseller: false, featured: false, desc: 'Octopuses, seahorses and a friendly submarine crew. Detailed pages for confident colourers.' },
  { slug: 'space-adventure',title: 'Space Adventure',cat: 'space',     emoji: '🚀', photo: '1446776811953-b23d57bd21aa', price: 229, finalPrice: 179, rating: 5.0, reviews: 302, pages: 34, age: '4-8',  bestseller: true,  featured: true,  desc: 'Blast off with rockets, astronauts and grinning aliens across the galaxy. Our #1 bestseller!' },
  { slug: 'planet-party',   title: 'Planet Party',   cat: 'space',     emoji: '🪐', photo: '1454789548928-9efd52dc4031', price: 199, finalPrice: 199, rating: 4.7, reviews: 84,  pages: 28, age: '5-9',  bestseller: false, featured: false, desc: 'Every planet in the solar system gets its own dazzling page. Learn and colour at the same time.' },
  { slug: 'dino-world',     title: 'Dino World',     cat: 'dinosaurs', emoji: '🦕', photo: '1519880856348-763a8b40aa79', price: 219, finalPrice: 169, rating: 4.9, reviews: 241, pages: 36, age: '4-9',  bestseller: true,  featured: true,  desc: 'Stomp through a prehistoric jungle full of long-necked, friendly dinosaurs. 36 roaring pages!' },
  { slug: 't-rex-trails',   title: 'T-Rex Trails',   cat: 'dinosaurs', emoji: '🦖', photo: '1606856110002-d0991ce78250', price: 199, finalPrice: 199, rating: 4.6, reviews: 73,  pages: 30, age: '6-10', bestseller: false, featured: false, desc: 'Follow the mighty T-Rex through volcanoes and fern forests. For older kids who love a challenge.' },
  { slug: 'magic-unicorns', title: 'Magic Unicorns', cat: 'fantasy',   emoji: '🦄', photo: '1535083783855-76ae62b2914e', price: 229, finalPrice: 189, rating: 5.0, reviews: 358, pages: 32, age: '3-8',  bestseller: true,  featured: true,  desc: 'Rainbows, sparkles and magical unicorns on every page. The most-loved book in our collection.' },
  { slug: 'fairy-castle',   title: 'Fairy Castle',   cat: 'fantasy',   emoji: '🏰', photo: '1533154683836-84ea7a0bc310', price: 199, finalPrice: 199, rating: 4.8, reviews: 129, pages: 30, age: '4-8',  bestseller: false, featured: false, desc: 'Enchanted castles, tiny fairies and friendly dragons await in this storybook set.' },
  { slug: 'race-cars',      title: 'Race Cars',      cat: 'vehicles',  emoji: '🏎️', photo: '1503376780353-7e6692767b70', price: 189, finalPrice: 149, rating: 4.7, reviews: 112, pages: 28, age: '3-7',  bestseller: false, featured: true,  desc: 'Vroom! Speedy race cars, checkered flags and pit-stops for little speed fans.' },
  { slug: 'big-trucks',     title: 'Big Trucks',     cat: 'vehicles',  emoji: '🚚', photo: '1519003722824-194d4455a60c', price: 179, finalPrice: 179, rating: 4.5, reviews: 67,  pages: 26, age: '2-6',  bestseller: false, featured: false, free: true,  desc: 'Diggers, dumpers and fire trucks! Chunky outlines built for the tiniest hands.' },
];

export const books = raw.map((b, i) => {
  const cat = categories.find((c) => c.slug === b.cat);
  return {
    id: i + 1,
    slug: b.slug,
    name: b.title,
    title: b.title,
    categorySlug: b.cat,
    categoryName: cat.name,
    categoryEmoji: cat.emoji,
    emoji: b.emoji,
    colors: cat.colors,
    price: b.price,
    finalPrice: b.finalPrice,
    discount: Math.round(((b.price - b.finalPrice) / b.price) * 100),
    rating: b.rating,
    reviews: b.reviews,
    pages: b.pages,
    ageRange: b.age,
    bestseller: b.bestseller,
    featured: b.featured,
    bookType: b.type || 'COLOURING',
    isFree: b.free || false,
    description: b.desc,
    coverImageUrl: U(b.photo),
    fallbackCover: svgCover(b.emoji, cat.colors[0], cat.colors[1]),
  };
});

export const getBookBySlug = (slug) => books.find((b) => b.slug === slug);
export const getCategoryBySlug = (slug) => categories.find((c) => c.slug === slug);
export const getBooksByCategory = (slug) => books.filter((b) => b.categorySlug === slug);
export const featuredBooks = books.filter((b) => b.featured);
export const bestsellerBooks = books.filter((b) => b.bestseller);
