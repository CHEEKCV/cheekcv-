const https = require('https');
const API_KEY = process.env.ANTHROPIC_API_KEY;

// 31 شخصية مهنية كـ enum ثابت
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
        try { resolve(JSON.parse(raw)); } catch(e) { reject(new Error('Invalid response: ' + raw.substring(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Tool Use schema - يجبر Claude يرجع JSON صحيح
const ANALYZE_TOOL = {
  name: "submit_cv_analysis",
  description: "Submit professional CV analysis results",
  input_schema: {
    type: "object",
    properties: {
      archetype_id: {
        type: "integer",
        minimum: 1,
        maximum: 31,
        description: "ID of the matching archetype from the list 1-31"
      },
      description: {
        type: "string",
        description: "وصف الشخصية في 3 جمل بلهجة سعودية مباشرة"
      },
      market_view: {
        type: "string",
        description: "جملة واحدة كيف يراك سوق العمل"
      },
      years_experience: { type: "integer" },
      companies_count: { type: "integer" },
      career_trend: { type: "string", enum: ["صاعد", "واقف", "نازل"] },
      market_demand: { type: "integer", minimum: 0, maximum: 100 },
      strengths: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 5 },
      weaknesses: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 5 }
    },
    required: ["archetype_id", "description", "market_view", "years_experience", "companies_count", "career_trend", "market_demand", "strengths", "weaknesses"]
  }
};

const INSIGHTS_TOOL = {
  name: "submit_insights",
  description: "Submit detailed CV insights and recommendations",
  input_schema: {
    type: "object",
    properties: {
      cv_insights: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            text: { type: "string" }
          },
          required: ["label", "text"]
        },
        minItems: 4,
        maxItems: 4
      },
      recommendations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            desc: { type: "string" }
          },
          required: ["title", "desc"]
        },
        minItems: 3,
        maxItems: 3
      },
      career_paths: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            desc: { type: "string" },
            match: { type: "integer", minimum: 0, maximum: 100 }
          },
          required: ["title", "desc", "match"]
        },
        minItems: 3,
        maxItems: 3
      },
      courses: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            reason: { type: "string" }
          },
          required: ["title", "reason"]
        },
        minItems: 5,
        maxItems: 5
      },
      market_cards: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            text: { type: "string" }
          },
          required: ["label", "text"]
        },
        minItems: 4,
        maxItems: 4
      },
      jobs: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            reason: { type: "string" },
            salary: { type: "string" }
          },
          required: ["title", "reason", "salary"]
        },
        minItems: 5,
        maxItems: 5
      }
    },
    required: ["cv_insights", "recommendations", "career_paths", "courses", "market_cards", "jobs"]
  }
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { cvText } = JSON.parse(event.body);
    if (!cvText || cvText.length < 50) {
      return { statusCode: 400, body: JSON.stringify({ error: "السيرة قصيرة جداً" }) };
    }

    const cv = cvText.substring(0, 3000);
    const archetypesList = Object.entries(ARCHETYPES)
      .map(([id, a]) => `${id}: ${a.name}`)
      .join('\n');

    // Step 1: Archetype + basic info using Tool Use
    const step1 = await httpsPost({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      tools: [ANALYZE_TOOL],
      tool_choice: { type: "tool", name: "submit_cv_analysis" },
      messages: [{
        role: "user",
        content: `أنت محلل مهني سعودي خبير ومباشر. حلل هذه السيرة الذاتية:

${cv}

اختر رقم الشخصية المهنية الأنسب من القائمة:
${archetypesList}

كن مباشراً وجريئاً في الوصف. استخدم لهجة سعودية واقعية.`
      }]
    });

    if (!step1.content || !step1.content[0]) {
      throw new Error('Step 1 failed: ' + JSON.stringify(step1).substring(0, 200));
    }

    const toolUse1 = step1.content.find(c => c.type === 'tool_use');
    if (!toolUse1) {
      throw new Error('No tool_use in step 1');
    }

    const basic = toolUse1.input;
    const archetypeData = ARCHETYPES[basic.archetype_id] || ARCHETYPES[1];

    // Step 2: Detailed insights using Tool Use
    const step2 = await httpsPost({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      tools: [INSIGHTS_TOOL],
      tool_choice: { type: "tool", name: "submit_insights" },
      messages: [{
        role: "user",
        content: `أنت محلل مهني سعودي خبير. السيرة الذاتية:

${cv}

الشخصية المهنية: ${archetypeData.name}
نقاط القوة: ${basic.strengths.join(', ')}
نقاط الضعف: ${basic.weaknesses.join(', ')}

اعطني تحليل مفصل احترافي مع توصيات عملية ووظائف بأرقام رواتب واقعية للسوق السعودي.`
      }]
    });

    if (!step2.content || !step2.content[0]) {
      throw new Error('Step 2 failed');
    }

    const toolUse2 = step2.content.find(c => c.type === 'tool_use');
    if (!toolUse2) {
      throw new Error('No tool_use in step 2');
    }

    const details = toolUse2.input;

    // Safety defaults for any missing arrays
    details.cv_insights = details.cv_insights || [];
    details.career_paths = details.career_paths || [];
    details.courses = details.courses || [];
    details.market_cards = details.market_cards || [];
    details.recommendations = details.recommendations || [];
    details.jobs = details.jobs || [];

    // Add icons to insights
    const insightIcons = ['📈', '🏢', '⚡', '🎯'];
    details.cv_insights = details.cv_insights.map((i, idx) => ({ ...i, icon: insightIcons[idx] || '📊' }));

    const pathIcons = ['🏗️', '🎯', '🚀'];
    details.career_paths = details.career_paths.map((p, idx) => ({ ...p, icon: pathIcons[idx] || '🎯' }));

    details.courses = details.courses.map((c, idx) => ({ ...c, num: String(idx + 1).padStart(2, '0') }));

    // Market cards: first one has progress bar
    details.market_cards = details.market_cards.map((m, idx) => ({
      ...m,
      has_bar: idx === 0,
      bar_pct: idx === 0 ? basic.market_demand : undefined
    }));

    // Combine results
    const result = {
      archetype: archetypeData.name,
      archetype_en: archetypeData.en,
      archetype_emoji: archetypeData.emoji,
      archetype_id: basic.archetype_id,
      description: basic.description,
      market_view: basic.market_view,
      years_experience: basic.years_experience,
      companies_count: basic.companies_count,
      career_trend: basic.career_trend,
      market_demand: basic.market_demand,
      strengths: basic.strengths,
      weaknesses: basic.weaknesses,
      ...details
    };

    console.log('SUCCESS - archetype:', archetypeData.name);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(result)
    };
  } catch (err) {
    console.log('ERROR:', err.message);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
