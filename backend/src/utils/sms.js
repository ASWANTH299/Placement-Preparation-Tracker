async function sendPasswordResetOtpSms({ to, otp }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  const isPlaceholder = (value = '') => /your|example|change|placeholder/i.test(String(value));

  const hasTwilioConfig = Boolean(
    accountSid &&
    authToken &&
    from &&
    !isPlaceholder(accountSid) &&
    !isPlaceholder(authToken) &&
    !isPlaceholder(from)
  );

  if (!hasTwilioConfig) {
    throw new Error('Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.');
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: `Your Placement Tracker password reset OTP is ${otp}. It expires in 10 minutes.`,
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const payload = await response.json();

  if (!response.ok) {
    const reason = payload?.message || payload?.detail || 'Unknown Twilio error';
    throw new Error(`Twilio SMS failed: ${reason}`);
  }

  return {
    mode: 'twilio',
    sid: payload.sid,
  };
}

module.exports = {
  sendPasswordResetOtpSms,
};
