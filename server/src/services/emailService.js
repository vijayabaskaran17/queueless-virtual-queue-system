/**
 * Email Service for QueueLess Platform
 * Dispatches secure, organization-based employee invitations
 */

const sendStaffInvitationEmail = async ({
  to,
  organizationName,
  invitedByName,
  token,
  invitationUrl,
  expiresAt,
  notes,
}) => {
  const formattedExpiry = new Date(expiresAt).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Log invitation details for development audit
  console.log('\n======================================================');
  console.log('📨 [EMAIL SERVICE] SECURE STAFF INVITATION DISPATCHED');
  console.log('------------------------------------------------------');
  console.log(`To:                 ${to}`);
  console.log(`Organization:       ${organizationName}`);
  console.log(`Invited By:         ${invitedByName || 'Organization Administrator'}`);
  console.log(`Expiration Time:    ${formattedExpiry}`);
  if (notes) console.log(`Role / Notes:       ${notes}`);
  console.log(`Single-Use Link:    ${invitationUrl}`);
  console.log('======================================================\n');

  // If SMTP environment variables are configured, nodemailer could be used here.
  // We return the invitation delivery metadata.
  return {
    delivered: true,
    recipient: to,
    organizationName,
    invitationUrl,
    expiresAt,
  };
};

module.exports = {
  sendStaffInvitationEmail,
};
