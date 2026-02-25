import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Anthropic API key not configured. Add ANTHROPIC_API_KEY to your environment variables.' }, { status: 500 });
  }

  const body = await request.json();
  const { verticals, archetypes } = body;

  const verticalsStr = verticals?.length ? verticals.join(', ') : 'any industry vertical';
  const archetypesStr = archetypes?.length ? archetypes.join(', ') : 'any startup archetype';

  const systemPrompt = `You are an AI startup idea generator for Caddy, a startup building computer vision analytics for surgical operating rooms.

Caddy's core thesis: CV on existing OR cameras to track surgical workflow, detect delays, and optimize turnover. The team is exploring adjacent and related startup ideas.

Key context about Caddy's position:
- Core archetype: CV/Sensors for Physical Operations
- White space: Almost no healthcare AI startups touch surgical operations
- Second revenue stream potential: surgical motion data for robotics companies
- Target buyers: PE-backed ASC (Ambulatory Surgery Center) operators
- The team has deep expertise in computer vision, healthcare operations, and data infrastructure

When generating ideas, consider:
1. Real problems in the selected verticals that startups could solve
2. How the selected archetype patterns could be applied
3. Data moats and defensibility
4. Clear buyer persona and willingness to pay
5. Realistic paths to revenue

Generate exactly 10 unique, creative, and specific startup ideas that sit at the intersection of the provided verticals and archetypes. Each idea should be distinct and actionable.

For each idea, provide:
- name: A concise, memorable startup name (2-3 words max)
- description: 2-3 sentence description of what the company does
- vertical: Which vertical it targets
- archetype: Which archetype pattern it follows

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
            content: `Generate 10 startup ideas at the intersection of these verticals: [${verticalsStr}] and these archetypes: [${archetypesStr}].`,
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
