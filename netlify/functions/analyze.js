const https = require('https');

const API_KEY = process.env.ANTHROPIC_API_KEY;

function askClaude(prompt){

  return new Promise((resolve,reject)=>{

    const body = JSON.stringify({

      model:'claude-sonnet-4-6',

      max_tokens:1400,

      messages:[
        {
          role:'user',
          content:prompt
        }
      ]

    });

    const req = https.request({

      hostname:'api.anthropic.com',

      path:'/v1/messages',

      method:'POST',

      headers:{
        'Content-Type':'application/json',
        'x-api-key':API_KEY,
        'anthropic-version':'2023-06-01',
        'Content-Length':Buffer.byteLength(body)
      }

    },res=>{

      let raw='';

      res.on('data',chunk=>{
        raw += chunk;
      });

      res.on('end',()=>{

        try{

          const parsed = JSON.parse(raw);

          const text =
            parsed?.content?.[0]?.text || '';

          resolve(text);

        }
        catch(err){

          console.log(raw);

          reject(err);

        }

      });

    });

    req.on('error',reject);

    req.write(body);

    req.end();

  });

}

function detectArchetype(text){

  const types = [

    'العقل التنفيذي',
    'صاحب الكاريزما',
    'حصان الشغل',
    'المنقذ وقت الأزمات',
    'العبقري المنهك',
    'الموهبة المهملة',
    'الاستراتيجي الصامت',
    'القيادي بالفطرة',
    'صانع العلاقات',
    'الاحترافي المخفي',
    'المخضرم',
    'الصاروخ',
    'المنظم المرعب',
    'المحارب الإداري'

  ];

  for(const t of types){

    if(text.includes(t)){

      return t;

    }

  }

  return 'العقل التنفيذي';

}

exports.handler = async(event)=>{

  try{

    if(event.httpMethod !== 'POST'){

      return{
        statusCode:405,
        body:'Method Not Allowed'
      };

    }

    const body = JSON.parse(event.body);

    const cvText = body.cvText;

    if(!cvText || cvText.length < 50){

      return{
        statusCode:400,
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify({
          error:'السيرة قصيرة'
        })
      };

    }

    const prompt = `
حلل السيرة الذاتية التالية بشكل احترافي.

السيرة:
${cvText.substring(0,1500)}

حدد نوع الشخصية المهنية الحقيقي من القائمة التالية فقط:

- العقل التنفيذي
- صاحب الكاريزما
- حصان الشغل
- المنقذ وقت الأزمات
- العبقري المنهك
- الموهبة المهملة
- الاستراتيجي الصامت
- القيادي بالفطرة
- صانع العلاقات
- الاحترافي المخفي
- المخضرم
- الصاروخ
- المنظم المرعب
- المحارب الإداري

ثم اشرح:

1- لماذا هذه الشخصية
2- نقاط القوة
3- نقاط الضعف
4- كيف يراه السوق
5- الوظائف المناسبة
6- أخطر نقطة مهنية لديه

مهم:
- لا تستخدم JSON
- لا تستخدم markdown كثير
- اكتب بشكل واضح وقوي
`;

    const analysis = await askClaude(prompt);

    const archetype = detectArchetype(analysis);

    return{

      statusCode:200,

      headers:{
        'Content-Type':'application/json',
        'Access-Control-Allow-Origin':'*'
      },

      body:JSON.stringify({

        success:true,

        archetype,

        analysis

      })

    };

  }
  catch(err){

    console.log(err);

    return{

      statusCode:500,

      headers:{
        'Content-Type':'application/json'
      },

      body:JSON.stringify({
        error:err.message
      })

    };

  }

};
