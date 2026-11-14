import OpenAI from 'openai';

export interface ExtractedActionItem {
  title: string;
  assigneeName: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface MeetingIntelligenceResult {
  summary: string;
  actionItems: ExtractedActionItem[];
  source: 'openai' | 'fallback';
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Generates a structured meeting summary and extracts actionable tasks with assignees.
 * Gracefully falls back to deterministic NLP extraction when OPENAI_API_KEY is missing or quota is exceeded.
 */
export async function generateMeetingIntelligence(
  transcript: string,
  format: 'brief' | 'standard' | 'detailed' = 'standard'
): Promise<MeetingIntelligenceResult> {
  if (openai) {
    try {
      const formatInstructions =
        format === 'brief'
          ? 'Provide a concise, high-impact 2-3 sentence executive briefing summarizing the main decision.'
          : format === 'detailed'
          ? 'Provide an in-depth breakdown including: ## Executive Summary, ## Key Discussion Topics, ## Decisions Made, and ## Risks & Blockers.'
          : 'Provide an Executive Summary and bulleted Key Discussion Points.';

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are IntellMeet AI. ${formatInstructions} Return valid JSON with keys: "summary" (markdown string) and "actionItems" (array of { "title": string, "assigneeName": string, "priority": "LOW" | "MEDIUM" | "HIGH" }).`,
          },
          {
            role: 'user',
            content: transcript,
          },
        ],
      });

      const raw = response.choices[0]?.message?.content;
      if (raw) {
        const parsed = JSON.parse(raw) as {
          summary?: string;
          actionItems?: Array<{
            title?: string;
            assigneeName?: string;
            priority?: string;
          }>;
        };

        const actionItems: ExtractedActionItem[] = (parsed.actionItems || [])
          .filter((item) => item.title && item.title.trim().length > 0)
          .map((item) => ({
            title: item.title!.trim(),
            assigneeName: item.assigneeName?.trim() || 'Unassigned',
            priority:
              item.priority === 'HIGH' || item.priority === 'LOW'
                ? item.priority
                : 'MEDIUM',
          }));

        if (parsed.summary) {
          return {
            summary: parsed.summary,
            actionItems,
            source: 'openai',
          };
        }
      }
    } catch (err) {
      console.warn('OpenAI summarization fallback triggered:', (err as Error).message);
    }
  }

  return buildFallbackIntelligence(transcript, format);
}

function buildFallbackIntelligence(
  transcript: string,
  format: 'brief' | 'standard' | 'detailed' = 'standard'
): MeetingIntelligenceResult {
  const sentences = transcript
    .split(/[\n.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);

  const actionKeywords = /\b(will|need to|should|must|todo|action|follow up|finalize|prepare|review|create|deploy|fix|send)\b/i;

  const extracted: ExtractedActionItem[] = sentences
    .filter((s) => actionKeywords.test(s))
    .slice(0, 5)
    .map((s) => {
      const speakerMatch = s.match(/^([A-Z][a-zA-Z ]{1,25}):\s*(.+)$/);
      const assigneeName = speakerMatch ? speakerMatch[1].trim() : 'Team Member';
      const cleanTitle = (speakerMatch ? speakerMatch[2] : s).slice(0, 120);
      const priority: 'HIGH' | 'MEDIUM' = /\b(urgent|asap|friday|critical|immediately)\b/i.test(s)
        ? 'HIGH'
        : 'MEDIUM';

      return {
        title: cleanTitle,
        assigneeName,
        priority,
      };
    });

  let summary: string;

  if (format === 'brief') {
    const mainTakeaways = sentences.slice(0, 2).join('. ');
    summary = `**Executive Briefing**: ${mainTakeaways || 'Meeting held to align on key deliverables.'}.`;
  } else if (format === 'detailed') {
    const keyPoints = sentences.slice(0, 4).map((s) => `- ${s}`).join('\n');
    summary = `## Executive Summary\n${sentences[0] || 'Meeting convened to align on deliverables and cross-team execution.'}\n\n## Key Discussion Points\n${keyPoints || '- Aligned on core architecture and timelines'}\n\n## Decisions Made\n- Approved action items and roadmap allocations\n- Confirmed responsibilities and verified post-call tasks`;
  } else {
    const keyPoints = sentences.slice(0, 3).map((s) => `- ${s}`).join('\n');
    summary = `## Executive Summary\n${sentences[0] || 'Team alignment meeting completed.'}\n\n## Key Discussion Points\n${keyPoints || '- Aligned on core deliverables.'}`;
  }

  return {
    summary,
    actionItems: extracted.length > 0 ? extracted : [
      {
        title: 'Review meeting minutes and follow up with team',
        assigneeName: 'Meeting Host',
        priority: 'MEDIUM',
      },
    ],
    source: 'fallback',
  };
}
