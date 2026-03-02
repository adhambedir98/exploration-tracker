import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Anthropic API key not configured. Add ANTHROPIC_API_KEY to your environment variables.' }, { status: 500 });
  }

  const body = await request.json();
  const { verticals, archetypes } = body;

  const verticalsStr = verticals?.length ? verticals.join(', ') : 'any industry vertical';
  const archetypesStr = archetypes?.length ? archetypes.join(', ') : 'any startup archetype';

  // Fetch existing ideas so the AI avoids duplicates
  const { data: existingIdeas } = await supabase
    .from('ideas')
    .select('name, description, vertical');

  const existingList = (existingIdeas || [])
    .map(i => `- ${i.name}${i.description ? ': ' + i.description : ''}`)
    .join('\n');

  const deduplicationBlock = existingList
    ? `\n\nEXISTING IDEAS ALREADY IN THE PIPELINE (do NOT generate ideas that overlap with, duplicate, or are minor variations of these):
${existingList}\n`
    : '';

  const systemPrompt = `You are an expert startup idea generator. Your job is to generate genuinely novel, specific, and actionable startup ideas based on the user's selected verticals and archetypes.

CRITICAL INSTRUCTIONS:
- Generate ideas that are DIRECTLY relevant to the selected verticals and archetypes
- Each idea must clearly belong to one of the selected verticals AND follow one of the selected archetype patterns
- Be creative and specific — avoid generic ideas like "AI analytics platform" or "data dashboard"
- Think about real, unsolved problems in the selected verticals
- Consider unique data moats, defensibility, and clear buyer personas
- Each idea should be genuinely distinct from the others — not 10 variations of the same theme
- Do NOT anchor on any single domain, company, or technology — treat each vertical and archetype combination fresh
${deduplicationBlock}
Generate exactly 10 unique startup ideas. For each idea provide:
- name: A concise, memorable startup name (2-3 words max)
- description: 2-3 sentence description of what the company does, who the buyer is, and why it's compelling
- vertical: Which of the selected verticals it targets
- archetype: Which of the selected archetype patterns it follows

Return ONLY a JSON array with these 4 fields per idea. No markdown, no code fences, no explanation outside the JSON array.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `Generate 10 startup ideas at the intersection of these verticals: [${verticalsStr}] and these archetypes: [${archetypesStr}].

Focus on real, unsolved problems in these specific industries. Be creative and avoid obvious or generic ideas.`,
          },
        ],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Anthropic API error: ${response.status} - ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    try {
      // Handle potential markdown code fences
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const ideas = JSON.parse(cleaned);
      return NextResponse.json({ ideas });
    } catch {
      return NextResponse.json({ ideas: [], raw: text });
    }
  } catch (error) {
    return NextResponse.json({ error: `Failed to call Anthropic API: ${error}` }, { status: 500 });
  }
}
