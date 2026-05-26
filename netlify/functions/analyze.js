const API_KEY = "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";

const ARCHETYPES = [
  "حصان الشغل", "عبقري لكنه منهك", "مدير بدون منصب",
  "صاحب الحضور الخطير", "القائد في وقت الأزمات فقط", "صانع القادة",
  "ملك العلاقات", "روح الفريق", "وجه الشركة", "الموظف السياسي",
  "سارق المجهود", "ضحية كل شي", "الضائع مهنيًا", "العائد المتردد",
  "التنين النائم", "الفلتة", "الموهبة المهملة", "جاهز بس تنتظر",
  "المنقطع المتمسّك", "العرّاب", "الخبير الصامت", "المتواضع",
  "السائح المهني", "صائد الفرص", "الصاروخ", "المخضرم",
  "الكسول", "صاحب الكاريزما", "الأسطورة في عقله", "المتلاعب",
  "المخطّط اللي ما ينفّذ"
];

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { cvText } = JSON.parse(event.body);

    if (!cvText || cvText.length < 50) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "السيرة الذاتية قصيرة جداً" })
      };
    }

    const prompt = `أنت محلل مهني سعودي خبير. حلل السيرة الذاتية التالية وأعطني تحليلاً مفصلاً.

السيرة الذاتية:
${cvText}

قائمة الشخصيات المتاحة:
${ARCHETYPES.join("، ")}

أجب بـ JSON فقط بالشكل التالي (بدون أي نص خارج الـ JSON):
{
  "archetype": "اسم الشخصية من القائمة",
  "archetype_en": "The Archetype Name in English",
  "archetype_emoji": "إيموجي يعبر عن الشخصية",
  "description": "وصف سينمائي للشخصية من 3 جمل بلهجة سعودية خليجية مباشر وجريء",
  "market_view": "جملة واحدة كيف يراك السوق",
  "years_experience": رقم,
  "companies_count": رقم,
  "career_trend": "صاعد أو واقف أو نازل",
  "market_demand": رقم من 0 لـ 100,
  "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3", "نقطة قوة 4", "نقطة قوة 5"],
  "weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2", "نقطة ضعف 3", "نقطة ضعف 4", "نقطة ضعف 5"],
  "cv_insights": [
    {"icon": "📈", "label": "اتجاه المسيرة", "text": "تحليل مسار الشخص"},
    {"icon": "🏢", "label": "جودة الشركات", "text": "تحليل الشركات"},
    {"icon": "⚡", "label": "طريقة كتابة الإنجازات", "text": "تحليل الكتابة"},
    {"icon": "🎯", "label": "الفجوة الأهم", "text": "أهم ملاحظة"}
  ],
  "recommendations": [
    {"title": "عنوان التوصية 1", "desc": "شرح مختصر"},
    {"title": "عنوان التوصية 2", "desc": "شرح مختصر"},
    {"title": "عنوان التوصية 3", "desc": "شرح مختصر"}
  ],
  "career_paths": [
    {"icon": "🏗️", "title": "المسار 1", "desc": "وصف", "match": 90},
    {"icon": "🎯", "title": "المسار 2", "desc": "وصف", "match": 85},
    {"icon": "🚀", "title": "المسار 3", "desc": "وصف", "match": 80}
  ],
  "courses": [
    {"num": "01", "title": "اسم الدورة", "reason": "سبب التوصية"},
    {"num": "02", "title": "اسم الدورة", "reason": "سبب التوصية"},
    {"num": "03", "title": "اسم الدورة", "reason": "سبب التوصية"},
    {"num": "04", "title": "اسم الدورة", "reason": "سبب التوصية"},
    {"num": "05", "title": "اسم الدورة", "reason": "سبب التوصية"}
  ],
  "market_cards": [
    {"label": "الطلب على ملفك", "text": "تحليل", "has_bar": true, "bar_pct": 75},
    {"label": "كيف يراك السوق", "text": "تحليل", "has_bar": false},
    {"label": "نقطة التحول", "text": "تحليل", "has_bar": false},
    {"label": "⚠️ التحذير", "text": "تحليل", "has_bar": false}
  ],
  "jobs": [
    {"title": "المسمى الوظيفي", "reason": "سبب", "salary": "15K–25K SAR/شهر"},
    {"title": "المسمى الوظيفي", "reason": "سبب", "salary": "18K–28K SAR/شهر"},
    {"title": "المسمى الوظيفي", "reason": "سبب", "salary": "20K–35K SAR/شهر"},
    {"title": "المسمى الوظيفي", "reason": "سبب", "salary": "25K–40K SAR/شهر"},
    {"title": "المسمى الوظيفي", "reason": "سبب", "salary": "30K–50K SAR/شهر"}
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
      body: JSON.stringify({ error: "حصل خطأ في التحليل، حاول مرة ثانية" })
    };
  }
};
