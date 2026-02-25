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
  const { name, description, vertical } = body;

  if (!name) {
    return NextResponse.json({ error: 'Idea name is required.' }, { status: 400 });
  }

  // Fetch archetypes for classification
  const { data: archetypes } = await supabase
    .from('archetypes')
    .select('id, name');
  const archetypeList = (archetypes || []).map(a => a.name);
  const archetypeIdMap: Record<string, string> = {};
  (archetypes || []).forEach(a => { archetypeIdMap[a.name] = a.id; });

  const systemPrompt = `You are a startup evaluation expert. You will evaluate a startup idea across multiple criteria and classify it into an archetype.

AVAILABLE ARCHETYPES (choose the single best fit):
${archetypeList.join(', ')}

SCORING CRITERIA:

1. TAM (Total Addressable Market):
   Return a dollar estimate in BILLIONS as a number.
   Examples: 5 means $5B, 50 means $50B, 0.8 means $800M, 0.3 means $300M.
   Be realistic — research the actual market size.

2. Existing Competition:
   Return one of: "Low", "Medium", "High"
   - Low: Few or no direct competitors, significant white space, blue ocean
   - Medium: Several competitors but clear differentiation possible
   - High: Extremely crowded, many well-funded competitors

3. Problem Severity (1-10, how painful is the problem):
   - 1-3: Nice-to-have, low urgency
   - 4-5: Moderate pain point
   - 6-7: Significant pain, clear demand
   - 8-10: Hair-on-fire problem, desperate for solution

4. Market-Founder Fit (1-10, for a team with CV/AI, healthcare ops, and data infra expertise):
   - 1-3: No relevant expertise or network
   - 4-5: Some transferable skills
   - 6-7: Good overlap in skills
   - 8-10: Strong domain expertise and unique advantage

5. Execution Difficulty (1-10, where 1 = very easy, 10 = very hard):
   - 1-3: Can build MVP in weeks, fast iteration, minimal regulation
   - 4-5: Manageable challenges, clear execution path
   - 6-7: Significant technical and go-to-market challenges
   - 8-10: Requires massive capital, heavy regulation, or deep tech breakthroughs

6. Time to $100M ARR:
   Return an estimate in MONTHS as a number.
   Examples: 36 means 3 years, 60 means 5 years, 120 means 10 years.
   Consider the go-to-market motion, sales cycle, and market dynamics.

7. 2nd Buyer for Data:
   Identify who else would pay for the data/insights this startup generates beyond the primary customer.
   Return the name of the potential second buyer AND a score (1-10):
   - 1-3: No clear second buyer for the data
   - 4-5: Weak secondary use case
   - 6-7: Plausible second buyer
   - 8-10: Strong, obvious second buyer with high willingness to pay

8. Passion (1-10, how exciting/passionate would a founding team be about this):
   - 1-3: Feels like a grind, low excitement
   - 4-5: Moderate interest
   - 6-7: Genuinely interested
   - 8-10: Deeply passionate, can't stop thinking about it

Return ONLY a JSON object with these exact fields:
{
  "archetype": "<exact name from the archetype list above>",
  "tam_estimate_billions": <number>,
  "tam_reasoning": "<1-2 sentence explanation>",
  "competition_level": "<Low|Medium|High>",
  "competition_reasoning": "<1-2 sentence explanation>",
  "problem_severity_score": <1-10>,
  "problem_severity_reasoning": "<1-2 sentence explanation>",
  "market_founder_fit_score": <1-10>,
  "market_founder_fit_reasoning": "<1-2 sentence explanation>",
  "execution_difficulty_score": <1-10>,
  "execution_difficulty_reasoning": "<1-2 sentence explanation>",
  "time_to_100m_arr_months": <number>,
  "time_to_100m_arr_reasoning": "<1-2 sentence explanation>",
  "second_buyer_name": "<name of the potential second buyer>",
  "second_buyer_score": <1-10>,
  "second_buyer_reasoning": "<1-2 sentence explanation>",
  "passion_score": <1-10>,
  "passion_reasoning": "<1-2 sentence explanation>"
}

No markdown, no extra text, just the JSON object.`;

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
        max_tokens: 2500,
        messages: [
          {
            role: 'user',
            content: `Score this startup idea:\n\nName: ${name}\nDescription: ${description || 'N/A'}\nVertical: ${vertical || 'N/A'}`,
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
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const scores = JSON.parse(cleaned);

      // Look up archetype ID
      const archetypeId = archetypeIdMap[scores.archetype] || null;

      // Compute total_score from numeric scores
      // total = problem_severity + mf_fit + (11 - exec_difficulty) + second_buyer + passion
      const total = (scores.problem_severity_score || 0) +
        (scores.market_founder_fit_score || 0) +
        (11 - (scores.execution_difficulty_score || 6)) +
        (scores.second_buyer_score || 0) +
        (scores.passion_score || 0);

      // Extract reasoning into a separate object
      const reasoning = {
        tam: scores.tam_reasoning || '',
        competition: scores.competition_reasoning || '',
        problem_severity: scores.problem_severity_reasoning || '',
        market_founder_fit: scores.market_founder_fit_reasoning || '',
        execution_difficulty: scores.execution_difficulty_reasoning || '',
        time_to_100m_arr: scores.time_to_100m_arr_reasoning || '',
        second_buyer: scores.second_buyer_reasoning || '',
        passion: scores.passion_reasoning || '',
      };

      return NextResponse.json({
        archetype_id: archetypeId,
        tam_estimate_billions: scores.tam_estimate_billions,
        competition_level: scores.competition_level,
        problem_severity_score: scores.problem_severity_score,
        market_founder_fit_score: scores.market_founder_fit_score,
        execution_difficulty_score: scores.execution_difficulty_score,
        time_to_100m_arr_months: scores.time_to_100m_arr_months,
        second_buyer_name: scores.second_buyer_name,
        second_buyer_score: scores.second_buyer_score,
        passion_score: scores.passion_score,
        total_score: total,
        reasoning,
      });
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI scoring response', raw: text }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: `Failed to call Anthropic API: ${error}` }, { status: 500 });
  }
}
