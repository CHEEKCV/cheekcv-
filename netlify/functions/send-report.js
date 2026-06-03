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

function buildEmailHTML(d) {
  const strengths = (d.strengths || []).map(s => `<li style="margin-bottom:8px;">${s}</li>`).join('');
  const weaknesses = (d.weaknesses || []).map(w => `<li style="margin-bottom:8px;">${w}</li>`).join('');
  const recs = (d.recommendations || []).map(r => `<li style="margin-bottom:8px;"><strong>${r.title || ''}</strong> — ${r.desc || r.description || ''}</li>`).join('');
  const jobs = (d.jobs || []).map(j => `<li style="margin-bottom:8px;">${j.title} — <strong>${j.salary}</strong></li>`).join('');

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

  <div style="background:#fff;border:2px solid #1a1a1a;border-top:none;padding:20px;margin-bottom:2px;">
    <h3 style="font-size:14px;font-weight:800;margin:0 0 12px;padding-bottom:8px;border-bottom:1.5px solid #e8e8e0;">⚡ نقاط قوتك</h3>
    <ul style="margin:0;padding-right:20px;font-size:14px;line-height:1.8;">${strengths}</ul>
  </div>

  <div style="background:#fff;border:2px solid #1a1a1a;border-top:none;padding:20px;margin-bottom:2px;">
    <h3 style="font-size:14px;font-weight:800;margin:0 0 12px;padding-bottom:8px;border-bottom:1.5px solid #e8e8e0;">🚨 نقاط الضعف</h3>
    <ul style="margin:0;padding-right:20px;font-size:14px;line-height:1.8;">${weaknesses}</ul>
  </div>

  <div style="background:#fff;border:2px solid #1a1a1a;border-top:none;padding:20px;margin-bottom:2px;">
    <h3 style="font-size:14px;font-weight:800;margin:0 0 12px;padding-bottom:8px;border-bottom:1.5px solid #e8e8e0;">🎯 توصيات التطوير</h3>
    <ul style="margin:0;padding-right:20px;font-size:14px;line-height:1.8;">${recs}</ul>
  </div>

  <div style="background:#fff;border:2px solid #1a1a1a;border-top:none;padding:20px;">
    <h3 style="font-size:14px;font-weight:800;margin:0 0 12px;padding-bottom:8px;border-bottom:1.5px solid #e8e8e0;">💰 الوظائف والرواتب</h3>
    <ul style="margin:0;padding-right:20px;font-size:14px;line-height:1.8;">${jobs}</ul>
  </div>

  <div style="text-align:center;margin:20px 0;">
    <a href="https://cheekcv.xyz" style="display:inline-block;background:#F0C93A;color:#1a1a1a;font-weight:800;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:15px;">افتح التقرير الكامل 🔓</a>
  </div>

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
