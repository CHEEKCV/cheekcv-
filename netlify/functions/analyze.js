const https = require('https');

const API_KEY = process.env.ANTHROPIC_API_KEY;

function callClaude(prompt) {

  return new Promise((resolve, reject) => {

    const body = JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const req = https.request({

      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }

    }, (res) => {

      let raw = '';

      res.on('data', chunk => {
        raw += chunk;
      });

      res.on('end', () => {

        try {

          const parsed = JSON.parse(raw);

          resolve(parsed.content[0].text);

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
        body: JSON.stringify({
          error: 'CV too short'
        })
      };

    }

    const prompt = `
حلل هذه السيرة الذاتية بشكل احترافي.

السيرة:
${cvText.substring(0,1200)}

أعطني:
1- نوع الشخصية المهنية
2- وصف قوي
3- نقاط القوة
4- نقاط الضعف
5- كيف يراه السوق
6- توصيات تطوير
7- وظائف تناسبه

مهم:
لا تستخدم JSON.
اكتب بشكل عادي ومنظم.
`;

    const text = await callClaude(prompt);

    return {

      statusCode: 200,

      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },

      body: JSON.stringify({
        success: true,
        analysis: text
      })

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
