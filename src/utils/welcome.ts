import config from '../config';

export const welcome = () => {
  const now = new Date();
  const isProduction = config.node_env === 'production';

  return `
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Zyara Backend</title>
    </head>
    <body style="margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#FAFAFA; font-family:'Segoe UI', Roboto, Arial, sans-serif; color:#1F2937; padding:40px 20px;">
      <div style="text-align:center; max-width:480px; width:100%;">
        <div style="display:inline-flex; align-items:center; gap:8px; margin-bottom:20px;">
          <span style="font-size:20px; line-height:1;">&#10022;</span>
          <span style="font-size:32px; font-weight:700; color:#1F2937;">Zyara</span>
        </div>

        <div style="display:inline-flex; align-items:center; gap:10px; margin-bottom:20px; background:#E8F5EC; padding:6px 14px; border-radius:999px;">
          <span style="width:8px; height:8px; border-radius:50%; background:#5B9C6D; display:inline-block;"></span>
          <span style="font-size:12px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:#5B9C6D;">Server is live</span>
        </div>

        <h1 style="font-size:26px; font-weight:700; margin:0 0 8px; color:#1F2937;">Backend Server live</h1>
        <p style="font-size:15px; color:#6B7280; margin:0 0 32px; line-height:1.5;">REST API powering the Zyara app — groceries, food, flowers, gift cards, and everything in between.</p>

        <div style="background:#FFFFFF; border:1px solid #ECECEC; border-radius:14px; padding:20px 24px; text-align:left; font-size:14px; line-height:1.9; box-shadow:0 1px 2px rgba(0,0,0,.04), 0 8px 24px -12px rgba(0,0,0,.08); margin-bottom:24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-left:3px solid #4FA6B8; padding-left:10px; margin-bottom:4px;">
            <span style="color:#6B7280;">Environment</span>
            <strong>${isProduction ? 'Production' : 'Development'}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; border-left:3px solid #4FA6B8; padding-left:10px; margin-bottom:4px;">
            <span style="color:#6B7280;">Base path</span>
            <strong>/api/v1</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; border-left:3px solid #4FA6B8; padding-left:10px;">
            <span style="color:#6B7280;">Server time</span>
            <strong>${now.toISOString()}</strong>
          </div>
        </div>

        <div style="display:inline-block; padding:12px 28px; border-radius:999px; font-size:14px; font-weight:600; color:#FFFFFF; background:linear-gradient(90deg, #4FA6B8, #7DB86B, #E0A83E, #D97730);">
          &#10022;&nbsp; Make Their Day!
        </div>
      </div>
    </body>
    </html>
  `;
};
