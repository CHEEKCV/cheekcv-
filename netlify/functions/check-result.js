const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  const jobId = event.queryStringParameters?.id;
  if (!jobId || !/^[a-f0-9-]{36}$/.test(jobId)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid job ID" }) };
  }

  try {
    const store = getStore({
      name: 'cv-results',
      siteID: process.env.SITE_ID,
      token: process.env.NETLIFY_TOKEN
    });
    const result = await store.get(jobId, { type: 'json' });

    if (!result) {
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'pending' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (err) {
    console.log('check-result error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ status: 'error', error: err.message }) };
  }
};
