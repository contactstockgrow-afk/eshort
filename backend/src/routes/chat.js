const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');
const { getAIResponse } = require('../services/ai');
const router = express.Router();

router.post('/', async (req, res) => {
  const { message, session_id } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const sessionId = session_id || uuidv4();
  const db = getDb();

  db.prepare(
    'INSERT INTO chat_history (id, session_id, role, message) VALUES (?, ?, ?, ?)'
  ).run(uuidv4(), sessionId, 'user', message);

  const history = db.prepare(
    'SELECT role, message FROM chat_history WHERE session_id = ? ORDER BY created_at ASC LIMIT 20'
  ).all(sessionId);

  try {
    const aiResponse = await getAIResponse(message, history);

    db.prepare(
      'INSERT INTO chat_history (id, session_id, role, message) VALUES (?, ?, ?, ?)'
    ).run(uuidv4(), sessionId, 'assistant', aiResponse);

    res.json({
      session_id: sessionId,
      response: aiResponse
    });
  } catch (error) {
    console.error('Chat error:', error.message);
    const fallbackResponse = getFallbackResponse(message);

    db.prepare(
      'INSERT INTO chat_history (id, session_id, role, message) VALUES (?, ?, ?, ?)'
    ).run(uuidv4(), sessionId, 'assistant', fallbackResponse);

    res.json({
      session_id: sessionId,
      response: fallbackResponse
    });
  }
});

router.get('/history/:session_id', (req, res) => {
  const db = getDb();
  const history = db.prepare(
    'SELECT role, message, created_at FROM chat_history WHERE session_id = ? ORDER BY created_at ASC'
  ).all(req.params.session_id);
  res.json(history);
});

function getFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('نماز') || lowerMessage.includes('prayer') || lowerMessage.includes('namaz')) {
    return `نماز اسلام کا دوسرا اور سب سے اہم رکن ہے۔ نبی کریم ﷺ نے فرمایا: "نماز دین کا ستون ہے۔" (ترمذی)

نماز کے فرائض:
۱) فجر: ۲ رکعت فرض
۲) ظہر: ۴ رکعت فرض
۳) عصر: ۴ رکعت فرض
۴) مغرب: ۳ رکعت فرض
۵) عشاء: ۴ رکعت فرض

نماز کی شرائط میں طہارت، ستر پوشی، قبلہ رخ ہونا، وقت کا داخل ہونا اور نیت شامل ہیں۔

مزید تفصیل کے لیے "بہشتی زیور" (حضرت تھانوی رحمہ اللہ) کا مطالعہ کریں۔`;
  }

  if (lowerMessage.includes('روز') || lowerMessage.includes('رمضان') || lowerMessage.includes('fasting')) {
    return `روزہ اسلام کا تیسرا رکن ہے۔ رمضان المبارک کے روزے ہر بالغ، عاقل مسلمان مرد و عورت پر فرض ہیں۔

اللہ تعالیٰ فرماتا ہے: "اے ایمان والو! تم پر روزے فرض کیے گئے جیسا کہ تم سے پہلے لوگوں پر فرض کیے گئے تھے تاکہ تم تقویٰ اختیار کرو۔" (البقرہ: ۱۸۳)

روزے کے فوائد: تقویٰ، صبر، غریبوں سے ہمدردی، صحت کے فوائد اور گناہوں کی معافی۔`;
  }

  return `السلام علیکم! آپ کا سوال موصول ہوا۔

اسلامی مسائل کے تفصیلی جوابات کے لیے ہم قرآن کریم، احادیث مبارکہ اور علمائے دیوبند کی تعلیمات سے رہنمائی لیتے ہیں۔

آپ کے سوال کا مکمل جواب دینے کے لیے AI سروس فعال ہونا ضروری ہے۔ براہ کرم اپنا سوال واضح طور پر دوبارہ پوچھیں۔

عام مسائل کے لیے ان کتابوں کا مطالعہ مفید ہوگا:
• بہشتی زیور - حضرت مولانا اشرف علی تھانوی رحمہ اللہ
• فضائل اعمال - حضرت مولانا محمد زکریا رحمہ اللہ
• معارف القرآن - مفتی محمد شفیع رحمہ اللہ`;
}

module.exports = router;
