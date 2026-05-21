const cloudinary = require('../config/cloudinary');

/**
 * Speech-to-Text Service
 * - Production: Google Cloud Speech-to-Text
 * - Development (MOCK_STT=true): return transcript mẫu để test mà không cần Google credentials
 * - Fallback: nếu Google STT thất bại thì trả về mock transcript thay vì làm hỏng toàn bộ flow
 */

const MOCK_TRANSCRIPTS = [
  'I think social media has both positive and negative effects on society. On the positive side, it allows people to connect with friends and family around the world. However, there are also concerns about privacy and the spread of misinformation. In my opinion, we need to use social media responsibly and critically evaluate the information we see online.',
  'In my hometown, there are many interesting places to visit. The local market is very lively and colorful, with many traditional foods and crafts. There is also a beautiful park where people go for morning exercises. I believe that preserving local culture is very important for maintaining our identity.',
  'I would like to talk about the importance of learning English. English is the global language of business, science, and technology. By learning English, Vietnamese students can access more opportunities in their careers and education. I have been studying English for five years and I find it very useful in my daily life.',
];

const getMockTranscript = async () => {
  const transcript = MOCK_TRANSCRIPTS[Math.floor(Math.random() * MOCK_TRANSCRIPTS.length)];
  await new Promise((resolve) => setTimeout(resolve, 800));
  return transcript;
};

const buildCloudinaryWavUrl = (publicId) => {
  if (!publicId) return null;

  return cloudinary.url(publicId, {
    resource_type: 'video',
    format: 'wav',
    secure: true,
  });
};

const normalizeAudioSource = (audioSource) => {
  if (!audioSource) {
    throw new Error('Thiếu audio source để transcribe');
  }

  if (typeof audioSource === 'string') {
    return {
      originalUrl: audioSource,
      preferredUrl: audioSource,
      cloudinaryPublicId: null,
    };
  }

  const originalUrl = audioSource.audioUrl || audioSource.originalUrl || '';
  const wavUrl = buildCloudinaryWavUrl(audioSource.cloudinaryPublicId);

  return {
    originalUrl,
    preferredUrl: wavUrl || originalUrl,
    cloudinaryPublicId: audioSource.cloudinaryPublicId || null,
  };
};

const parseWavMetadata = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 44) {
    return null;
  }

  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    return null;
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);

    if (chunkId === 'fmt ' && offset + 24 <= buffer.length) {
      return {
        audioFormat: buffer.readUInt16LE(offset + 8),
        audioChannelCount: buffer.readUInt16LE(offset + 10),
        sampleRateHertz: buffer.readUInt32LE(offset + 12),
        bitsPerSample: buffer.readUInt16LE(offset + 22),
      };
    }

    offset += 8 + chunkSize + (chunkSize % 2);
  }

  return null;
};

const transcribeWithGoogle = async (audioSource) => {
  const { SpeechClient } = require('@google-cloud/speech');
  const path = require('path');
  const { preferredUrl } = normalizeAudioSource(audioSource);

  const keyFilename = path.resolve(__dirname, '../../google-credentials.json');
  const client = new SpeechClient({ keyFilename });

  const fetch = (await import('node-fetch')).default;
  const audioResponse = await fetch(preferredUrl);

  if (!audioResponse.ok) {
    throw new Error(`Không tải được audio cho STT (${audioResponse.status})`);
  }

  const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
  const audioBytes = audioBuffer.toString('base64');
  const wavMetadata = parseWavMetadata(audioBuffer);

  const recognitionConfig = {
    languageCode: 'en-US',
    alternativeLanguageCodes: ['en-GB'],
    enableAutomaticPunctuation: true,
    model: 'latest_long',
  };

  if (wavMetadata?.sampleRateHertz) {
    recognitionConfig.sampleRateHertz = wavMetadata.sampleRateHertz;
  }

  if (wavMetadata?.audioChannelCount > 1) {
    recognitionConfig.audioChannelCount = wavMetadata.audioChannelCount;
  }

  let response;
  try {
    [response] = await client.recognize({
      audio: { content: audioBytes },
      config: recognitionConfig,
    });
  } catch (error) {
    error.wavMetadata = wavMetadata;
    error.recognitionConfig = recognitionConfig;
    throw error;
  }

  const transcript = response.results
    .map((result) => result.alternatives[0]?.transcript || '')
    .join(' ')
    .trim();

  if (!transcript) {
    throw new Error(
      'Không nhận diện được giọng nói. Hãy đảm bảo bạn nói rõ ràng bằng tiếng Anh và đủ to.'
    );
  }

  return transcript;
};

/**
 * Chuyển audio source → transcript text
 * @param {string|{audioUrl: string, cloudinaryPublicId?: string}} audioSource
 * @returns {{ transcript: string, isMock: boolean }}
 */
const transcribeAudio = async (audioSource) => {
  const useMock = process.env.MOCK_STT === 'true';

  if (useMock) {
    console.log('[DEV MODE] Dùng mock STT transcript');
    return { transcript: await getMockTranscript(), isMock: true };
  }

  try {
    const transcript = await transcribeWithGoogle(audioSource);
    return { transcript, isMock: false };
  } catch (error) {
    const sourceInfo = normalizeAudioSource(audioSource);
    console.error('Google STT error:', error.message);
    console.warn('STT source info:', sourceInfo);
    if (error?.wavMetadata) {
      console.warn('STT wav metadata:', error.wavMetadata);
    }
    console.warn('STT fallback activated: dùng mock transcript để không fail toàn bộ bài test');
    return { transcript: await getMockTranscript(), isMock: true };
  }
};

module.exports = { transcribeAudio };
