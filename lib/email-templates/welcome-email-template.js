export function sendWelcomeEmailTemplate(user, accountNumber) {
  const year = new Date().getFullYear();
  const appUrl = process.env.APP_URL || "https://nfv-web-ing-uk.pro";

  return `
  <div style="margin:0;padding:0;background:#f6f8fb;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr>
        <td align="center" style="padding:0 14px;">
          <table width="100%" cellpadding="0" cellspacing="0"
            style="max-width:560px;background:#ffffff;border-radius:16px;
                   border:1px solid rgba(0,0,0,0.08);overflow:hidden;
                   font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">

            <!-- HEADER -->
            <tr>
              <td style="background:#033d75;padding:20px;">
                <div style="color:#ffffff;">
                  <div style="font-size:18px;font-weight:700;letter-spacing:-0.02em;">NFV Wealth</div>
                  <div style="font-size:12px;opacity:0.85;margin-top:4px;">Welcome — Your Account is Ready 🎉</div>
                </div>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:22px 20px;">

                <p style="margin:0 0 16px;font-size:15px;color:#1a1a2e;font-weight:600;">
                  Welcome, ${user.name} ${user.lastname}! 🎉
                </p>
                <p style="margin:0 0 20px;font-size:14px;color:#667085;line-height:1.65;">
                  Your NFV Wealth account has been successfully verified and is now active.
                  Below are your account details — please keep them safe and do not share them with anyone.
                </p>

                <!-- Account Details -->
                <table width="100%" cellpadding="0" cellspacing="0"
                  style="background:#f0f7ff;border-radius:10px;border:1px solid #cce0ff;margin-bottom:20px;">
                  <tr>
                    <td style="padding:14px 16px;">
                      <div style="font-size:11px;font-weight:700;color:#033d75;
                                  text-transform:uppercase;letter-spacing:0.07em;margin-bottom:12px;">
                        Your Account Details
                      </div>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:7px 0;border-bottom:1px solid #dceeff;font-size:12px;color:#667085;width:42%;">Full Name</td>
                          <td style="padding:7px 0;border-bottom:1px solid #dceeff;font-size:12px;color:#1a1a2e;font-weight:600;">
                            ${user.name}${user.middlename ? " " + user.middlename : ""} ${user.lastname}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:7px 0;border-bottom:1px solid #dceeff;font-size:12px;color:#667085;">Username</td>
                          <td style="padding:7px 0;border-bottom:1px solid #dceeff;font-size:12px;color:#1a1a2e;font-weight:600;">@${user.username}</td>
                        </tr>
                        <tr>
                          <td style="padding:7px 0;border-bottom:1px solid #dceeff;font-size:12px;color:#667085;">Email Address</td>
                          <td style="padding:7px 0;border-bottom:1px solid #dceeff;font-size:12px;color:#1a1a2e;font-weight:600;">${user.email}</td>
                        </tr>
                        <tr>
                          <td style="padding:7px 0;border-bottom:1px solid #dceeff;font-size:12px;color:#667085;">Phone Number</td>
                          <td style="padding:7px 0;border-bottom:1px solid #dceeff;font-size:12px;color:#1a1a2e;font-weight:600;">${user.phone}</td>
                        </tr>
                        <tr>
                          <td style="padding:7px 0;border-bottom:1px solid #dceeff;font-size:12px;color:#667085;">Country</td>
                          <td style="padding:7px 0;border-bottom:1px solid #dceeff;font-size:12px;color:#1a1a2e;font-weight:600;">${user.country}</td>
                        </tr>
                        <tr>
                          <td style="padding:7px 0;border-bottom:1px solid #dceeff;font-size:12px;color:#667085;">Account Type</td>
                          <td style="padding:7px 0;border-bottom:1px solid #dceeff;font-size:12px;color:#1a1a2e;font-weight:600;">${user.accounttype}</td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0 4px;font-size:12px;color:#667085;">Account Number</td>
                          <td style="padding:10px 0 4px;font-size:16px;font-weight:800;color:#033d75;letter-spacing:2px;">${accountNumber}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Status Badge -->
                <div style="text-align:center;margin-bottom:20px;">
                  <span style="display:inline-block;background:#ecfdf5;color:#057a55;
                               font-size:12px;font-weight:600;padding:6px 18px;
                               border-radius:20px;border:1px solid #a7f3d0;">
                    ✓ Account Active &amp; Verified
                  </span>
                </div>

                <!-- Features -->
                <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#1a1a2e;">
                  What you can do with NFV Wealth:
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                  <tr>
                    <td style="padding:8px 10px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
                      <table width="100%" cellpadding="0" cellspacing="0"><tr>
                        <td width="32" style="padding-right:10px;vertical-align:top;">
                          <div style="width:30px;height:30px;background:#033d75;border-radius:7px;text-align:center;line-height:30px;font-size:14px;">⚡</div>
                        </td>
                        <td>
                          <div style="font-size:12px;font-weight:600;color:#1a1a2e;margin-bottom:2px;">Instant Local Transfers</div>
                          <div style="font-size:11px;color:#667085;">Send money to any local account 24/7 with zero fees.</div>
                        </td>
                      </tr></table>
                    </td>
                  </tr>
                  <tr><td style="height:8px;"></td></tr>
                  <tr>
                    <td style="padding:8px 10px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
                      <table width="100%" cellpadding="0" cellspacing="0"><tr>
                        <td width="32" style="padding-right:10px;vertical-align:top;">
                          <div style="width:30px;height:30px;background:#033d75;border-radius:7px;text-align:center;line-height:30px;font-size:14px;">🌍</div>
                        </td>
                        <td>
                          <div style="font-size:12px;font-weight:600;color:#1a1a2e;margin-bottom:2px;">International Transfers</div>
                          <div style="font-size:11px;color:#667085;">Send worldwide via Wire, PayPal, Wise, Crypto and more.</div>
                        </td>
                      </tr></table>
                    </td>
                  </tr>
                  <tr><td style="height:8px;"></td></tr>
                  <tr>
                    <td style="padding:8px 10px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
                      <table width="100%" cellpadding="0" cellspacing="0"><tr>
                        <td width="32" style="padding-right:10px;vertical-align:top;">
                          <div style="width:30px;height:30px;background:#033d75;border-radius:7px;text-align:center;line-height:30px;font-size:14px;">💳</div>
                        </td>
                        <td>
                          <div style="font-size:12px;font-weight:600;color:#1a1a2e;margin-bottom:2px;">Virtual Cards</div>
                          <div style="font-size:11px;color:#667085;">Create secure virtual cards for online payments instantly.</div>
                        </td>
                      </tr></table>
                    </td>
                  </tr>
                </table>

                <!-- Login Button -->
                <div style="text-align:center;margin-bottom:20px;">
                  <a href="${appUrl}/login.html"
                     style="display:inline-block;background:#033d75;color:#ffffff;
                            font-size:14px;font-weight:700;padding:12px 32px;
                            border-radius:8px;text-decoration:none;">
                    Login to Your Dashboard →
                  </a>
                </div>

                <!-- Security Warning -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:12px 14px;background:#fffbeb;border-radius:8px;border:1px solid #fde68a;">
                      <p style="margin:0;font-size:12px;color:#92400e;line-height:1.6;">
                        <strong>🔒 Security Notice:</strong> NFV Wealth will <strong>never</strong>
                        ask for your password, PIN, or OTP via email or phone. Do not share these with anyone.
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="padding:16px 20px;border-top:1px solid rgba(0,0,0,0.08);">
                <div style="font-size:12px;color:#667085;line-height:1.5;">
                  <p style="margin:0 0 6px;">This message was sent to <strong>${user.email}</strong> because you created an NFV Wealth account.</p>
                  <p style="margin:0;">© ${year} NFV Wealth. All rights reserved.</p>
                  <p style="margin:6px 0 0;">Need help? Contact us at <a href="mailto:support@nfv-web-ing-uk.pro" style="color:#033d75;text-decoration:none;">support@nfv-web-ing-uk.pro</a></p>
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>
  `;
}
