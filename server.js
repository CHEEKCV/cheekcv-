```js
const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();

app.use(cors());

app.use(express.json({
  limit:'10mb'
}));

const API_KEY = process.env.ANTHROPIC_API_KEY;

function askClaude(prompt){

  return new Promise((resolve,reject)=>{

    const body = JSON.stringify({

      model:'claude-sonnet-4-20250514',

      max_tokens:1800,

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

app.post('/analyze', async(req,res)=>{

  try{

    const cvText = req.body.cvText;

    if(!cvText){

      return res.status(400).json({
        success:false,
        error:'No CV text'
      });

    }

    const prompt = `
حلل السيرة الذاتية التالية بشكل احترافي وعميق.

السيرة:
${cvText}

حدد الشخصية المهنية الحقيقية من القائمة التالية فقط:

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

ثم حلل:

1- لماذا هذه الشخصية
2- نقاط القوة
3- نقاط الضعف
4- كيف يراه السوق
5- الوظائف المناسبة
6- أخطر نقطة مهنية لديه

اكتب بأسلوب قوي وعميق واحترافي.
`;

    const analysis =
    await askClaude(prompt);

    const archetype =
    detectArchetype(analysis);

    res.json({

      success:true,

      archetype,

      analysis

    });

  }
  catch(err){

    console.log(err);

    res.status(500).json({

      success:false,

      error:err.message

    });

  }

});

const PORT =
process.env.PORT || 3000;

app.listen(PORT,()=>{

  console.log('Server running on port '+PORT);

});
```
