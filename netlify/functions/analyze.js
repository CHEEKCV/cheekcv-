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

          resolve(JSON.parse(raw));

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

async function askClaude(prompt, tokens = 1200){

  const response = await httpsPost({

    model: 'claude-sonnet-4-6',

    max_tokens: tokens,

    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]

  });

  if (!response.content) {

    throw new Error('Claude API Error');

  }

  const rawText = response.content[0].text;

  const jsonText = extractJSON(rawText);

  return JSON.parse(jsonText);

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

    const cv = cvText.substring(0,1000);

    // PART 1
    const part1 = await askClaude(`
حلل السيرة التالية:

${cv}

أجب JSON فقط:

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
  ]
}
`, 900);

    // PART 2
    const part2 = await askClaude(`
حلل السيرة التالية:

${cv}

أجب JSON فقط:

{
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
  ]
}
`, 1000);

    // PART 3
    const part3 = await askClaude(`
حلل السيرة التالية:

${cv}

أجب JSON فقط:

{
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
`, 1000);

    const result = {
      ...part1,
      ...part2,
      ...part3
    };

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
