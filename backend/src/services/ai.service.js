/**
 * AI Service – Writing & Speaking scoring
 * Primary: Groq (llama-3.3-70b) – free tier, 14400 req/ngày
 * Fallback Mock: trả về band score cố định khi MOCK_AI=true
 */

// ── Mock response ──────────────────────────────────────────────
const MOCK_WRITING_RESPONSE = {
  band: 3.5,
  taskAchievement: 3.5,
  coherence: 3.5,
  lexical: 3.0,
  grammar: 3.5,
  strengths: [
    'Bài viết có cấu trúc rõ ràng với phần mở bài, thân bài và kết bài',
    'Sử dụng một số từ nối cơ bản',
  ],
  improvements: [
    'Cần phát triển ý tưởng chi tiết hơn với ví dụ cụ thể',
    'Từ vựng còn hạn chế, cần đa dạng hóa',
  ],
  suggestions: [
    'Học thêm các linking words: furthermore, nevertheless, in contrast',
    'Luyện viết topic sentences rõ ràng cho mỗi đoạn văn',
  ],
};

const MOCK_SPEAKING_RESPONSE = {
  band: 3.0,
  fluency: 3.0,
  lexical: 3.0,
  grammar: 3.0,
  pronunciation: 3.0,
  strengths: ['Nói được ý tưởng cơ bản', 'Phát âm tương đối rõ ràng'],
  improvements: ['Cần nói lưu loát hơn, giảm ngắt quãng', 'Từ vựng cần phong phú hơn'],
  suggestions: ['Luyện nói 5 phút mỗi ngày về các chủ đề quen thuộc', 'Nghe podcast tiếng Anh để cải thiện rhythm'],
};

// ── Groq API call ──────────────────────────────────────────────
const callGroq = async (systemPrompt, userMessage) => {
  const Groq = require('groq-sdk');
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  });

  return completion.choices[0]?.message?.content || '';
};

// ── Parse JSON từ AI response ──────────────────────────────────
const parseAIJsonResponse = (rawText) => {
  try {
    // Tìm JSON block trong response
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) ||
                      rawText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawText;
    return JSON.parse(jsonStr.trim());
  } catch (e) {
    console.error('❌ Parse AI JSON failed:', e.message);
    console.error('Raw response:', rawText?.slice(0, 300));
    throw new Error('AI trả về định dạng không hợp lệ');
  }
};

// ── Main export ────────────────────────────────────────────────
/**
 * Gọi AI để chấm điểm (Groq hoặc Mock tùy MOCK_AI env)
 */
const callGemini = async (systemPrompt, userMessage) => {
  const useMock = process.env.MOCK_AI === 'true';

  if (useMock) {
    console.log('🎭 [DEV MODE] Dùng mock AI response');
    await new Promise((r) => setTimeout(r, 500));
    // Trả về raw JSON string để parseAIJsonResponse xử lý
    const isWriting = systemPrompt.includes('Writing') || systemPrompt.includes('writing');
    return JSON.stringify(isWriting ? MOCK_WRITING_RESPONSE : MOCK_SPEAKING_RESPONSE);
  }

  console.log('🤖 Gọi Groq AI (llama-3.3-70b)...');
  return await callGroq(systemPrompt, userMessage);
};

module.exports = { callGemini, parseAIJsonResponse };
