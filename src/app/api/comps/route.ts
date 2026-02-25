import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description, vertical } = body;

  if (!name) {
    return NextResponse.json({ error: 'Idea name is required.' }, { status: 400 });
  }

  try {
    // Fetch all reference startups
    const { data: startups } = await supabase
      .from('reference_startups')
      .select('id, company, industry, one_liner, stage, amount_raised, key_investors, score');

    if (!startups || startups.length === 0) {
      return NextResponse.json({ comps: [] });
    }

    // Simple keyword matching: score each startup based on relevance
    const searchTerms = [
      name.toLowerCase(),
      ...(description || '').toLowerCase().split(/\s+/).filter((w: string) => w.length > 3),
      ...(vertical || '').toLowerCase().split(/[\/\s]+/).filter((w: string) => w.length > 2),
    ];

    const scored = startups.map(s => {
      let relevance = 0;
      const text = `${s.company} ${s.industry} ${s.one_liner}`.toLowerCase();

      for (const term of searchTerms) {
        if (text.includes(term)) relevance += 2;
      }

      // Boost if same industry/vertical
      if (vertical && s.industry) {
        const vLower = vertical.toLowerCase();
        const iLower = s.industry.toLowerCase();
        if (iLower.includes(vLower) || vLower.includes(iLower)) relevance += 5;
        // Partial match on industry keywords
        const vWords = vLower.split(/[\/\s]+/).filter((w: string) => w.length > 2);
        const iWords = iLower.split(/[\/\s]+/).filter((w: string) => w.length > 2);
        for (const vw of vWords) {
          for (const iw of iWords) {
            if (vw === iw || vw.includes(iw) || iw.includes(vw)) relevance += 3;
          }
        }
      }

      return { ...s, relevance };
    });

    // Sort by relevance, then return top 10
    scored.sort((a, b) => b.relevance - a.relevance);
    const comps = scored.slice(0, 10).filter(s => s.relevance > 0);

    return NextResponse.json({ comps });
  } catch (error) {
    return NextResponse.json({ error: `Failed to search comps: ${error}` }, { status: 500 });
  }
}
