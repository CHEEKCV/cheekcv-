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

exports.handler = async (event) => {

  try {

    const body = JSON.parse(event.body);

    const cvText = body.cvText;

    if (!cvText || cvText.length < 50) {

      return {
        statusCode: 400,
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

  "strengths":["","",""],

  "weaknesses":["","",""],

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

    const rawText = response.content[0].text;

    const jsonText = extractJSON(rawText);

    const result = JSON.parse(jsonText);

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
