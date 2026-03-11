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
  const { custom_prompt } = body;

  // Fetch existing ideas for deduplication
  const { data: existingIdeas } = await supabase
    .from('sound_ai_ideas')
    .select('name, one_liner, category');

  const existingList = (existingIdeas || [])
    .map(i => `- ${i.name}: ${i.one_liner || ''}`)
    .join('\n');

  const deduplicationBlock = existingList
    ? `\n\nEXISTING IDEAS ALREADY SAVED (do NOT duplicate or generate minor variations of these):\n${existingList}\n`
    : '';

  const systemPrompt = `You are a world-class AI startup strategist specializing in generative audio and sound AI. Your job is to brainstorm specific, actionable product ideas within the AI audio space. Each idea should be specific enough to build (not vague like "AI for music") and should include a clear customer, a clear pain point, and a clear product.

Consider these dimensions of the AI audio space:
- Film/TV scoring and soundtrack generation
- Game audio (adaptive, procedural, dynamic soundtracks)
- Commercial venue music (restaurants, hotels, retail, gyms)
- Podcast and YouTube creator tools
- Advertising and jingle creation
- Music production and DAW integration
- Sound effects and foley generation
- Voice synthesis and vocal generation
- Spatial and immersive audio (AR/VR/3D)
- Music education and training tools
- Audio restoration and enhancement
- Accessibility (audio descriptions, sonification)
- Live performance and DJ tools
- Ringtones, hold music, notification sounds
- Meditation, sleep, wellness audio
- Audio branding and sonic identities

For each idea, consider:
- Who is the specific customer (not "filmmakers" but "indie filmmakers with budgets under $5M who can't afford professional scoring")
- What is the specific pain point
- What would the product actually do
- How would it make money
- Who are the closest competitors
- What makes this defensible

TEAM CONTEXT for scoring team_fit: The team has a business CEO from finance/PE, an audio-focused CPO, an audio engineer CTO, and 2 Stanford ML engineers.
${deduplicationBlock}
Return your ideas as a JSON array with this structure:
[{
  "name": "string",
  "one_liner": "string (max 140 chars)",
  "category": "string (one of: Film & TV Scoring, Game Audio, Commercial/Venue Music, Podcast & YouTube, Advertising & Marketing, Music Production Tools, Sound Effects & Foley, Voice & Vocal, Spatial/Immersive Audio, Education & Training, Other)",
  "target_customer": "string",
  "how_it_works": "string (2-3 sentences)",
  "revenue_model": "string (one of: SaaS Subscription, Per-Generation / Usage-Based, Marketplace (take rate), API Licensing, Enterprise Contracts, Freemium + Upsell, Hardware + Software Bundle)",
  "competitors": "string",
  "differentiation": "string",
  "suggested_scores": {
    "tam": number 1-10,
    "pain": number 1-10,
    "feasibility": number 1-10,
    "moat": number 1-10,
    "team_fit": number 1-10,
    "time_to_revenue": number 1-10,
    "passion": number 1-10
  }
}]

Generate 5 ideas per request. Make them diverse across categories. Be specific and opinionated about scores. Do not be generic.

SCORING GUIDE:
- TAM: 1-3 (<$500M), 4-6 ($500M-$5B), 7-9 ($5B-$50B), 10 ($50B+)
- Pain: 1-3 (nice to have), 4-6 (significant, workarounds exist), 7-9 (acute, poor alternatives), 10 (hair on fire)
- Feasibility: 1-3 (requires breakthroughs), 4-6 (hard but achievable), 7-9 (buildable with existing models), 10 (prototype in weeks)
- Moat: 1-3 (direct competition with funded incumbents), 4-6 (adjacent but differentiated), 7-9 (clear whitespace), 10 (structural moat)
- Team Fit: 1-3 (need extensive hiring), 4-6 (can start but gaps), 7-9 (strong fit), 10 (perfect team)
- Time to Revenue: 1-3 (2+ years), 4-6 (6-12 months), 7-9 (3-6 months), 10 (<3 months)
- Passion: 1-3 (business opportunity only), 4-6 (interested), 7-9 (very excited), 10 (would do for free)

Return ONLY the JSON array. No markdown, no code fences, no explanation.`;

  const userMessage = custom_prompt
    ? `Generate 5 AI audio/sound startup ideas focused on: ${custom_prompt}`
    : 'Generate 5 diverse AI audio/sound startup ideas across different categories and market segments.';

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
        messages: [{ role: 'user', content: userMessage }],
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
      const ideas = JSON.parse(cleaned);
      return NextResponse.json({ ideas });
    } catch {
      return NextResponse.json({ ideas: [], raw: text });
    }
  } catch (error) {
    return NextResponse.json({ error: `Failed to call Anthropic API: ${error}` }, { status: 500 });
  }
}
