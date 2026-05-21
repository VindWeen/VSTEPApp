/**
 * Seed data: 2 đề Listening mẫu cho VSTEP
 * Chạy: npm run seed:listening
 * 
 * audioUrl dùng file MP3 mẫu từ internet (public domain)
 * Khi có Cloudinary, thay bằng URL Cloudinary thật
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const ListeningTest = require('../models/ListeningTest');

// URL audio mẫu (dùng LibriVox - public domain English audio)
const SAMPLE_AUDIO_BASE = 'https://www.soundhelix.com/examples/mp3';

const listeningTests = [
  {
    skill: 'listening',
    level: 'B1',
    title: 'Đề Nghe 01 – B1',
    description: 'Bài thi nghe cấp độ B1 với các đoạn hội thoại và độc thoại ngắn',
    duration: 25, // phút
    totalQuestions: 15,
    parts: [
      {
        partNumber: 1,
        partTitle: 'Part 1 – Short Conversations',
        partDescription: 'Nghe 5 đoạn hội thoại ngắn và trả lời câu hỏi',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Thay bằng audio thật
        audioDuration: 180,
        questions: [
          {
            questionNumber: 1,
            questionText: 'What does the woman want to do this weekend?',
            questionType: 'MCQ',
            options: {
              A: 'Go to the cinema',
              B: 'Visit her parents',
              C: 'Stay at home',
              D: 'Go shopping',
            },
            correctAnswer: 'A',
            explanation: 'The woman says "I\'d like to catch a movie this weekend".',
          },
          {
            questionNumber: 2,
            questionText: 'Where does the conversation take place?',
            questionType: 'MCQ',
            options: {
              A: 'At a hospital',
              B: 'At a pharmacy',
              C: 'At a clinic',
              D: 'At a supermarket',
            },
            correctAnswer: 'B',
            explanation: 'The man asks about prescription medicine, indicating a pharmacy.',
          },
          {
            questionNumber: 3,
            questionText: 'What time does the train leave?',
            questionType: 'MCQ',
            options: {
              A: '9:15',
              B: '9:30',
              C: '9:45',
              D: '10:00',
            },
            correctAnswer: 'C',
            explanation: 'The announcement states the train departs at 9:45.',
          },
          {
            questionNumber: 4,
            questionText: 'Why is the woman calling?',
            questionType: 'MCQ',
            options: {
              A: 'To cancel an appointment',
              B: 'To make a reservation',
              C: 'To ask for directions',
              D: 'To complain about service',
            },
            correctAnswer: 'B',
            explanation: 'The woman says she wants to "book a table for two".',
          },
          {
            questionNumber: 5,
            questionText: 'What is the weather forecast for tomorrow?',
            questionType: 'MCQ',
            options: {
              A: 'Sunny and warm',
              B: 'Cloudy with rain',
              C: 'Windy but dry',
              D: 'Cold and snowy',
            },
            correctAnswer: 'B',
            explanation: 'The forecast mentions "cloudy skies and possible showers".',
          },
        ],
      },
      {
        partNumber: 2,
        partTitle: 'Part 2 – Short Monologues',
        partDescription: 'Nghe 5 đoạn độc thoại ngắn và trả lời câu hỏi',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        audioDuration: 240,
        questions: [
          {
            questionNumber: 6,
            questionText: 'What is the main topic of the announcement?',
            questionType: 'MCQ',
            options: {
              A: 'A new bus route',
              B: 'Road construction',
              C: 'A community event',
              D: 'School closure',
            },
            correctAnswer: 'C',
            explanation: 'The speaker announces a community festival in the local park.',
          },
          {
            questionNumber: 7,
            questionText: 'When will the library be closed?',
            questionType: 'MCQ',
            options: {
              A: 'Monday to Wednesday',
              B: 'Thursday only',
              C: 'Friday and Saturday',
              D: 'The whole week',
            },
            correctAnswer: 'C',
            explanation: 'The message says the library will be shut "this Friday and Saturday for renovation".',
          },
          {
            questionNumber: 8,
            questionText: 'What must visitors bring to enter the exhibition?',
            questionType: 'MCQ',
            options: {
              A: 'A valid ID card',
              B: 'A printed ticket',
              C: 'A membership card',
              D: 'A receipt',
            },
            correctAnswer: 'A',
            explanation: 'The announcement requires visitors to show "a valid form of identification".',
          },
          {
            questionNumber: 9,
            questionText: 'How much does the course cost?',
            questionType: 'MCQ',
            options: {
              A: '$50',
              B: '$75',
              C: '$100',
              D: '$150',
            },
            correctAnswer: 'B',
            explanation: 'The speaker mentions "the course fee is seventy-five dollars".',
          },
          {
            questionNumber: 10,
            questionText: 'What does the speaker recommend?',
            questionType: 'MCQ',
            options: {
              A: 'Arriving early',
              B: 'Booking in advance',
              C: 'Bringing cash',
              D: 'Wearing formal clothes',
            },
            correctAnswer: 'B',
            explanation: 'The speaker says "we strongly advise booking your seats in advance".',
          },
        ],
      },
      {
        partNumber: 3,
        partTitle: 'Part 3 – Longer Conversation',
        partDescription: 'Nghe 1 đoạn hội thoại dài và trả lời 5 câu hỏi',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        audioDuration: 300,
        questions: [
          {
            questionNumber: 11,
            questionText: 'What are the two speakers discussing?',
            questionType: 'MCQ',
            options: {
              A: 'A work project',
              B: 'A holiday trip',
              C: 'A new apartment',
              D: 'A business idea',
            },
            correctAnswer: 'B',
            explanation: 'They discuss plans for their upcoming vacation.',
          },
          {
            questionNumber: 12,
            questionText: 'Where does the man prefer to go?',
            questionType: 'MCQ',
            options: {
              A: 'The mountains',
              B: 'The beach',
              C: 'A city',
              D: 'The countryside',
            },
            correctAnswer: 'A',
            explanation: 'The man says he has "always wanted to try mountain hiking".',
          },
          {
            questionNumber: 13,
            questionText: 'What problem does the woman mention?',
            questionType: 'MCQ',
            options: {
              A: 'The cost is too high',
              B: 'She cannot get time off work',
              C: 'The weather may be bad',
              D: 'She does not like hiking',
            },
            correctAnswer: 'C',
            explanation: 'The woman says she is worried about "the unpredictable mountain weather".',
          },
          {
            questionNumber: 14,
            questionText: 'What do they finally agree to do?',
            questionType: 'MCQ',
            options: {
              A: 'Book a beach resort',
              B: 'Plan a city trip',
              C: 'Research mountain trips more',
              D: 'Stay home for the holidays',
            },
            correctAnswer: 'C',
            explanation: 'They agree to "do more research and check the weather forecast" before deciding.',
          },
          {
            questionNumber: 15,
            questionText: 'When do they plan to make a final decision?',
            questionType: 'MCQ',
            options: {
              A: 'Tomorrow',
              B: 'Next week',
              C: 'By the end of the month',
              D: 'After the weekend',
            },
            correctAnswer: 'B',
            explanation: 'The woman says "let\'s decide by next week".',
          },
        ],
      },
    ],
  },

  // ── ĐỀ 2: B2 ───────────────────────────────────────────────
  {
    skill: 'listening',
    level: 'B2',
    title: 'Đề Nghe 02 – B2',
    description: 'Bài thi nghe cấp độ B2 với nội dung phức tạp hơn',
    duration: 30,
    totalQuestions: 15,
    parts: [
      {
        partNumber: 1,
        partTitle: 'Part 1 – News Reports',
        partDescription: 'Nghe 5 đoạn tin tức ngắn',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        audioDuration: 200,
        questions: [
          {
            questionNumber: 1,
            questionText: 'What is the main cause of the traffic problem mentioned?',
            questionType: 'MCQ',
            options: {
              A: 'A road accident',
              B: 'Construction work',
              C: 'A public protest',
              D: 'Flooding',
            },
            correctAnswer: 'B',
            explanation: 'The report says traffic was delayed due to "ongoing construction work on the main highway".',
          },
          {
            questionNumber: 2,
            questionText: 'What percentage of employees work from home according to the survey?',
            questionType: 'MCQ',
            options: {
              A: '35%',
              B: '45%',
              C: '55%',
              D: '65%',
            },
            correctAnswer: 'C',
            explanation: 'The survey results show "55 percent of workers now work remotely at least part of the week".',
          },
          {
            questionNumber: 3,
            questionText: 'What action has the city council decided to take?',
            questionType: 'MCQ',
            options: {
              A: 'Build a new sports center',
              B: 'Reduce public transport fares',
              C: 'Increase parking fees',
              D: 'Close the old market',
            },
            correctAnswer: 'B',
            explanation: 'The council voted to "reduce bus and metro fares by 20 percent from next month".',
          },
          {
            questionNumber: 4,
            questionText: 'What environmental issue is discussed?',
            questionType: 'MCQ',
            options: {
              A: 'Air pollution levels',
              B: 'Ocean plastic waste',
              C: 'Deforestation rates',
              D: 'Water shortages',
            },
            correctAnswer: 'A',
            explanation: 'The report focuses on dangerously high levels of air pollution in industrial cities.',
          },
          {
            questionNumber: 5,
            questionText: 'Who won the award mentioned?',
            questionType: 'MCQ',
            options: {
              A: 'A university professor',
              B: 'A young entrepreneur',
              C: 'A government official',
              D: 'A school teacher',
            },
            correctAnswer: 'B',
            explanation: 'The award went to "a 28-year-old startup founder" for innovation in clean energy.',
          },
        ],
      },
      {
        partNumber: 2,
        partTitle: 'Part 2 – Lecture Excerpt',
        partDescription: 'Nghe đoạn trích bài giảng và trả lời câu hỏi',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        audioDuration: 280,
        questions: [
          {
            questionNumber: 6,
            questionText: 'What is the lecture mainly about?',
            questionType: 'MCQ',
            options: {
              A: 'The history of the internet',
              B: 'Effects of social media on mental health',
              C: 'Technology in education',
              D: 'Cybersecurity threats',
            },
            correctAnswer: 'B',
            explanation: 'The lecturer focuses on research about social media use and its psychological effects.',
          },
          {
            questionNumber: 7,
            questionText: 'According to the research cited, heavy social media use is linked to:',
            questionType: 'MCQ',
            options: {
              A: 'Better academic performance',
              B: 'Increased physical activity',
              C: 'Higher levels of anxiety',
              D: 'Stronger family relationships',
            },
            correctAnswer: 'C',
            explanation: 'The study found a correlation between heavy social media use and anxiety symptoms.',
          },
          {
            questionNumber: 8,
            questionText: 'What solution does the lecturer suggest?',
            questionType: 'MCQ',
            options: {
              A: 'Banning social media completely',
              B: 'Setting daily usage limits',
              C: 'Using only educational platforms',
              D: 'Switching to offline activities only',
            },
            correctAnswer: 'B',
            explanation: 'The lecturer recommends "setting clear time limits on daily social media use".',
          },
          {
            questionNumber: 9,
            questionText: 'Which age group is most affected according to the data?',
            questionType: 'MCQ',
            options: {
              A: 'Children under 12',
              B: 'Teenagers aged 13–18',
              C: 'Young adults aged 19–25',
              D: 'Adults aged 26–40',
            },
            correctAnswer: 'B',
            explanation: 'The data shows teenagers show the most significant negative effects.',
          },
          {
            questionNumber: 10,
            questionText: 'What will the next lecture cover?',
            questionType: 'MCQ',
            options: {
              A: 'Positive uses of technology',
              B: 'Case studies from different countries',
              C: 'Interview techniques for research',
              D: 'Statistical analysis methods',
            },
            correctAnswer: 'B',
            explanation: 'The lecturer says "next week we will look at case studies from several countries".',
          },
        ],
      },
      {
        partNumber: 3,
        partTitle: 'Part 3 – Discussion Panel',
        partDescription: 'Nghe thảo luận nhóm và trả lời câu hỏi',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
        audioDuration: 320,
        questions: [
          {
            questionNumber: 11,
            questionText: 'What topic is being debated?',
            questionType: 'MCQ',
            options: {
              A: 'Remote working policies',
              B: 'Minimum wage increases',
              C: 'Environmental regulations',
              D: 'Education funding',
            },
            correctAnswer: 'A',
            explanation: 'The panel discusses the pros and cons of permanent remote work arrangements.',
          },
          {
            questionNumber: 12,
            questionText: 'What does Speaker A believe about remote working?',
            questionType: 'MCQ',
            options: {
              A: 'It reduces productivity',
              B: 'It improves work-life balance',
              C: 'It is only suitable for tech companies',
              D: 'It increases company costs',
            },
            correctAnswer: 'B',
            explanation: 'Speaker A argues remote work "significantly improves employees\' work-life balance".',
          },
          {
            questionNumber: 13,
            questionText: 'What concern does Speaker B raise?',
            questionType: 'MCQ',
            options: {
              A: 'Security risks',
              B: 'Team collaboration difficulties',
              C: 'Higher internet costs',
              D: 'Loss of office culture',
            },
            correctAnswer: 'B',
            explanation: 'Speaker B is worried about "the challenge of maintaining effective team collaboration remotely".',
          },
          {
            questionNumber: 14,
            questionText: 'What does the moderator suggest as a compromise?',
            questionType: 'MCQ',
            options: {
              A: 'Fully remote work',
              B: 'Five days in office',
              C: 'A hybrid model',
              D: 'Flexible hours only',
            },
            correctAnswer: 'C',
            explanation: 'The moderator proposes "a hybrid model combining home and office days".',
          },
          {
            questionNumber: 15,
            questionText: 'What does the panel agree is most important?',
            questionType: 'MCQ',
            options: {
              A: 'Employee happiness',
              B: 'Company profits',
              C: 'Clear communication',
              D: 'Technical infrastructure',
            },
            correctAnswer: 'C',
            explanation: 'All speakers agree that "clear and consistent communication is the key factor".',
          },
        ],
      },
    ],
  },
];

// ── Run seed ──────────────────────────────────────────────────
const seedListening = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Kết nối MongoDB thành công');

    // Xóa data listening cũ
    const deleted = await ListeningTest.deleteMany({});
    console.log(`🗑️  Đã xóa ${deleted.deletedCount} đề listening cũ`);

    // Insert mới
    const inserted = await ListeningTest.insertMany(listeningTests);
    console.log(`✅ Đã seed ${inserted.length} đề Listening:`);
    inserted.forEach((q) => console.log(`   - ${q.title} (${q.level}) [ID: ${q._id}]`));

    await mongoose.disconnect();
    console.log('\n🎉 Seed Listening hoàn thành!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed thất bại:', error.message);
    process.exit(1);
  }
};

seedListening();
