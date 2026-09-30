// Safety Officer: plain rules, no model. It runs before anyone suggests a fix.

const INTAKE_RULES = [
  { id: 'gas', re: /\b(smell(s|ing)? (of )?gas|gas leak|rotten eggs?)\b/i,
    msg: 'Possible gas leak. Leave now, don\'t flip any switches, and call your gas utility\'s emergency line from outside.' },
  { id: 'co', re: /\b(carbon monoxide|co (alarm|detector))\b/i,
    msg: 'Get everyone into fresh air now and call emergency services.' },
  { id: 'fire', re: /\b(smok(e|ing)|burning smell|smells? (like )?burn(ing|t)|sparks?|sparking|scorch(ed)?|melt(ed|ing))\b/i,
    msg: 'Fire risk. Unplug it only if that is safe, keep it away from anything flammable, and don\'t use it again until it has been inspected.' },
  { id: 'battery', re: /\b(swell(ing|ed|s)?|bulg(ing|ed|es)?|puff(y|ed|ing))\b.{0,30}\bbatter(y|ies)\b|\bbatter(y|ies)\b.{0,30}\b(swell|bulg|puff)/i,
    msg: 'A swollen lithium battery can catch fire. Stop charging it, power it off, and put it on a non-flammable surface. Don\'t press, puncture or remove it yourself.' },
  { id: 'vehicle', re: /\b(brakes?|steering|airbags?|stuck accelerator|unintended acceleration|loss of power on the (highway|freeway|motorway))\b/i,
    msg: 'Safety-critical vehicle problem. Stop driving it and get it towed or inspected. Recall repairs are free at the dealer.' },
  { id: 'shock', re: /\b(shock(ed)? me|electrocut\w*|exposed wir(e|es|ing)|tingl(e|ing) when i touch)\b/i,
    msg: 'Electrical hazard. Switch it off at the breaker and don\'t touch it.' },
];

const PRO_ONLY_FIX = /\b(mains|high[- ]voltage|capacitor|bypass(ing)?|jump(er)? (the )?(fuse|thermal|sensor)|thermal fuse|gas (valve|line)|brake (line|fluid|caliper)|airbag|refrigerant|recharg\w* (the )?freon|puncture|pry\w* (out )?(the )?battery|open(ing)? (the )?(power supply|psu|microwave|battery)|remove the battery|disable (the )?(safety|interlock)|rewir\w*)\b/i;

export function scanIntake(text) {
  return INTAKE_RULES.filter((r) => r.re.test(String(text ?? ''))).map(({ id, msg }) => ({ id, msg }));
}

// Lock fixes that nobody should DIY. With a live hazard, every hands-on fix is locked.
export function lockFixes(fixes, hazards = []) {
  const locked = [];
  for (const f of fixes ?? []) {
    const text = [f.title, ...(f.steps ?? [])].join(' ');
    const reason = hazards.length
      ? `A hazard was reported (${hazards.map((h) => h.id).join(', ')}), so no DIY fixes. Get it inspected.`
      : PRO_ONLY_FIX.test(text) ? 'This involves a safety-critical part. It\'s a job for a qualified technician, and DIY can also void your warranty.' : null;
    if (!['safe', 'moderate', 'pro_only'].includes(f.risk)) f.risk = 'moderate';
    if (reason) {
      f.locked = true;
      f.risk = 'pro_only';
      f.safety_note = reason;
      f.hidden_steps = f.steps?.length ?? 0;
      f.steps = [];
      locked.push(f.title);
    }
  }
  return locked;
}
