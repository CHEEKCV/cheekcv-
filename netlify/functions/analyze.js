const API_KEY = "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";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const { cvText } = JSON.parse(event.body);
    if (!cvText || cvText.length < 50) {
      return { statusCode: 400, body: JSON.stringify({ error: "السيرة قصيرة" }) };
    }
    const prompt = `أنت محلل مهني سعودي خبير. حلل السيرة الذاتية التالية:

${cvText}

اختر شخصية من: حصان الشغل، عبقري لكنه منهك، مدير بدون منصب، صاحب الحضور الخطير، القائد في وقت الأزمات فقط، صانع القادة، ملك العلاقات، روح الفريق، وجه الشركة، الموظف السياسي، سارق المجهود، ضحية كل شي، الضائع مهنياً، العائد المتردد، التنين النائم، الفلتة، الموهبة المهملة، جاهز بس تنتظر، المنقطع المتمسك، العراب، الخبير الصامت، المتواضع، السائح المهني، صائد الفرص، الصاروخ، المخضرم، الكسول، صاحب الكاريزما، الأسطورة في عقله، المتلاعب، المخطط اللي ما ينفذ

أجب بـ JSON فقط:
{
  "archetype": "اسم الشخصية",
  "archetype_en": "English Name",
  "archetype_emoji": "🔥",
  "description": "وصف 3 جمل بلهجة سعودية جريئة",
  "market_view": "كيف يراك السوق",
  "years_experience": 5,
  "companies_count": 3,
  "career_trend": "صاعد",
  "market_demand": 80,
  "strengths": ["قوة 1","قوة 2","قوة 3","قوة 4","قوة 5"],
  "weaknesses": ["ضعف 1","ضعف 2","ضعف 3","ضعف 4","ضعف 5"],
  "cv_insights": [
    {"icon":"📈","label":"اتجاه المسيرة","text":"تحليل"},
    {"icon":"🏢","label":"جودة الشركات","text":"تحليل"},
    {"icon":"⚡","label":"كتابة الإنجازات","text":"تحليل"},
    {"icon":"🎯","label":"الفجوة الأهم","text":"تحليل"}
  ],
  "recommendations": [
    {"title":"توصية 1","desc":"شرح"},
    {"title":"توصية 2","desc":"شرح"},
    {"title":"توصية 3","desc":"شرح"}
  ],
  "career_paths": [
    {"icon":"🏗️","title":"مسار 1","desc":"وصف","match":90},
    {"icon":"🎯","title":"مسار 2","desc":"وصف","match":85},
    {"icon":"🚀","title":"مسار 3","desc":"وصف","match":80}
  ],
  "courses": [
    {"num":"01","title":"دورة 1","reason":"سبب"},
    {"num":"02","title":"دورة 2","reason":"سبب"},
    {"num":"03","title":"دورة 3","reason":"سبب"},
    {"num":"04","title":"دورة 4","reason":"سبب"},
    {"num":"05","title":"دورة 5","reason":"سبب"}
  ],
  "market_cards": [
    {"label":"الطلب على ملفك","text":"تحليل","has_bar":true,"bar_pct":75},
    {"label":"كيف يراك السوق","text":"تحليل","has_bar":false},
    {"label":"نقطة التحول","text":"تحليل","has_bar":false},
    {"label":"التحذير","text":"تحليل","has_bar":false}
  ],
  "jobs": [
    {"title":"وظيفة 1","reason":"سبب","salary":"15K–25K SAR/شهر"},
    {"title":"وظيفة 2","reason":"سبب","salary":"18K–28K SAR/شهر"},
    {"title":"وظيفة 3","reason":"سبب","salary":"20K–35K SAR/شهر"},
    {"title":"وظيفة 4","reason":"سبب","salary":"25K–40K SAR/شهر"},
    {"title":"وظيفة 5","reason":"سبب","salary":"30K–50K SAR/شهر"}
  ]
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text;
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(result)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
