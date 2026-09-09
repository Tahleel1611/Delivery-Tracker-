const apiUrl = process.env.TRACKING_API_URL || 'http://localhost:3000';
const trackingWebUrl = process.env.TRACKING_WEB_URL || 'http://localhost:3001';
const apiKey = process.env.LEGACY_WEBHOOK_API_KEY || 'local-development-key-change-me';
const orderRef = `ORD-TEST-${Date.now()}`;

async function main() {
  const response = await fetch(`${apiUrl}/api/v1/webhooks/orders/dispatch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({
      orderRef,
      customerPhone: '+15551234567',
      deliveryAddress: '100 Local Test Street',
      status: 'READY_FOR_DISPATCH'
    })
  });

  const body = await response.json();
  if (!response.ok || !body.data?.trackingToken) {
    throw new Error(`API request failed (${response.status}): ${JSON.stringify(body)}`);
  }

  const trackingUrl = `${trackingWebUrl.replace(/\/$/, '')}/t/${body.data.trackingToken}`;
  console.log('\n\u001b[32m\u001b[1m✅ Success!\u001b[0m');
  console.log(`\u001b[1mView your delivery here: ${trackingUrl}\u001b[0m\n`);
}

main().catch((error) => {
  console.error(`\u001b[31m\u001b[1m✖ Test delivery failed:\u001b[0m ${error.message}`);
  process.exitCode = 1;
});
