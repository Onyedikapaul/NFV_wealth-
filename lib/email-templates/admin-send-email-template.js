export function adminSendEmailTemplate({
  title = "Message from NFV Wealth",
  content = "",
}) {
  const safeTitle = String(title || "").replace(/[<>]/g, "");
  const year = new Date().getFullYear();

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
                  <div style="font-size:18px;font-weight:700;letter-spacing:-0.02em;">
                    NFV Wealth
                  </div>
                  <div style="font-size:12px;opacity:0.85;margin-top:4px;">
                    ${safeTitle}
                  </div>
                </div>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:22px 20px;">
                ${content}
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="padding:16px 20px;border-top:1px solid rgba(0,0,0,0.08);">
                <div style="font-size:12px;color:#667085;line-height:1.5;">
                  <p style="margin:0 0 6px;">This message was sent to you by the <b>NFV Wealth</b> admin team.</p>
                  <p style="margin:0;">© ${year} NFV Wealth. All rights reserved.</p>
                  <p style="margin:6px 0 0;">Need help? Reply to this email or contact support.</p>
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
