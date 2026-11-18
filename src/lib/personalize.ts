// Resolves {{profile.*}} tokens authored in a CTA Content Fragment against a
// Persona Content Fragment. Authors write the tokens once in AEM; each visitor
// sees their own values. Unknown tokens are left visible so mistakes show up.

import type { PersonaCF } from './cf-delivery';

const TOKEN = /\{\{\s*profile\.(\w+)\s*\}\}/g;

export function resolveTokens(text: string, persona: PersonaCF | undefined): string {
  if (!persona) return text;
  const values: Record<string, string> = {
    name: persona.name,
    interest: persona.interest,
    location: persona.location,
  };
  return text.replace(TOKEN, (match, key: string) => values[key] || match);
}
