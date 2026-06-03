const https = require('https');

const RESEND_API_KEY = process.env.RESEND_API_KEY;

function resendPost(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + RESEND_API_KEY,
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch(e) { reject(new Error('Invalid response')); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function buildEmailHTML(d) {
  const strengths = (d.strengths || []).map(s => `<li>${s}</li>`).join('');
  const weaknesses = (d.weaknesses || []).map(w => `<li>${w}</li>`).join('');
  const recs = (d.recommendations || []).map(r => `<li><strong>${r.title || ''}</strong> — ${r.desc || r.description || ''}</li>`).join('');
  const jobs = (d.jobs || []).map(j => `<li>${j.title} — <strong>${j.salary}</strong></li>`).join('');

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'IBM Plex Sans Arabic', Arial, sans-serif; background: #FAFAF8; color: #1a1a1a; margin: 0; padding: 0; direction: rtl; }
  .wrap { max-width: 600px; margin: 0 auto; padding: 32px 20px; }
  .header { background: #1a1a1a; border-radius: 16px 16px 0 0; padding: 28px; text-align: center; }
  .logo { color: #F0C93A; font-size: 28px; font-weight: 800; margin: 0; }
  .hero { background: #fff; border: 2px solid #1a1a1a; padding: 24px; text-align: center; }
  .archetype { font-size: 32px; font-weight: 800; margin: 8px 0; }
  .archetype span { background: #F0C93A; padding: 0 10px; border-radius: 8px; }
  .badge { display: inline-block; background: #FFF3CD; border: 1.5px solid #F0C93A; border-radius: 99px; padding: 4px 14px; font-size: 12px; font-weight: 600; color: #8B6914; margin-bottom: 16px; }
  .section { background: #fff; border: 2px solid #1a1a1a; border-radius: 12px; padding: 20px; margin: 12px 0; }
  .section h3 { font-size: 14px; font-weight: 800; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1.5px solid #e8e8e0; color: #1a1a1a; }
  ul { margin: 0; padding-right: 20px; }
  li { font-size: 14px; line-height: 1.9; margin-bottom: 6px; }
  .stat-row { display: flex; gap: 12px; margin: 12px 0; }
  .stat { flex: 1; background: #FAFAF8; border: 2px solid #1a1a1a; border-radius: 10px; padding: 12px; text-align: center; }
  .stat-num { font-size: 22px; font-weight: 800; display: block; }
  .stat-label { font-size: 10px; color: #9b9b9b; font-weight: 600; }
  .footer { background: #1a1a1a; border-radius: 0 0 16px 16px; padding: 20px; text-align: center; color: rgba(255,255,255,0.6); font-size: 12px; }
  .cta { display: inline-block; background: #F0C93A; color: #1a1a1a; font-weight: 800; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-size: 15px; margin: 16px 0; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <p class="logo">شيًك</p>
    <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:4px 0 0;">تقريرك المهني الشخصي</p>
  </div>

  <div class="hero">
    <div class="badge">🎭 شخصيتك المهنية</div>
    <div class="archetype">${(d.archetype || '').split(' ').slice(0, -1).join(' ')} <span>${(d.archetype || '').split(' ').pop()}</span></div>
    <p style="font-size:14px;color:#555;line-height:1.8;margin:12px 0 0;">${d.description || ''}</p>
  </div>

  <div class="section">
    <table width="100%"><tr>
      <td style="text-align:center;padding:10px;"><span style="font-size:22px;font-weight:800;">${d.years_experience || 0}+</span><br><span style="font-size:10px;color:#9b9b9b;font-weight:600;">سنوات خبرة</span></td>
      <td style="text-align:center;padding:10px;"><span style="font-size:22px;font-weight:800;">${d.companies_count || 0}</span><br><span style="font-size:10px;color:#9b9b9b;font-weight:600;">شركات</span></td>
      <td style="text-align:center;padding:10px;"><span style="font-size:22px;font-weight:800;">${d.market_demand || 0}%</span><br><span style="font-size:10px;color:#9b9b9b;font-weight:600;">الطلب في السوق</span></td>
    </tr></table>
  </div>

  <div class="section">
    <h3>⚡ نقاط قوتك</h3>
    <ul>${strengths}</ul>
  </div>

  <div class="section">
    <h3>🚨 نقاط الضعف</h3>
    <ul>${weaknesses}</ul>
  </div>

  <div class="section">
    <h3>🎯 توصيات التطوير</h3>
    <ul>${recs}</ul>
  </div>

  <div class="section">
    <h3>💰 الوظائف والرواتب المتاحة</h3>
    <ul>${jobs}</ul>
  </div>

  <div style="text-align:center;margin:20px 0;">
    <a class="cta" href="https://cheekcv.xyz/ascend_report_dynamic.html">افتح التقرير الكامل 🔓</a>
  </div>

  <div class="footer">
    <p>شيًك · صُنع بـ ❤️ في الرياض · cheekcv.xyz</p>
  </div>
</div>
</body>
</html>`;
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { email, reportData } = JSON.parse(event.body || '{}');

    if (!email || !reportData) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing email or report data' }) };
    }

    const html = buildEmailHTML(reportData);

    const result = await resendPost({
      from: 'شيًك <report@cheekcv.xyz>',
      to: [email],
      subject: `تقريرك المهني جاهز — أنت ${reportData.archetype || 'شخصيتك المهنية'} ${reportData.archetype_emoji || '🎭'}`,
      html
    });

    if (result.id) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: result.message || 'فشل الإرسال' }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
