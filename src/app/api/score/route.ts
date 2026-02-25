import { NextRequest, NextResponse } from 'next/server';

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

  const systemPrompt = `You are a startup evaluation expert. You will score a startup idea on 5 criteria, each on a scale of 1-10. For each score, provide a brief 1-2 sentence reasoning explaining WHY you gave that score.

SCORING CRITERIA:

1. TAM (Total Addressable Market):
- 1-3: Under $500M market
- 4-5: $500M - $1B market
- 6-7: $1B - $10B market
- 8-9: $10B - $100B market
- 10: $100B+ market

2. Existing Competition (higher = LESS competition, more white space):
- 1-3: Extremely crowded, many well-funded competitors
- 4-5: Several competitors, some differentiation possible
- 6-7: Moderate competition, clear differentiation path
- 8-9: Few direct competitors, significant white space
- 10: No meaningful competition, blue ocean

3. Problem Severity (how painful is the problem):
- 1-3: Nice-to-have, low urgency
- 4-5: Moderate pain point, some urgency
- 6-7: Significant pain, clear demand
- 8-9: Critical problem, strong urgency
- 10: Hair-on-fire problem, desperate for solution

4. Market-Founder Fit (for a team with CV/AI, healthcare ops, and data infra expertise):
- 1-3: No relevant expertise or network
- 4-5: Some transferable skills
- 6-7: Good overlap in skills
- 8-9: Strong domain expertise and network
- 10: Perfect fit, unique advantage

5. Execution Difficulty (higher = EASIER to execute):
- 1-3: Requires massive capital, regulation, or deep tech breakthroughs
- 4-5: Significant technical and go-to-market challenges
- 6-7: Manageable challenges, clear execution path
- 8-9: Relatively straightforward with right team
- 10: Can build MVP in weeks, fast iteration

Return ONLY a JSON object with these exact fields:
{
  "tam_score": <number 1-10>,
  "tam_reasoning": "<1-2 sentence explanation>",
  "competition_score": <number 1-10>,
  "competition_reasoning": "<1-2 sentence explanation>",
  "problem_severity_score": <number 1-10>,
  "problem_severity_reasoning": "<1-2 sentence explanation>",
  "market_founder_fit_score": <number 1-10>,
  "market_founder_fit_reasoning": "<1-2 sentence explanation>",
  "execution_difficulty_score": <number 1-10>,
  "execution_difficulty_reasoning": "<1-2 sentence explanation>"
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
        max_tokens: 1500,
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
      const total = (scores.tam_score || 0) + (scores.competition_score || 0) +
        (scores.problem_severity_score || 0) + (scores.market_founder_fit_score || 0) +
        (scores.execution_difficulty_score || 0);

      // Extract reasoning into a separate object
      const reasoning = {
        tam: scores.tam_reasoning || '',
        competition: scores.competition_reasoning || '',
        problem_severity: scores.problem_severity_reasoning || '',
        market_founder_fit: scores.market_founder_fit_reasoning || '',
        execution_difficulty: scores.execution_difficulty_reasoning || '',
      };

      return NextResponse.json({
        tam_score: scores.tam_score,
        competition_score: scores.competition_score,
        problem_severity_score: scores.problem_severity_score,
        market_founder_fit_score: scores.market_founder_fit_score,
        execution_difficulty_score: scores.execution_difficulty_score,
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
