# Product

## Register

brand

## Users

- **Primary: recruiters and hiring managers.** Skimming, often on a deadline. They need to grasp who this developer is, what they can do, and what they've built within about 60 seconds — without motion or gimmicks getting in the way of that read.
- **Prospective clients** evaluating whether this person can build something premium for them. The site itself is the proof of skill.
- **Fellow developers** who will inspect the details — console, source, microcopy — and should be rewarded for it.
- **Tech leads / founders** assessing depth via projects and experience.
- **General curious visitors** who land here from a link.

The job to be done: "show me who this person is, what they can do, and what they've done" — informational, not transactional. This site does not sell services; it demonstrates them by existing.

## Product Purpose

A personal portfolio for a software developer. Sections: Hero, About Me, AI Chatbot (RAG over the owner's documents, presented as a terminal conversation beside an interactive 3D robot companion), Projects, Experiences, Tech Stack, and a footer with contact details.

Success looks like: a recruiter leaves with a clear picture of capability; a developer leaves impressed by craft; nobody leaves thinking "AI made this." The centerpiece interactions (3D robot that tracks the cursor, terminal chat, interactive particle background) must feel effortful and intentional, not bolted on.

## Brand Personality

Three words: **deadpan · crafted · terminal-native**.

The voice is quirky developer humour delivered dry. The surface stays premium and composed; the jokes live one layer down — console easter eggs, hover microcopy, terminal commands (`sudo hire-me`), commit-message-flavored copy. Humour is discoverable, never shouted. Rewards attention.

Emotional goals: for recruiters, quiet confidence ("this person ships polished work"); for developers, delight in the details ("wait, did they really…?").

## Anti-references

- **Neon purple/blue gradient "AI startup" aesthetics.** No gradient text, no glassmorphism-by-default, no glowing purple orbs.
- **Generic SaaS landing templates**: hero-metric blocks, identical card grids, uppercase tracked eyebrows above every section.
- **Template portfolio sites** (the typical Next.js portfolio starter look: avatar, three project cards, skill badges).
- **Cream/beige editorial-magazine aesthetics** — wrong register for a terminal-native brand.
- **Hacker-movie kitsch**: matrix rain, green-on-black everywhere, "1337" cosplay. Terminal-native means lived-in developer tooling, not Hollywood hacking.

## Design Principles

1. **The site is the résumé.** Every interaction is a demonstration of skill. If a detail isn't crafted, it's evidence against the owner.
2. **Deadpan surface, discoverable depth.** Premium and composed at first glance; wit and easter eggs for those who look closer. Never let a joke cost clarity.
3. **The terminal is home, not costume.** Terminal/CLI metaphors are used because the owner lives in them — they must behave like real tooling (real prompt semantics, real keyboard support), not decoration.
4. **Motion serves the read.** Lenis smoothness, cursor-tracking 3D, and particle fields set atmosphere but never block or delay the information a skimming recruiter needs. Reduced-motion visitors get a first-class static experience.
5. **One world, extrapolated.** The chatbot section (robot + terminal + interactive background) defines the visual physics; every other section inherits from it rather than inventing its own.

## Accessibility & Inclusion

- WCAG AA contrast throughout (≥4.5:1 body text on the dark canvas).
- `prefers-reduced-motion` alternatives for everything: Lenis disabled, particle field static or removed, robot idle instead of cursor-tracking, crossfades instead of reveals.
- Full keyboard navigation, including the terminal chat (focus management, visible focus states).
- Semantic HTML; the 3D/canvas layers are decorative and hidden from assistive tech; chat transcript exposed as an accessible log.
