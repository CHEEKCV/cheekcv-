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

          console.log('RAW API RESPONSE:', raw);

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

  let clean = text.trim();

  clean = clean.replace(/```json/g, '');
  clean = clean.replace(/```/g, '');

  // إزالة الـ escape
  clean = clean.replace(/\\"/g, '"');
  clean = clean.replace(/\\\\n/g, '');
  clean = clean.replace(/\\n/g, '');
  clean = clean.replace(/\\\\/g, '\\');

  // إذا النص String كامل
  if (
    clean.startsWith('"') &&
    clean.endsWith('"')
  ) {
    clean = clean.slice(1, -1);
  }

  const first = clean.indexOf('{');
  const last = clean.lastIndexOf('}');

  if (first === -1 || last === -1) {
    throw new Error('No JSON found');
  }

  return clean.substring(first, last + 1);

}

exports.handler = async (event) => {

  try {

    if (event.httpMethod !== 'POST') {

      return {
        statusCode: 405,
        body: 'Method Not Allowed'
      };

    }

    const body = JSON.parse(event.body);

    const cvText = body.cvText;

    if (!cvText || cvText.length < 50) {

      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'CV too short'
        })
      };

    }

    const prompt = `
حلل هذه السيرة الذاتية بشكل احترافي ومختصر.

${cvText.substring(0,1200)}

أجب JSON فقط بدون markdown.

{
  "archetype":"",
  "archetype_en":"",
  "archetype_emoji":"",

  "description":"",

  "market_view":"",

  "years_experience":0,

  "companies_count":0,

  "career_trend":"",

  "market_demand":0,

  "strengths":[
    "",
    "",
    ""
  ],

  "weaknesses":[
    "",
    "",
    ""
  ],

  "cv_insights":[
    {
      "icon":"📈",
      "label":"",
      "text":""
    }
  ],

  "recommendations":[
    {
      "title":"",
      "desc":""
    }
  ],

  "jobs":[
    {
      "title":"",
      "reason":"",
      "salary":""
    }
  ]
}
`;

    const response = await httpsPost({

      model: 'claude-sonnet-4-6',

      max_tokens: 1400,

      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]

    });

    if (!response.content || !response.content[0]) {

      console.log(response);

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

    let result;

    try {

      const jsonText = extractJSON(rawText);

      result = JSON.parse(jsonText);

    } catch(err){

      console.log('BROKEN JSON:', rawText);

      return {

        statusCode: 500,

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          error: 'Claude JSON Broken',
          raw: rawText
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

    console.log('FINAL ERROR:', err);

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
