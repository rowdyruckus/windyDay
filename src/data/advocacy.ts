// Advocacy: the case for local, self-reliant, poison-free food — and the
// language to invite other people into it. Fruit trees and a few hens are the
// two smallest levers an ordinary household can pull, so everything here is
// built around making that ask easy to send.
import { PlacedStructure } from '../types';

export interface CasePoint {
  id: string;
  icon: string;
  title: string;
  body: string;
}

/** The argument, in the order it tends to land with someone new. */
export const CASE_POINTS: CasePoint[] = [
  {
    id: 'ripe',
    icon: '🍑',
    title: 'Fruit picked ripe tastes like a different food',
    body:
      'Supermarket fruit is bred and picked for the journey — firm enough to survive weeks of trucks and cold rooms. A peach off your own tree was never asked to travel. Most people who taste one stop arguing.',
  },
  {
    id: 'poisonfree',
    icon: '🚫',
    title: 'A mixed planting does not need a spray schedule',
    body:
      "Pests explode where one crop stands alone for acres. Mix seven layers of plants, let the blossom feed predators, and let hens patrol the drop zone, and you remove the reason to spray in the first place. Poison-free isn't a sacrifice here — it's what the design does instead.",
  },
  {
    id: 'hens',
    icon: '🐔',
    title: 'Chickens close the loop',
    body:
      'Kitchen scraps, windfall fruit and bugs go in; eggs, fertilizer and tilled mulch come out. Roughly 250 eggs a hen a year, no packaging, no truck, no feedlot. Four hens turn a household into a small working farm.',
  },
  {
    id: 'cheap',
    icon: '🌳',
    title: 'A tree is the cheapest infrastructure you will ever buy',
    body:
      'A bare-root fruit tree costs about what a few weeks of store fruit costs, and then it feeds you for thirty or forty years — while shading the soil, holding water and growing in value the whole time.',
  },
  {
    id: 'selfreliance',
    icon: '🤝',
    title: 'Self-reliance is the neighborly kind',
    body:
      'A household that grows some of its own is a household with surplus to give. Resilience travels: the plum glut goes over the fence, the spare eggs go next door, and a street that feeds itself a little is a street that holds together when supply lines wobble.',
  },
  {
    id: 'soil',
    icon: '🪱',
    title: 'Fertility built on site, not bought in a bag',
    body:
      'Nitrogen fixers, deep-rooted herbs, chicken manure and leaf mulch make your soil richer every year instead of poorer. That is the whole difference between farming that regenerates and farming that depletes.',
  },
  {
    id: 'habitat',
    icon: '🦋',
    title: 'An unsprayed yard is habitat',
    body:
      'Blossom that nobody poisons feeds bees, butterflies and the birds that eat your pests for free. Every unsprayed garden is a stepping stone joining up the wild ground between them.',
  },
  {
    id: 'local',
    icon: '📍',
    title: 'Back the growers near you',
    body:
      'Not everyone has land. Buying from the local no-spray grower — the roadside stall, the market, the CSA box — is the same vote cast with money, and it keeps that farm in business for the neighbors who need it.',
  },
];

export interface ActionIdea {
  id: string;
  icon: string;
  title: string;
  detail: string;
}

/** Concrete, small, this-season things that spread the practice locally. */
export const ACTIONS: ActionIdea[] = [
  {
    id: 'gift-tree',
    icon: '🎁',
    title: 'Plant a gift tree on the boundary',
    detail:
      'A fruit tree at the fence line drops half its harvest on the public side. Whoever walks past gets fed, and the whole street watches an argument for fruit trees ripen every year.',
  },
  {
    id: 'surplus',
    icon: '🧺',
    title: 'Give the glut away — deliberately',
    detail:
      'Nobody eats forty pounds of plums. Pick two neighbors and take them fruit or spare eggs at the peak. Surplus is the most persuasive leaflet ever printed.',
  },
  {
    id: 'scion-swap',
    icon: '✂️',
    title: 'Host a late-winter scion swap',
    detail:
      'Cuttings from a proven local tree are free, travel in a plastic bag, and are already adapted to your climate. A kitchen table, a few knives and some rootstock starts a dozen orchards.',
  },
  {
    id: 'map',
    icon: '🗺️',
    title: 'Map the fruit on your street',
    detail:
      'Log the trees on public ground and the ones whose owners are happy to share. A gleaning list turns fruit that was rotting on the pavement into food, and neighbors into a network.',
  },
  {
    id: 'nursery',
    icon: '🏬',
    title: 'Ask your nursery for bare-root stock',
    detail:
      'Bare-root season is cheap and gives the widest variety choice. Nurseries stock what people ask for — ask, and bring someone with you.',
  },
  {
    id: 'hens-next-door',
    icon: '🥚',
    title: 'Talk a neighbor into three hens',
    detail:
      'Three hens are quieter than a dog, eat the food waste of two households and pay rent in eggs. Offer to mind them when your neighbor travels, and the last objection disappears.',
  },
  {
    id: 'council',
    icon: '🏛️',
    title: 'Push your town to plant food, not ornamentals',
    detail:
      'Parks and verges get planted with something every year. Ask for fruit and nut trees instead, and for backyard hens to be allowed. It costs the same and the budget is already spent.',
  },
  {
    id: 'sign',
    icon: '🪧',
    title: 'Put a small sign on the fence',
    detail:
      '"No poisons used here — bees welcome." It answers the question passers-by are already wondering about, and gives the neighbor who wants to stop spraying permission to go first.',
  },
  {
    id: 'kids',
    icon: '👧',
    title: 'Let a kid collect the eggs',
    detail:
      'Nothing recruits a family faster than a child who has met a hen and picked a berry off the bush. Invite them in at harvest.',
  },
  {
    id: 'buy-local',
    icon: '💵',
    title: 'Buy from the no-spray grower first',
    detail:
      'Find the nearest grower who does it without poisons and make them your default. Tell them why you came — growers hear the complaints and rarely the reasons.',
  },
];

/** The commitments behind the poison-free pledge. */
export const PLEDGE_LINES: { id: string; icon: string; text: string }[] = [
  { id: 'no-spray', icon: '🚫', text: 'No pesticides, herbicides or synthetic fertilizer on my ground' },
  { id: 'diversity', icon: '🌈', text: 'Plant diversity and let predators do the pest control' },
  { id: 'soil', icon: '🪱', text: 'Feed the soil with mulch, manure and nitrogen fixers' },
  { id: 'share', icon: '🧺', text: 'Share the surplus, the seed and the cuttings' },
  { id: 'invite', icon: '📣', text: 'Invite someone else to grow their own each year' },
];

/** Approximate eggs a healthy laying hen gives per year. */
export const EGGS_PER_HEN_PER_YEAR = 250;
/** Approximate fresh manure per hen per year (kg) — real fertilizer, on site. */
const MANURE_KG_PER_HEN_PER_YEAR = 35;

export interface FlockSummary {
  coops: number;
  hens: number;
  eggsPerYear: number;
  manureKgPerYear: number;
}

/** Roll up the coops in a design into what the flock actually gives back. */
export function flockSummary(structures: PlacedStructure[]): FlockSummary {
  const coops = structures.filter((s) => s.type === 'coop');
  const hens = coops.reduce((n, c) => n + (c.flockSize ?? 4), 0);
  return {
    coops: coops.length,
    hens,
    eggsPerYear: hens * EGGS_PER_HEN_PER_YEAR,
    manureKgPerYear: Math.round(hens * MANURE_KG_PER_HEN_PER_YEAR),
  };
}

export type InviteKind = 'neighbor' | 'friend' | 'community' | 'grower';

export const INVITES: {
  key: InviteKind;
  icon: string;
  label: string;
  blurb: string;
}[] = [
  {
    key: 'neighbor',
    icon: '🏡',
    label: 'A neighbor',
    blurb: 'Two doors down, over the fence — the easiest tree to get planted',
  },
  {
    key: 'friend',
    icon: '💬',
    label: 'Family or a friend',
    blurb: 'Someone who has a yard and has never thought about it',
  },
  {
    key: 'community',
    icon: '🏛️',
    label: 'Your town or group',
    blurb: 'A council, school, HOA or community garden — plant food, not ornamentals',
  },
  {
    key: 'grower',
    icon: '🚜',
    label: 'A local grower',
    blurb: 'Thank the farm doing it without poisons, and send them customers',
  },
];

export interface InviteContext {
  /** What the user calls their land. */
  placeLabel: string;
  /** Fruit & nut trees in the design. */
  trees: number;
  /** Distinct species planted. */
  species: number;
  /** Hens in the design (0 if no coop). */
  hens: number;
  /** Pre-formatted harvest at maturity, e.g. "820 lb". */
  harvest: string;
  /** Pre-formatted yearly grocery value, e.g. "$1.9k". */
  savings: string;
  /** Pre-formatted poison-free ground, or null if no boundary drawn. */
  area: string | null;
  /** Hardiness zone label, e.g. "Zone 9b". */
  zone: string;
  /** Whether the user has taken the poison-free pledge. */
  pledged: boolean;
}

const SIGNOFF = "— planned with Let's Plant Paradise 🌳";

/**
 * Join message lines, dropping nulls (an absent fact) while keeping empty
 * strings as deliberate paragraph breaks, then tidy the gaps that leaves.
 */
function compose(lines: (string | null)[]): string {
  return lines
    .filter((l): l is string => l !== null)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function myLine(ctx: InviteContext): string {
  const bits: string[] = [];
  if (ctx.trees > 0) bits.push(`${ctx.trees} fruit & nut ${ctx.trees === 1 ? 'tree' : 'trees'}`);
  if (ctx.species > 0) bits.push(`${ctx.species} species`);
  if (ctx.hens > 0) bits.push(`${ctx.hens} hens`);
  if (bits.length === 0) return `I'm laying out a poison-free food forest at ${ctx.placeLabel}.`;
  return `At ${ctx.placeLabel} I've planned ${bits.join(', ')} — no sprays, ever.`;
}

/** "Zone 9b" when we know it, "our climate" when we don't. */
function climatePhrase(ctx: InviteContext): string {
  return ctx.zone === 'Zone unknown' ? 'our climate' : ctx.zone.replace(/^USDA /, '');
}

/**
 * A ready-to-send invitation, warmed up with the user's own numbers. Written
 * to be pasted into a text message, an email or a council submission.
 */
export function inviteMessage(kind: InviteKind, ctx: InviteContext): string {
  const mine = myLine(ctx);
  const climate = climatePhrase(ctx);
  const yieldLine =
    ctx.trees > 0
      ? `Grown out, it should give about ${ctx.harvest} of food a year — roughly ${ctx.savings} of groceries we stop buying.`
      : null;
  const eggLine =
    ctx.hens > 0
      ? `The ${ctx.hens} hens eat the windfall and the food scraps and hand back about ${(
          ctx.hens * EGGS_PER_HEN_PER_YEAR
        ).toLocaleString()} eggs a year.`
      : null;
  const areaLine = ctx.area ? `That's ${ctx.area} kept poison-free.` : null;
  const numbers = [yieldLine, eggLine, areaLine].filter(Boolean).join(' ');
  const pledgeLine = ctx.pledged
    ? "I've taken the poison-free pledge: nothing sprayed, fertility built on site, surplus shared."
    : null;

  switch (kind) {
    case 'neighbor':
      return compose([
        'Hey — a small idea for your yard.',
        '',
        mine,
        numbers || null,
        '',
        'Would you plant one fruit tree this season? One tree in your yard and one in mine, and we can swap what the other has too much of — and neither of us needs to spray anything, because in a mixed planting the birds and the hens eat the pests.',
        "Happy to help you pick a variety that does well here, and to bring you fruit the moment there's a glut.",
        '',
        SIGNOFF,
      ]);

    case 'friend':
      return compose([
        "Something I think you'd actually enjoy.",
        '',
        mine,
        numbers || null,
        '',
        "You've got the space for this. A bare-root fruit tree costs about what a few weeks of store fruit costs, and then it feeds you for thirty years. Three hens turn your food scraps into eggs. No poisons involved anywhere — a mixed planting doesn't need them.",
        `Start with one tree suited to ${climate}. I'll help you choose it, and I'll come and help you dig the hole.`,
        '',
        SIGNOFF,
      ]);

    case 'community':
      return compose([
        'A proposal: plant food, not ornamentals.',
        '',
        'Every year we plant trees in parks, verges and school grounds, and every year we choose species that feed nobody. Fruit and nut trees cost the same, are already in the budget, and turn public planting into public food.',
        '',
        'Three asks:',
        '1. Specify fruit and nut trees in new public planting, with a maintenance plan and a gleaning list so the harvest gets used.',
        '2. Manage that ground without pesticides or herbicides — diverse plantings do not need a spray program.',
        '3. Allow householders a few backyard hens, which cut food waste and household grocery bills at no cost to the town.',
        '',
        mine,
        numbers || null,
        pledgeLine,
        '',
        `I'm glad to help pick species that crop reliably in ${climate}, and to speak to this in person.`,
        '',
        SIGNOFF,
      ]);

    case 'grower':
      return compose([
        'A thank-you, and a request.',
        '',
        "You grow food near me without poisons, and that's the whole reason I buy from you instead of from a supply chain that picks fruit hard and green and ships it for a fortnight. I'm telling my neighbors where you are.",
        '',
        mine,
        `What I'd love from you: bare-root fruit trees and scion wood off stock that already thrives here, and your advice on what actually crops in ${climate}. If you ever run an open day, a grafting workshop or a surplus box, I'll fill it and bring people.`,
        '',
        'Local, self-reliant, poison-free food needs growers like you to stay in business. Tell me what helps.',
        '',
        SIGNOFF,
      ]);
  }
}
