const https = require('https');

const API_KEY = process.env.ANTHROPIC_API_KEY;

function httpsPost(data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const { cvText } = JSON.parse(event.body);
    if (!cvText || cvText.length < 50) {
      return { statusCode: 400, body: JSON.stringify({ error: "السيرة قصيرة" }) };
    }

    const prompt = `أنت محلل مهني سعودي خبير. حلل السيرة الذاتية التالية واختر شخصية مناسبة:

${cvText.substring(0, 5000)}

اختر شخصية من: حصان الشغل، عبقري لكنه منهك، مدير بدون منصب، صاحب الحضور الخطير، القائد في وقت الأزمات فقط، صانع القادة، ملك العلاقات، روح الفريق، وجه الشركة، الموظف السياسي، سارق المجهود، ضحية كل شي، الضائع مهنياً، العائد المتردد، التنين النائم، الفلتة، الموهبة المهملة، جاهز بس تنتظر، المنقطع المتمسك، العراب، الخبير الصامت، المتواضع، السائح المهني، صائد الفرص، الصاروخ، المخضرم، الكسول، صاحب الكاريزما، الأسطورة في عقله، المتلاعب، المخطط اللي ما ينفذ

أجب بـ JSON فقط بدون أي نص إضافي:
{"archetype":"اسم","archetype_en":"Name","archetype_emoji":"🔥","description":"وصف 3 جمل بلهجة سعودية جريئة","market_view":"كيف يراك السوق","years_experience":5,"companies_count":3,"career_trend":"صاعد","market_demand":80,"strengths":["1","2","3","4","5"],"weaknesses":["1","2","3","4","5"],"cv_insights":[{"icon":"📈","label":"اتجاه المسيرة","text":"تحليل"},{"icon":"🏢","label":"جودة الشركات","text":"تحليل"},{"icon":"⚡","label":"كتابة الإنجازات","text":"تحليل"},{"icon":"🎯","label":"الفجوة الأهم","text":"تحليل"}],"recommendations":[{"title":"1","desc":"شرح"},{"title":"2","desc":"شرح"},{"title":"3","desc":"شرح"}],"career_paths":[{"icon":"🏗️","title":"1","desc":"وصف","match":90},{"icon":"🎯","title":"2","desc":"وصف","match":85},{"icon":"🚀","title":"3","desc":"وصف","match":80}],"courses":[{"num":"01","title":"1","reason":"سبب"},{"num":"02","title":"2","reason":"سبب"},{"num":"03","title":"3","reason":"سبب"},{"num":"04","title":"4","reason":"سبب"},{"num":"05","title":"5","reason":"سبب"}],"market_cards":[{"label":"الطلب","text":"تحليل","has_bar":true,"bar_pct":75},{"label":"كيف يراك السوق","text":"تحليل","has_bar":false},{"label":"نقطة التحول","text":"تحليل","has_bar":false},{"label":"التحذير","text":"تحليل","has_bar":false}],"jobs":[{"title":"1","reason":"سبب","salary":"15K–25K SAR"},{"title":"2","reason":"سبب","salary":"18K–28K SAR"},{"title":"3","reason":"سبب","salary":"20K–35K SAR"},{"title":"4","reason":"سبب","salary":"25K–40K SAR"},{"title":"5","reason":"سبب","salary":"30K–50K SAR"}]}`;

    const data = await httpsPost({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }]
    });

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
