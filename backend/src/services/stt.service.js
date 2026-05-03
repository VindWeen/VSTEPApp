/**
 * Speech-to-Text Service
 * - Production: Google Cloud Speech-to-Text
 * - Development (MOCK_STT=true): Trả về transcript mẫu để test mà không cần Google credentials
 */

// ── MOCK transcript cho dev mode ──────────────────────────────
const MOCK_TRANSCRIPTS = [
  "I think social media has both positive and negative effects on society. On the positive side, it allows people to connect with friends and family around the world. However, there are also concerns about privacy and the spread of misinformation. In my opinion, we need to use social media responsibly and critically evaluate the information we see online.",
  "In my hometown, there are many interesting places to visit. The local market is very lively and colorful, with many traditional foods and crafts. There is also a beautiful park where people go for morning exercises. I believe that preserving local culture is very important for maintaining our identity.",
  "I would like to talk about the importance of learning English. English is the global language of business, science, and technology. By learning English, Vietnamese students can access more opportunities in their careers and education. I have been studying English for five years and I find it very useful in my daily life.",
];

// ── Google Cloud STT ───────────────────────────────────────────
const transcribeWithGoogle = async (audioUrl) => {
  const { SpeechClient } = require('@google-cloud/speech');
  const path = require('path');

  // Dùng absolute path để đảm bảo load đúng file credentials
  const keyFilename = path.resolve(__dirname, '../../google-credentials.json');
  const client = new SpeechClient({ keyFilename });

  // Download audio từ Cloudinary URL
  const fetch = (await import('node-fetch')).default;
  const audioResponse = await fetch(audioUrl);
  const audioBuffer = await audioResponse.buffer();
  const audioBytes = audioBuffer.toString('base64');

  const [response] = await client.recognize({
    audio: { content: audioBytes },
    config: {
      encoding: 'LINEAR16',           // WAV format từ Expo recording
      sampleRateHertz: 16000,         // 16kHz khớp với Expo config
      audioChannelCount: 1,           // Mono
      languageCode: 'en-US',
      alternativeLanguageCodes: ['en-GB'],
      enableAutomaticPunctuation: true,
      model: 'latest_long',
    },
  });

  const transcript = response.results
    .map((result) => result.alternatives[0]?.transcript || '')
    .join(' ')
    .trim();

  if (!transcript) {
    throw new Error('Không nhận diện được giọng nói. Hãy đảm bảo bạn nói rõ ràng bằng tiếng Anh và đủ to.');
  }

  return transcript;
};

// ── Main export ────────────────────────────────────────────────
/**
 * Chuyển audio URL → transcript text
 * @param {string} audioUrl - Cloudinary URL của file audio
 * @returns {{ transcript: string, isMock: boolean }}
 */
const transcribeAudio = async (audioUrl) => {
  const useMock = process.env.MOCK_STT === 'true';

  if (useMock) {
    console.log('🎭 [DEV MODE] Dùng mock STT transcript');
    // Random 1 trong 3 transcript mẫu
    const transcript = MOCK_TRANSCRIPTS[Math.floor(Math.random() * MOCK_TRANSCRIPTS.length)];
    // Simulate delay nhỏ
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { transcript, isMock: true };
  }

  try {
    const transcript = await transcribeWithGoogle(audioUrl);
    return { transcript, isMock: false };
  } catch (error) {
    console.error('❌ Google STT error:', error.message);
    throw new Error(`Speech-to-Text thất bại: ${error.message}`);
  }
};

module.exports = { transcribeAudio };
