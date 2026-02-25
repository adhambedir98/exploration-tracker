import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Anthropic API key not configured. Add ANTHROPIC_API_KEY to your environment variables.' }, { status: 500 });
  }

  const body = await request.json();
  const { prompt, archetype, context } = body;

  const systemPrompt = `You are an AI startup idea generator for Caddy, a startup building computer vision analytics for surgical operating rooms.

Caddy's core thesis: CV on existing OR cameras to track surgical workflow, detect delays, and optimize turnover. The team is exploring adjacent and related startup ideas.

Key context about Caddy's position:
- Core archetype: CV/Sensors for Physical Operations
- White space: Almost no healthcare AI startups touch surgical operations
- Second revenue stream potential: surgical motion data for robotics companies
- Target buyers: PE-backed ASC (Ambulatory Surgery Center) operators

When generating ideas, consider:
1. Adjacencies to OR camera analytics
2. Healthcare operations inefficiencies
3. Data moats from physical-world sensors
4. Opportunities where existing infrastructure + AI = new intelligence layer
5. Markets with high willingness to pay and clear ROI

${archetype ? `Focus area archetype: ${archetype}` : ''}
${context ? `Additional context: ${context}` : ''}

Generate 3 startup ideas. For each idea, provide:
- name: A concise startup name
- description: 2-3 sentence description
- archetype: Which archetype category it fits
- why_exciting: Why this is worth exploring
- risk: Key risk or challenge

Return ONLY a JSON array with these fields. No markdown, no explanation outside the JSON.`;

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
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt || 'Generate 3 startup ideas adjacent to surgical OR analytics that leverage computer vision, sensor data, or healthcare operations intelligence.',
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

    // Try to parse as JSON
    try {
      const ideas = JSON.parse(text);
      return NextResponse.json({ ideas });
    } catch {
      // If not valid JSON, return raw text
      return NextResponse.json({ ideas: [], raw: text });
    }
  } catch (error) {
    return NextResponse.json({ error: `Failed to call Anthropic API: ${error}` }, { status: 500 });
  }
}
