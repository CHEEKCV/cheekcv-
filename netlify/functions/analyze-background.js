const https = require('https');
const { getStore } = require('@netlify/blobs');

const API_KEY = process.env.ANTHROPIC_API_KEY;

const ARCHETYPES = {
  1: { name: "حصان الشغل", emoji: "🐎", en: "The Workhorse" },
  2: { name: "عبقري لكنه منهك", emoji: "🧠", en: "The Burnt Genius" },
  3: { name: "مدير بدون منصب", emoji: "👔", en: "The Unofficial Manager" },
  4: { name: "صاحب الحضور الخطير", emoji: "⚡", en: "The Power Presence" },
  5: { name: "القائد في وقت الأزمات فقط", emoji: "🚨", en: "The Crisis Leader" },
  6: { name: "صانع القادة", emoji: "👑", en: "The Leader Maker" },
  7: { name: "ملك العلاقات", emoji: "🤝", en: "The Relationship King" },
  8: { name: "روح الفريق", emoji: "🌟", en: "The Team Soul" },
  9: { name: "وجه الشركة", emoji: "🎤", en: "The Company Face" },
  10: { name: "الموظف السياسي", emoji: "🎭", en: "The Political Player" },
  11: { name: "سارق المجهود", emoji: "🦹", en: "The Credit Stealer" },
  12: { name: "ضحية كل شي", emoji: "😩", en: "The Eternal Victim" },
  13: { name: "الضائع مهنياً", emoji: "🧭", en: "The Lost One" },
  14: { name: "العائد المتردد", emoji: "🔄", en: "The Hesitant Returner" },
  15: { name: "التنين النائم", emoji: "🐉", en: "The Sleeping Dragon" },
  16: { name: "الفلتة", emoji: "💎", en: "The Outlier" },
  17: { name: "الموهبة المهملة", emoji: "💔", en: "The Neglected Talent" },
  18: { name: "جاهز بس تنتظر", emoji: "⏳", en: "Ready But Waiting" },
  19: { name: "المنقطع المتمسك", emoji: "🪢", en: "The Loyal Disconnected" },
  20: { name: "العراب", emoji: "🎩", en: "The Godfather" },
  21: { name: "الخبير الصامت", emoji: "🤫", en: "The Silent Expert" },
  22: { name: "المتواضع", emoji: "🙏", en: "The Humble" },
  23: { name: "السائح المهني", emoji: "🧳", en: "The Career Tourist" },
  24: { name: "صائد الفرص", emoji: "🎯", en: "The Opportunist" },
  25: { name: "الصاروخ", emoji: "🚀", en: "The Rocket" },
  26: { name: "المخضرم", emoji: "🏛️", en: "The Veteran" },
  27: { name: "الكسول", emoji: "😴", en: "The Lazy" },
  28: { name: "صاحب الكاريزما", emoji: "✨", en: "The Charismatic" },
  29: { name: "الأسطورة في عقله", emoji: "🦁", en: "Legend In His Mind" },
  30: { name: "المتلاعب", emoji: "🎲", en: "The Manipulator" },
  31: { name: "المخطط اللي ما ينفذ", emoji: "📝", en: "The Non-Executor" }
};

function httpsPost(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch(e) { reject(new Error('Invalid JSON response')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(new Error('Request timeout')); });
    req.write(data);
    req.end();
  });
}

const FULL_ANALYSIS_TOOL = {
  name: "submit_full_analysis",
  description: "Submit complete CV analysis with all sections",
  input_schema: {
    type: "object",
    properties: {
      archetype_id: { type: "integer", minimum: 1, maximum: 31 },
      description: { type: "string" },
      market_view: { type: "string" },
      years_experience: { type: "integer" },
      companies_count: { type: "integer" },
      career_trend: { type: "string", enum: ["صاعد", "واقف", "نازل"] },
      market_demand: { type: "integer", minimum: 0, maximum: 100 },
      strengths: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 5 },
      weaknesses: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 5 },
      cv_insights: {
        type: "array",
        items: { type: "object", properties: { label: { type: "string" }, text: { type: "string" } }, required: ["label", "text"] },
        minItems: 4, maxItems: 4
      },
      recommendations: {
        type: "array",
        items: { type: "object", properties: { title: { type: "string" }, desc: { type: "string" } }, required: ["title", "desc"] },
        minItems: 3, maxItems: 3
      },
      career_paths: {
        type: "array",
        items: { type: "object", properties: { title: { type: "string" }, desc: { type: "string" }, match: { type: "integer" } }, required: ["title", "desc", "match"] },
        minItems: 3, maxItems: 3
      },
      courses: {
        type: "array",
        items: { type: "object", properties: { title: { type: "string" }, reason: { type: "string" } }, required: ["title", "reason"] },
        minItems: 5, maxItems: 5
      },
      market_cards: {
        type: "array",
        items: { type: "object", properties: { label: { type: "string" }, text: { type: "string" } }, required: ["label", "text"] },
        minItems: 4, maxItems: 4
      },
      jobs: {
        type: "array",
        items: { type: "object", properties: { title: { type: "string" }, reason: { type: "string" }, salary: { type: "string" } }, required: ["title", "reason", "salary"] },
        minItems: 5, maxItems: 5
      }
    },
    required: ["archetype_id", "description", "market_view", "years_experience", "companies_count", "career_trend", "market_demand", "strengths", "weaknesses", "cv_insights", "recommendations", "career_paths", "courses", "market_cards", "jobs"]
  }
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const store = getStore({
    name: 'cv-results',
    siteID: process.env.SITE_ID,
    token: process.env.NETLIFY_TOKEN
  });

  let jobId, cvText;
  try {
    const body = JSON.parse(event.body);
    jobId = body.jobId;
    cvText = body.cvText;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  if (!jobId || !cvText || cvText.length < 50) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing jobId or cvText" }) };
  }

  // Mark job as in-progress immediately
  await store.setJSON(jobId, { status: 'processing' });

  try {
    const cv = cvText.substring(0, 4000);
    const archetypesList = Object.entries(ARCHETYPES).map(([id, a]) => `${id}: ${a.name}`).join('\n');

    const response = await httpsPost({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 10000,
      tools: [FULL_ANALYSIS_TOOL],
      tool_choice: { type: "tool", name: "submit_full_analysis" },
      messages: [{
        role: "user",
        content: `أنت محلل مهني سعودي ناقد وجريء، أسلوبك مباشر ومستفز بطريقة بنّاءة — لا تجامل ولا تلطّف الحقائق. تكتب بالعربية الفصحى البسيطة أو اللهجة السعودية فقط، بدون أي كلمة إنجليزية إطلاقاً.

السيرة الذاتية:
${cv}

اختر الشخصية المهنية الأنسب:
${archetypesList}

تعليمات مهمة:
١. الوصف والتحليل: اكتب بأسلوب ناقد وصريح — ليس قاسياً بلا فائدة، بل مستفز يدفع للتفكير. مثال: "أنت تشتغل بمستوى أعلى من مسماك بعشر سنوات ولا أحد عارف" أو "هذه السيرة تقول إنك موجود، مش إنك مميز".
٢. اللغة: عربية فقط. لا تكتب أي مصطلح إنجليزي — بدل "backend" قل "الواجهة الخلفية"، بدل "HR" قل "الموارد البشرية"، بدل "soft skills" قل "المهارات الشخصية"، بدل "leadership" قل "القيادة".
٣. الرواتب — استخدم هذا المرجع للسوق السعودي:
   - دبلوم (خريج جديد): ٥٠٠٠-٧٠٠٠ ريال
   - بكالوريوس (خريج جديد): ٨٠٠٠-١٣٠٠٠ ريال
   - بكالوريوس + ٣-٥ سنوات: ١٢٠٠٠-٢٠٠٠٠ ريال
   - بكالوريوس + ٧-١٠ سنوات: ١٨٠٠٠-٣٠٠٠٠ ريال
   - ماجستير + خبرة: ٢٢٠٠٠-٤٠٠٠٠ ريال
   - المناصب القيادية: ٣٠٠٠٠-٦٠٠٠٠+ ريال
   - احسب الراتب بناءً على المؤهل والخبرة الفعلية من السيرة.
٤. المحتوى: كل حقل يجب أن يكون غنياً ومفصّلاً — لا تكتفي بجملة واحدة. الوصف يجب أن يكون فقرة كاملة تصف الشخص بدقة شخصية.
٥. نقاط القوة والضعف: كن محدداً جداً — استند لما في السيرة بالضبط، لا تكتب كلاماً عاماً.`
      }]
    });

    if (!response.content) {
      throw new Error('API failed: ' + JSON.stringify(response).substring(0, 200));
    }

    const toolUse = response.content.find(c => c.type === 'tool_use');
    if (!toolUse) {
      throw new Error('No tool_use in response');
    }

    const data = toolUse.input;
    const archetypeData = ARCHETYPES[data.archetype_id] || ARCHETYPES[1];

    data.cv_insights = data.cv_insights || [];
    data.career_paths = data.career_paths || [];
    data.courses = data.courses || [];
    data.market_cards = data.market_cards || [];
    data.recommendations = data.recommendations || [];
    data.jobs = data.jobs || [];

    const insightIcons = ['📈', '🏢', '⚡', '🎯'];
    data.cv_insights = data.cv_insights.map((i, idx) => ({ ...i, icon: insightIcons[idx] || '📊' }));

    const pathIcons = ['🏗️', '🎯', '🚀'];
    data.career_paths = data.career_paths.map((p, idx) => ({ ...p, icon: pathIcons[idx] || '🎯' }));

    data.courses = data.courses.map((c, idx) => ({ ...c, num: String(idx + 1).padStart(2, '0') }));

    data.market_cards = data.market_cards.map((m, idx) => ({
      ...m,
      has_bar: idx === 0,
      bar_pct: idx === 0 ? data.market_demand : undefined
    }));

    // Spread data first so our mapped archetype fields always win
    const result = {
      status: 'done',
      ...data,
      archetype: archetypeData.name,
      archetype_en: archetypeData.en,
      archetype_emoji: archetypeData.emoji,
      archetype_id: data.archetype_id,
    };

    // Store result — expires after 1 hour
    await store.setJSON(jobId, result, { ttl: 3600 });
    console.log('DONE:', jobId, archetypeData.name);

  } catch (err) {
    console.log('ERROR:', jobId, err.message);
    await store.setJSON(jobId, { status: 'error', error: err.message }, { ttl: 3600 });
  }

  return { statusCode: 202 };
};
