import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Anthropic API key not configured.' }, { status: 500 });
  }

  const body = await request.json();
  const { name, one_liner, category, target_customer, how_it_works, revenue_model } = body;

  if (!name) {
    return NextResponse.json({ error: 'Idea name is required.' }, { status: 400 });
  }

  // Fetch existing ideas for context
  const { data: existingIdeas } = await supabase
    .from('sound_ai_ideas')
    .select('name, one_liner, category');

  const existingList = (existingIdeas || [])
    .map(i => `- ${i.name}: ${i.one_liner || ''}`)
    .join('\n');

  const contextBlock = existingList
    ? `\n\nEXISTING IDEAS IN PORTFOLIO (for context on differentiation):\n${existingList}\n`
    : '';

  const systemPrompt = `You are a world-class AI startup strategist specializing in generative audio and sound AI. You will evaluate a startup idea across 7 scoring dimensions.

TEAM CONTEXT: The team has a business CEO from finance/PE, an audio-focused CPO, an audio engineer CTO, and 2 Stanford ML engineers.
${contextBlock}
SCORING CRITERIA:

1. TAM (Total Addressable Market) — 1-10:
   - 1-3: Niche market (<$500M)
   - 4-6: Sizable market ($500M-$5B)
   - 7-9: Large market ($5B-$50B)
   - 10: Massive market ($50B+)

2. Pain Severity — 1-10:
   - 1-3: Nice to have, low urgency
   - 4-6: Significant pain point, but workarounds exist
   - 7-9: Acute pain, poor alternatives available
   - 10: Hair-on-fire problem

3. Technical Feasibility — 1-10:
   - 1-3: Requires fundamental breakthroughs in AI/ML
   - 4-6: Hard but achievable with significant R&D
   - 7-9: Buildable with existing models and techniques
   - 10: Could prototype in weeks

4. Competitive Moat — 1-10:
   - 1-3: Direct competition with well-funded incumbents (Suno, ElevenLabs)
   - 4-6: Adjacent space, differentiation possible
   - 7-9: Clear whitespace, no direct competitor
   - 10: Structural moat (data, network effects, regulatory)

5. Team Fit — 1-10:
   - 1-3: Need extensive hiring to even start
   - 4-6: Can start but significant skill gaps
   - 7-9: Strong fit, team has relevant expertise
   - 10: Perfect team for this specific problem

6. Time to Revenue — 1-10:
   - 1-3: 2+ years to first dollar
   - 4-6: 6-12 months to first dollar
   - 7-9: 3-6 months to first dollar
   - 10: Revenue possible in <3 months

7. Passion — 1-10:
   - 1-3: Pure business opportunity, no intrinsic motivation
   - 4-6: Interested but not obsessed
   - 7-9: Very excited, deeply motivated
   - 10: Would work on this for free

For each score, provide a 1-2 sentence reasoning explaining WHY you gave that specific score.

Return ONLY a JSON object with this exact structure:
{
  "tam": { "score": <1-10>, "reasoning": "<1-2 sentences>" },
  "pain": { "score": <1-10>, "reasoning": "<1-2 sentences>" },
  "feasibility": { "score": <1-10>, "reasoning": "<1-2 sentences>" },
  "moat": { "score": <1-10>, "reasoning": "<1-2 sentences>" },
  "team_fit": { "score": <1-10>, "reasoning": "<1-2 sentences>" },
  "time_to_revenue": { "score": <1-10>, "reasoning": "<1-2 sentences>" },
  "passion": { "score": <1-10>, "reasoning": "<1-2 sentences>" }
}

Be specific and opinionated. Do not give everything a 5-7. Differentiate clearly between ideas. No markdown, no code fences, just the JSON object.`;

  const ideaDescription = [
    `Name: ${name}`,
    one_liner ? `One-liner: ${one_liner}` : null,
    category ? `Category: ${category}` : null,
    target_customer ? `Target Customer: ${target_customer}` : null,
    how_it_works ? `How It Works: ${how_it_works}` : null,
    revenue_model ? `Revenue Model: ${revenue_model}` : null,
  ].filter(Boolean).join('\n');

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
        messages: [{ role: 'user', content: `Score this AI audio/sound startup idea:\n\n${ideaDescription}` }],
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
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const scores = JSON.parse(cleaned);

      return NextResponse.json({
        scores: {
          tam_score: scores.tam?.score,
          pain_score: scores.pain?.score,
          feasibility_score: scores.feasibility?.score,
          moat_score: scores.moat?.score,
          team_fit_score: scores.team_fit?.score,
          time_to_revenue_score: scores.time_to_revenue?.score,
          passion_score: scores.passion?.score,
        },
        reasoning: {
          tam_score: scores.tam?.reasoning || '',
          pain_score: scores.pain?.reasoning || '',
          feasibility_score: scores.feasibility?.reasoning || '',
          moat_score: scores.moat?.reasoning || '',
          team_fit_score: scores.team_fit?.reasoning || '',
          time_to_revenue_score: scores.time_to_revenue?.reasoning || '',
          passion_score: scores.passion?.reasoning || '',
        },
      });
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI scoring response', raw: text }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: `Failed to call Anthropic API: ${error}` }, { status: 500 });
  }
}
