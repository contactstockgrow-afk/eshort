const Groq = require('groq-sdk');

let groqClient = null;

function getGroqClient() {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

const SYSTEM_PROMPT = `آپ "دارالعلوم جی پی ٹی" کے اسلامی عالم ہیں۔ آپ کا کام اسلامی سوالات کے تفصیلی جوابات دینا ہے۔

آپ کے جوابات کی خصوصیات:
1. قرآن کریم کی آیات بمع حوالہ (سورت کا نام اور آیت نمبر)
2. احادیث مبارکہ بمع حوالہ (کتاب کا نام)
3. فقہ حنفی کے مطابق جوابات
4. علمائے دیوبند کے اقوال اور حوالے (خاص طور پر حضرت مولانا اشرف علی تھانوی، مفتی محمد شفیع، مفتی محمد تقی عثمانی، مولانا محمد زکریا)
5. بہشتی زیور، معارف القرآن، فضائل اعمال جیسی کتابوں سے حوالے
6. اردو زبان میں آسان فہم انداز
7. ہر جواب مکمل اور تفصیلی ہو

اہم ہدایات:
- صرف احناف/دیوبندی مسلک کے مطابق جواب دیں
- اختلافی مسائل میں فقہ حنفی کی ترجیح دیں
- جواب میں دلائل ضرور دیں
- مسائل میں احتیاط کا پہلو اختیار کریں
- غیر اسلامی یا نامناسب سوالات کا جواب نہ دیں
- ہمیشہ ادب و احترام سے جواب دیں`;

async function getAIResponse(message, history = []) {
  const client = getGroqClient();
  if (!client) {
    throw new Error('AI service not configured');
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-10).map(h => ({
      role: h.role,
      content: h.message
    })),
    { role: 'user', content: message }
  ];

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 0.9
  });

  return completion.choices[0]?.message?.content || 'معذرت، جواب دینے میں مشکل ہو رہی ہے۔';
}

const POST_GENERATION_PROMPTS = {
  'حدیث': `ایک حدیث مبارکہ بمع ترجمہ، تشریح اور حوالہ لکھیں۔ علمائے دیوبند کی شرح بھی شامل کریں۔ جواب اردو میں دیں۔ فارمیٹ:
عنوان: [حدیث کا موضوع]
---
[حدیث کا متن عربی میں]
ترجمہ: [اردو ترجمہ]
تشریح: [تفصیلی تشریح]
حوالہ: [کتاب کا نام]`,

  'فتاویٰ': `ایک عام اسلامی مسئلہ بیان کریں اور فقہ حنفی کے مطابق اس کا حل لکھیں۔ علمائے دیوبند کے فتاویٰ سے حوالہ دیں۔ جواب اردو میں دیں۔ فارمیٹ:
عنوان: [مسئلے کا عنوان]
---
سوال: [سوال]
جواب: [تفصیلی جواب بمع دلائل]
حوالہ: [کتاب/فتاویٰ کا نام]`,

  'واقعات': `اسلامی تاریخ کا ایک سبق آموز واقعہ لکھیں - صحابہ کرام، انبیاء علیہم السلام یا اکابرین دیوبند کا واقعہ۔ جواب اردو میں دیں۔ فارمیٹ:
عنوان: [واقعے کا عنوان]
---
[واقعے کی تفصیل]
سبق: [واقعے سے سبق]
حوالہ: [کتاب کا نام]`,

  'تفسیر': `قرآن کریم کی ایک آیت کی تفسیر لکھیں، معارف القرآن یا تفسیر عثمانی سے استفادہ کرتے ہوئے۔ جواب اردو میں دیں۔ فارمیٹ:
عنوان: [آیت/سورت کا نام]
---
آیت: [عربی متن]
ترجمہ: [اردو ترجمہ]
تفسیر: [تفصیلی تفسیر]
حوالہ: [تفسیر کی کتاب]`,

  'خواتین': `خواتین سے متعلق ایک اسلامی موضوع پر تفصیلی پوسٹ لکھیں۔ قرآن، حدیث اور بہشتی زیور سے حوالے دیں۔ جواب اردو میں دیں۔ فارمیٹ:
عنوان: [موضوع]
---
[تفصیلی مضمون]
حوالہ: [کتاب کا نام]`,

  'اقوال': `علمائے دیوبند کے سنہری اقوال جمع کریں (کم از کم ۵ اقوال)۔ ہر قول کے ساتھ عالم کا نام اور مختصر تشریح لکھیں۔ جواب اردو میں دیں۔ فارمیٹ:
عنوان: [موضوع]
---
[اقوال بمع حوالہ]`
};

async function generatePost(category, agentId) {
  const client = getGroqClient();
  if (!client) {
    throw new Error('AI service not configured');
  }

  const prompt = POST_GENERATION_PROMPTS[category] || POST_GENERATION_PROMPTS['واقعات'];

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'آپ ایک اسلامی عالم ہیں جو علمائے دیوبند کے مسلک کے مطابق اسلامی مواد تیار کرتے ہیں۔ آپ کا مواد قرآن، حدیث اور فقہ حنفی پر مبنی ہوتا ہے۔'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.8,
    max_tokens: 1500
  });

  const content = completion.choices[0]?.message?.content || '';

  const titleMatch = content.match(/عنوان:\s*(.+)/);
  const title = titleMatch ? titleMatch[1].trim() : `${category} - نئی پوسٹ`;
  const referenceMatch = content.match(/حوالہ:\s*(.+)/);
  const reference = referenceMatch ? referenceMatch[1].trim() : null;

  const mainContent = content
    .replace(/عنوان:\s*.+\n/, '')
    .replace(/---\n/, '')
    .trim();

  return { title, content: mainContent, source_reference: reference, category, agent_id: agentId };
}

module.exports = { getAIResponse, generatePost };
