const API_KEY = "حط_مفتاح_Claude_هنا";

const ARCHETYPES = [
  "حصان الشغل",
  "عبقري لكنه منهك",
  "مدير بدون منصب",
  "صاحب الحضور الخطير",
  "القائد في وقت الأزمات فقط",
  "صانع القادة",
  "ملك العلاقات",
  "روح الفريق",
  "وجه الشركة",
  "الموظف السياسي",
  "سارق المجهود",
  "ضحية كل شي",
  "الضائع مهنيًا",
  "العائد المتردد",
  "التنين النائم",
  "الفلتة",
  "الموهبة المهملة",
  "جاهز بس تنتظر",
  "المنقطع المتمسّك",
  "العرّاب",
  "الخبير الصامت",
  "المتواضع",
  "السائح المهني",
  "صائد الفرص",
  "الصاروخ",
  "المخضرم",
  "الكسول",
  "صاحب الكاريزما",
  "الأسطورة في عقله",
  "المتلاعب",
  "المخطّط اللي ما ينفّذ"
];

exports.handler = async (event) => {

  if(event.httpMethod !== "POST"){
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }

  try{

    const { cvText } = JSON.parse(event.body);

    if(!cvText || cvText.length < 50){

      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "السيرة الذاتية قصيرة جداً"
        })
      };

    }

    const prompt = `
أنت محلل مهني سعودي خبير.

حلل السيرة الذاتية التالية:

${cvText}

اختر شخصية واحدة فقط من هذه الشخصيات:
${ARCHETYPES.join("، ")}

أجب بـ JSON فقط بدون أي نص إضافي.

{
  "archetype": "اسم الشخصية",
  "archetype_en": "English Name",
  "archetype_emoji": "🔥",
  "description": "وصف قوي",
  "market_view": "كيف يراك السوق",
  "years_experience": 5,
  "companies_count": 3,
  "career_trend": "صاعد",
  "market_demand": 88,

  "strengths": [
    "قوة 1",
    "قوة 2",
    "قوة 3",
    "قوة 4",
    "قوة 5"
  ],

  "weaknesses": [
    "ضعف 1",
    "ضعف 2",
    "ضعف 3",
    "ضعف 4",
    "ضعف 5"
  ],

  "cv_insights": [
    {
      "icon":"📈",
      "label":"اتجاه المسيرة",
      "text":"تحليل"
    }
  ],

  "recommendations":[
    {
      "title":"توصية",
      "desc":"شرح"
    }
  ],

  "jobs":[
    {
      "title":"Operations Manager",
      "reason":"سبب مناسب",
      "salary":"18K–25K SAR"
    }
  ]
}
`;

    const response = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01"
        },

        body: JSON.stringify({

          model: "claude-3-5-sonnet-20241022",

          max_tokens: 2500,

          messages: [
            {
              role: "user",
              content: prompt
            }
          ]

        })

      }
    );

    const data = await response.json();

    console.log(data);

    if(!data.content){

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Claude API Error",
          raw: data
        })
      };

    }

    const text = data.content[0].text;

    const clean = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const result = JSON.parse(clean);

    return {

      statusCode: 200,

      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },

      body: JSON.stringify(result)

    };

  }
  catch(err){

    console.log(err);

    return {

      statusCode: 500,

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        error: err.message
      })

    };

  }

};
