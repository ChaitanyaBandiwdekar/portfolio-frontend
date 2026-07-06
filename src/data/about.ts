export const about = {
  paragraphs: [
    "I build systems, end to end. Frontend, backend, whatever infrastructure sits underneath. Ideally nobody ever has to think about the stuff I build. That's usually the goal.",
    "Lately I've been deep into agents. Not chatbots, actual systems that can retrieve information, reason through it, and act on their own. There's a lot of unglamorous work that goes into making that actually reliable.",
    "Same curiosity either way - I've just always liked knowing what's actually happening underneath, not just that something works.",
  ],
  // right-hand mono "process facts" — deadpan system readout
  facts: [
    { key: 'uptime', value: 'X years in software' }, // TODO(owner)
    { key: 'current_obsession', value: 'something specific' }, // TODO(owner)
    { key: 'editor', value: 'your editor of choice' }, // TODO(owner)
    { key: 'tabs_vs_spaces', value: 'resolved at the formatter level' },
    { key: 'date_format', value: 'DD/MM/YYYY (fight me)' },
  ],
} as const
