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

      let raw = '';

      res.on('data', chunk => {
        raw += chunk;
      });

      res.on('end', () => {

        try {

          const parsed = JSON.parse(raw);

          resolve(parsed);

        } catch(err){

          reject(err);

        }

      });

    });

    req.on('error', reject);

    req.write(body);

    req.end();

  });

}

function extractJSON(text){

  const clean = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}') + 1;

  return clean.substring(start, end);

}

exports.handler = async (event) => {

  if (event.httpMethod !== 'POST') {

    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };

  }

  try {

    const body = JSON.parse(event.body);

    const cvText = body.cvText;

    if (!cvText || cvText.length < 50) {

      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'السيرة قصيرة'
        })
      };

    }

    const prompt = `
حلل السيرة الذاتية التالية بشكل احترافي.

السيرة:
${cvText.substring(0,1000)}

أجب بـ JSON فقط بدون أي شرح.

{
  "archetype":"اسم الشخصية",
  "archetype_en":"English Name",
  "archetype_emoji":"🔥",

  "description":"وصف احترافي",

  "market_view":"كيف يراك السوق",

  "years_experience":5,

  "companies_count":3,

  "career_trend":"صاعد",

  "market_demand":80,

  "strengths":[
    "ميزة 1",
    "ميزة 2",
    "ميزة 3"
  ],

  "weaknesses":[
    "ضعف 1",
    "ضعف 2",
    "ضعف 3"
  ],

  "cv_insights":[
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

  "career_paths":[
    {
      "icon":"🚀",
      "title":"مسار",
      "desc":"وصف",
      "match":90
    }
  ],

  "courses":[
    {
      "num":"01",
      "title":"دورة",
      "reason":"سبب"
    }
  ],

  "market_cards":[
    {
      "label":"الطلب",
      "text":"تحليل",
      "has_bar":true,
      "bar_pct":80
    }
  ],

  "jobs":[
    {
      "title":"Operations Manager",
      "reason":"سبب",
      "salary":"20K-30K SAR"
    }
  ]
}
`;

    const response = await httpsPost({

      model: 'claude-sonnet-4-6',

      max_tokens: 2000,

      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]

    });

    if (!response.content) {

      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Claude API Error',
          raw: response
        })
      };

    }

    const rawText = response.content[0].text;

    const jsonText = extractJSON(rawText);

    let result;

    try {

      result = JSON.parse(jsonText);

    } catch(parseError){

      console.log(jsonText);

      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'JSON Parse Failed',
          raw: jsonText
        })
      };

    }

    return {

      statusCode: 200,

      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },

      body: JSON.stringify(result)

    };

  } catch(err){

    console.log(err);

    return {

      statusCode: 500,

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        error: err.message
      })

    };

  }

};
