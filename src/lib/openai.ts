import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('Missing OpenAI API key');
}

const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true // Note: In production, calls should go through a backend
});

const DEFAULT_CALLER_PROMPT = `You are a health insurance caller contacting customer service. 
Generate and maintain a consistent caller persona with:
- Random demographic details
- Specific insurance-related concern
- Varying emotional states (frustrated, calm, confused, etc.)
- Realistic background context

Maintain this persona throughout the conversation.`;

export const generateResponse = async (
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  customScenario?: string
): Promise<string> => {
  const systemPrompt = customScenario || DEFAULT_CALLER_PROMPT;

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: "user", content: userMessage }
  ] as const;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages,
    temperature: 0.7,
    max_tokens: 150
  });

  return response.choices[0].message.content || "I'm sorry, could you repeat that?";
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');

  const response = await openai.audio.transcriptions.create({
    file: audioBlob,
    model: 'whisper-1',
  });

  return response.text;
};

export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy',
    input: text,
  });

  const arrayBuffer = await response.arrayBuffer();
  return arrayBuffer;
};

export const generateFeedback = async (
  transcript: { role: string; content: string }[],
  customScenario?: string
): Promise<{ scores: Record<string, number>; comments: string }> => {
  const systemPrompt = `You are an expert call center trainer evaluating a customer service call.
${customScenario ? `Context: ${customScenario}` : ''}

Analyze the conversation and provide:
1. Numerical scores (1-5) for:
   - clarity: Clear communication
   - problemSolving: Issue resolution
   - empathy: Understanding customer needs
   - control: Call management
   - speed: Efficiency
2. Constructive feedback comments

Format response as JSON:
{
  "scores": {
    "clarity": number,
    "problemSolving": number,
    "empathy": number,
    "control": number,
    "speed": number
  },
  "comments": "string"
}`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...transcript.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  ] as const;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages,
    temperature: 0.7,
    response_format: { type: "json_object" }
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  
  // Ensure all score categories exist and are within 1-5 range
  const scores = {
    clarity: Math.min(5, Math.max(1, result.scores?.clarity || 3)),
    problemSolving: Math.min(5, Math.max(1, result.scores?.problemSolving || 3)),
    empathy: Math.min(5, Math.max(1, result.scores?.empathy || 3)),
    control: Math.min(5, Math.max(1, result.scores?.control || 3)),
    speed: Math.min(5, Math.max(1, result.scores?.speed || 3))
  };

  return {
    scores,
    comments: result.comments || "No specific feedback provided."
  };
};

export default {
  openai,
  generateResponse,
  transcribeAudio,
  generateSpeech,
  generateFeedback
};