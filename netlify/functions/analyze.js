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

        console.log('RAW:', raw.substring(0, 500));

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

exports.handler = async (event) => {

  if (event.httpMethod !== "POST") {

    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };

  }

  try {

    const { cvText } = JSON.parse(event.body);

    if (!cvText || cvText.length < 50) {

      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "السيرة قصيرة"
        })
      };

    }

    const cv = cvText.substring(0, 1200);

    // المرحلة الأولى
    const s1 = await httpsPost({

      model: "claude-sonnet-4-6",

      max_tokens: 1200,

      messages: [
        {
          role: "user",
          content: `
حلل هذه السيرة:

${cv}

أجب JSON فقط:

{
  "archetype":"اسم",
  "archetype_en":"Name",
  "archetype_emoji":"🔥",
  "description":"وصف قصير",
  "market_view":"جملة",
  "years_experience":5,
  "companies_count":3,
  "career_trend":"صاعد",
  "market_demand":80,
  "strengths":["1","2","3"],
  "weaknesses":["1","2","3"]
}
`
        }
      ]

    });

    if (!s1.content) {

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Claude المرحلة الأولى فشل",
          raw: s1
        })
      };

    }

    const raw1 = s1.content[0].text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const json1 = raw1.substring(
      raw1.indexOf("{"),
      raw1.lastIndexOf("}") + 1
    );

    const basic = JSON.parse(json1);

    // المرحلة الثانية
    const s2 = await httpsPost({

      model: "claude-sonnet-4-6",

      max_tokens: 1800,

      messages: [
        {
          role: "user",
          content: `
السيرة:
${cv}

الشخصية:
${basic.archetype}

أجب JSON فقط بدون أي كلام إضافي.

{
  "cv_insights":[
    {
      "icon":"📈",
      "label":"اتجاه المسيرة",
      "text":"تحليل"
    },
    {
      "icon":"🏢",
      "label":"جودة الشركات",
      "text":"تحليل"
    },
    {
      "icon":"⚡",
      "label":"طريقة كتابة الإنجازات",
      "text":"تحليل"
    },
    {
      "icon":"🎯",
      "label":"الفجوة الأهم",
      "text":"تحليل"
    }
  ],

  "recommendations":[
    {
      "title":"توصية",
      "desc":"شرح"
    },
    {
      "title":"توصية",
      "desc":"شرح"
    },
    {
      "title":"توصية",
      "desc":"شرح"
    }
  ],

  "career_paths":[
    {
      "icon":"🏗️",
      "title":"مسار",
      "desc":"وصف",
      "match":90
    },
    {
      "icon":"🎯",
      "title":"مسار",
      "desc":"وصف",
      "match":85
    },
    {
      "icon":"🚀",
      "title":"مسار",
      "desc":"وصف",
      "match":80
    }
  ],

  "courses":[
    {
      "num":"01",
      "title":"دورة",
      "reason":"سبب"
    },
    {
      "num":"02",
      "title":"دورة",
      "reason":"سبب"
    },
    {
      "num":"03",
      "title":"دورة",
      "reason":"سبب"
    },
    {
      "num":"04",
      "title":"دورة",
      "reason":"سبب"
    },
    {
      "num":"05",
      "title":"دورة",
      "reason":"سبب"
    }
  ],

  "market_cards":[
    {
      "label":"الطلب",
      "text":"تحليل",
      "has_bar":true,
      "bar_pct":75
    },
    {
      "label":"كيف يراك السوق",
      "text":"تحليل",
      "has_bar":false
    },
    {
      "label":"نقطة التحول",
      "text":"تحليل",
      "has_bar":false
    },
    {
      "label":"التحذير",
      "text":"تحليل",
      "has_bar":false
    }
  ],

  "jobs":[
    {
      "title":"وظيفة",
      "reason":"سبب",
      "salary":"15K-25K SAR"
    },
    {
      "title":"وظيفة",
      "reason":"سبب",
      "salary":"18K-28K SAR"
    },
    {
      "title":"وظيفة",
      "reason":"سبب",
      "salary":"20K-35K SAR"
    }
  ]
}
`
        }
      ]

    });

    if (!s2.content) {

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Claude المرحلة الثانية فشل",
          raw: s2
        })
      };

    }

    const raw2 = s2.content[0].text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const json2 = raw2.substring(
      raw2.indexOf("{"),
      raw2.lastIndexOf("}") + 1
    );

    let details = {};

    try {

      details = JSON.parse(json2);

    } catch(parseErr) {

      console.log("JSON FIX MODE");

      const fixed = json2
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .replace(/\n/g, " ");

      details = JSON.parse(fixed);

    }

    const result = {
      ...basic,
      ...details
    };

    return {

      statusCode: 200,

      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },

      body: JSON.stringify(result)

    };

  } catch (err) {

    console.log('ERROR:', err);

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
