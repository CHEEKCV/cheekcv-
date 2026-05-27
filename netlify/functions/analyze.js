const https = require('https');

console.log('FUNCTION LOADED - KEY:', !!process.env.ANTHROPIC_API_KEY);

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
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        console.log('ANTHROPIC RAW:', raw.substring(0, 500));
        resolve(JSON.parse(raw));
      });
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
    console.log('HANDLER CALLED - KEY EXISTS:', !!API_KEY);
    const { cvText } = JSON.parse(event.body);
    console.log('CV TEXT LENGTH:', cvText ? cvText.length : 0);
    
    if (!cvText || cvText.length < 50) {
      return { statusCode: 400, body: JSON.stringify({ error: "السيرة قصيرة" }) };
    }

    const prompt = `أنت محلل مهني سعودي خبير. حلل السيرة الذاتية التالية واختر شخصية مناسبة:

${cvText.substring(0, 5000)}

اختر شخصية من: حصان الشغل، عبقري لكنه منهك، مدير بدون منصب، صاحب الحضور الخطير، القائد في وقت الأزمات فقط، صانع القادة، ملك العلاقات، روح الفريق، وجه الشركة، الموظف السياسي، سارق المجهود، ضحية كل شي، الضائع مهنياً، العائد المتردد، التنين النائم، الفلتة، الموهبة المهملة، جاهز بس تنتظر، المنقطع المتمسك، العراب، الخبير الصامت، المتواضع، السائح المهني، صائد الفرص، الصاروخ، المخضرم، الكسول، صاحب الكاريزما، الأسطورة في عقله، المتلاعب، المخطط اللي ما ينفذ

أجب بـ JSON فقط:
{"archetype":"اسم","archetype_en":"Name","archetype_emoji":"🔥","d
