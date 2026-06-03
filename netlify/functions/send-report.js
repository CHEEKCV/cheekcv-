const https = require('https');

const BREVO_API_KEY = process.env.BREVO_API_KEY;

function brevoPost(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch(e) { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function sec(title, content) {
  return `<div style="background:#fff;border:2px solid #1a1a1a;border-top:none;padding:20px;">
    <h3 style="font-size:14px;font-weight:800;margin:0 0 12px;padding-bottom:8px;border-bottom:1.5px solid #e8e8e0;">${title}</h3>
    ${content}
  </div>`;
}

function buildEmailHTML(d) {
  const strengths  = (d.strengths||[]).map(s=>`<li style="margin-bottom:8px;">${s}</li>`).join('');
  const weaknesses = (d.weaknesses||[]).map(w=>`<li style="margin-bottom:8px;">${w}</li>`).join('');
  const recs       = (d.recommendations||[]).map(r=>`<li style="margin-bottom:8px;"><strong>${r.title||''}</strong> — ${r.desc||r.description||''}</li>`).join('');
  const paths      = (d.career_paths||[]).map(p=>`<li style="margin-bottom:8px;"><strong>${p.title||''}</strong> — ${p.desc||p.description||''} <span style="background:#1a1a1a;color:#F0C93A;padding:2px 8px;border-radius:99px;font-size:11px;">توافق ${p.match||0}%</span></li>`).join('');
  const courses    = (d.courses||[]).map(c=>`<li style="margin-bottom:10px;"><strong>${c.title||''}</strong><br><span style="color:#8B6914;font-size:13px;">${c.reason||''}</span></li>`).join('');
  const jobs       = (d.jobs||[]).map(j=>`<li style="margin-bottom:8px;">${j.title} — <strong>${j.salary}</strong><br><span style="color:#666;font-size:12px;">${j.reason||''}</span></li>`).join('');
  const market     = (d.market_cards||[]).map(m=>`<li style="margin-bottom:8px;"><strong>${m.label||''}</strong><br>${m.text||''}</li>`).join('');
  const insights   = (d.cv_insights||[]).map(i=>`<li style="margin-bottom:8px;"><strong>${i.label||''}</strong><br>${i.text||''}</li>`).join('');

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAF8;font-family:Arial,sans-serif;direction:rtl;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">

  <div style="background:#1a1a1a;border-radius:16px 16px 0 0;padding:24px;text-align:center;">
    <p style="color:#F0C93A;font-size:26px;font-weight:800;margin:0;">شيًك</p>
    <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:4px 0 0;">تقريرك المهني الشخصي</p>
  </div>

  <div style="background:#fff;border:2px solid #1a1a1a;padding:24px;text-align:center;">
    <div style="display:inline-block;background:#FFF3CD;border:1.5px solid #F0C93A;border-radius:99px;padding:4px 14px;font-size:12px;font-weight:600;color:#8B6914;margin-bottom:16px;">🎭 شخصيتك المهنية</div>
    <h1 style="font-size:28px;font-weight:800;color:#1a1a1a;margin:0 0 12px;">${d.archetype_emoji || '🎭'} ${d.archetype || ''}</h1>
    <p style="font-size:14px;color:#555;line-height:1.8;margin:0;">${d.description || ''}</p>
  </div>

  <div style="background:#fff;border:2px solid #1a1a1a;border-top:none;padding:16px;">
    <table width="100%" style="border-collapse:collapse;">
      <tr>
        <td style="text-align:center;padding:12px;border-left:1px solid #eee;">
          <span style="font-size:22px;font-weight:800;display:block;">${d.years_experience || 0}+</span>
          <span style="font-size:10px;color:#9b9b9b;font-weight:600;">سنوات خبرة</span>
        </td>
        <td style="text-align:center;padding:12px;border-left:1px solid #eee;">
          <span style="font-size:22px;font-weight:800;display:block;">${d.companies_count || 0}</span>
          <span style="font-size:10px;color:#9b9b9b;font-weight:600;">شركات</span>
        </td>
        <td style="text-align:center;padding:12px;">
          <span style="font-size:22px;font-weight:800;display:block;">${d.market_demand || 0}%</span>
          <span style="font-size:10px;color:#9b9b9b;font-weight:600;">الطلب في السوق</span>
        </td>
      </tr>
    </table>
  </div>

  ${sec('⚡ نقاط قوتك', `<ul style="margin:0;padding-right:20px;font-size:14px;line-height:1.8;">${strengths}</ul>`)}
  ${sec('🚨 نقاط الضعف', `<ul style="margin:0;padding-right:20px;font-size:14px;line-height:1.8;">${weaknesses}</ul>`)}
  ${sec('📊 تحليل سيرتك الذاتية', `<ul style="margin:0;padding-right:20px;font-size:14px;line-height:1.8;">${insights}</ul>`)}
  ${sec('🎯 توصيات التطوير', `<ul style="margin:0;padding-right:20px;font-size:14px;line-height:1.8;">${recs}</ul>`)}
  ${sec('🔮 المسارات المهنية', `<ul style="margin:0;padding-right:20px;font-size:14px;line-height:1.8;">${paths}</ul>`)}
  ${sec('📚 الدورات الموصى بها', `<ul style="margin:0;padding-right:20px;font-size:14px;line-height:1.8;">${courses}</ul>`)}
  ${sec('📈 تقييم السوق', `<ul style="margin:0;padding-right:20px;font-size:14px;line-height:1.8;">${market}</ul>`)}
  ${sec('💰 الوظائف والرواتب', `<ul style="margin:0;padding-right:20px;font-size:14px;line-height:1.8;">${jobs}</ul>`)}

  <div style="background:#1a1a1a;border-radius:0 0 16px 16px;padding:16px;text-align:center;">
    <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;">شيًك · cheekcv.xyz · صُنع بـ ❤️ في الرياض</p>
  </div>

</div>
</body>
</html>`;
}

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { email, reportData } = JSON.parse(event.body || '{}');
    if (!email || !reportData) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing data' }) };

    const html = buildEmailHTML(reportData);
    const archetype = reportData.archetype || 'شخصيتك المهنية';
    const emoji = reportData.archetype_emoji || '🎭';

    const result = await brevoPost({
      sender: { name: 'شيًك', email: 'noreply@cheekcv.xyz' },
      to: [{ email }],
      subject: `تقريرك المهني جاهز — ${emoji} ${archetype}`,
      htmlContent: html
    });

    if (result.status === 201 || result.status === 200) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: result.body?.message || 'فشل الإرسال' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
