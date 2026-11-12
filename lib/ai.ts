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
  transcript: string
): Promise<MeetingIntelligenceResult> {
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are IntellMeet AI. Analyze the meeting transcript and return valid JSON with keys: "summary" (markdown string with Executive Summary and Key Discussion Points) and "actionItems" (array of { "title": string, "assigneeName": string, "priority": "LOW" | "MEDIUM" | "HIGH" }).',
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

  return buildFallbackIntelligence(transcript);
}

function buildFallbackIntelligence(transcript: string): MeetingIntelligenceResult {
  const sentences = transcript
    .split(/[\n.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);

  const keyPoints = sentences.slice(0, 4).map((s) => `- ${s}`);
  const actionKeywords = /\b(will|need to|should|must|todo|action|follow up|finalize|prepare|review|create|deploy|fix|send)\b/i;

  const extracted: ExtractedActionItem[] = sentences
    .filter((s) => actionKeywords.test(s))
    .slice(0, 4)
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

  if (extracted.length === 0) {
    extracted.push({
      title: 'Review meeting notes and assign follow-up owners',
      assigneeName: 'Team Lead',
      priority: 'MEDIUM',
    });
  }

  const summary = [
    '### Executive Summary (IntellMeet AI)',
    `Processed ${sentences.length || 1} discussion point(s) and extracted ${extracted.length} action item(s).`,
    '',
    '### Key Discussion Points',
    ...(keyPoints.length > 0 ? keyPoints : [`- ${transcript.slice(0, 200)}`]),
  ].join('\n');

  return {
    summary,
    actionItems: extracted,
    source: 'fallback',
  };
}
