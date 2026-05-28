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

      res.on('data', chunk => raw += chunk);

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

function cleanJSON(text){

  return text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    .replace(/"\s+"/g, '","')
    .trim();

}

exports.handler = async (event) => {

  if (event.httpMethod !== 'POST') {

    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };

  }

  try {

    const { cvText } = JSON.parse(event.body);

    if (!cvText || cvText.length < 50) {

      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'السيرة قصيرة'
        })
      };

    }

    const prompt = `
حلل السيرة التالية:

${cvText.substring(0,1200)}

أجب JSON فقط بدون أي شرح.

{
  "archetype":"اسم الشخصية",
  "archetype_en":"English",
  "archetype_emoji":"🔥",
  "description":"وصف",
  "market_view":"جملة",
  "years_experience":5,
  "companies_count":3,
  "career_trend":"صاعد",
  "market_demand":85,

  "strengths":[
    "نقطة",
    "نقطة",
    "نقطة"
  ],

  "weaknesses":[
    "نقطة",
    "نقطة",
    "نقطة"
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

      max_tokens: 2200,

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
        body: JSON.stringify({
          error: 'Claude API Error',
          raw: response
        })
      };

    }

    let text = response.content[0].text;

    text = cleanJSON(text);

    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;

    const finalJSON = text.substring(start, end);

    let result;

    try {

      result = JSON.parse(finalJSON);

    } catch(err){

      console.log(finalJSON);

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'JSON Parse Failed',
          raw: finalJSON
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
