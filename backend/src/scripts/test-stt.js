require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { uploadAudio, deleteAudio } = require('../services/cloudinary.service');
const { transcribeAudio } = require('../services/stt.service');

const main = async () => {
  const rawFileArg = process.argv[2];
  const keepUploadedFile = process.argv.includes('--keep');

  if (!rawFileArg) {
    console.error('Usage: node src/scripts/test-stt.js <audio-file-path> [--keep]');
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), rawFileArg);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(filePath);
  const filename = path.basename(filePath);

  let uploaded;

  try {
    console.log(`Uploading audio: ${filePath}`);
    uploaded = await uploadAudio(buffer, filename, 'stt-test');
    console.log(`Cloudinary URL: ${uploaded.audioUrl}`);
    console.log(`Duration: ${uploaded.duration || 0}s`);

    console.log('Running Speech-to-Text...');
    const { transcript, isMock } = await transcribeAudio({
      audioUrl: uploaded.audioUrl,
      cloudinaryPublicId: uploaded.publicId,
    });

    console.log(`isMockTranscript: ${isMock}`);
    console.log('Transcript:');
    console.log(transcript);
  } catch (error) {
    console.error('STT test failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (uploaded?.publicId && !keepUploadedFile) {
      await deleteAudio(uploaded.publicId);
      console.log(`Cleaned up Cloudinary file: ${uploaded.publicId}`);
    }
  }
};

main();
