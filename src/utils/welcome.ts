import config from '../config';

export const welcome = () => {
  const now = new Date();
  const isProduction = config.node_env === 'production';

  return `
    <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; background:#F6F8F7; font-family:'Segoe UI', Roboto, Arial, sans-serif; color:#17262A; padding:40px 20px;">
      <div style="text-align:center; max-width:480px; width:100%;">
        <div style="display:inline-flex; align-items:center; gap:10px; margin-bottom:24px;">
          <span style="width:10px; height:10px; border-radius:50%; background:#3F9C6B; display:inline-block;"></span>
          <span style="font-size:13px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:#3F9C6B;">Server is live</span>
        </div>
        <h1 style="font-size:32px; font-weight:700; margin:0 0 8px; color:#2F7E93;">Zyara Backend</h1>
        <p style="font-size:15px; color:#55686C; margin:0 0 32px;">REST API powering the Zyara app — groceries, food, flowers, gift cards, and everything in between.</p>

        <div style="background:#FFFFFF; border:1px solid #DDE6E5; border-radius:12px; padding:20px 24px; text-align:left; font-size:14px; line-height:1.9;">
          <div style="display:flex; justify-content:space-between;">
            <span style="color:#55686C;">Environment</span>
            <strong>${isProduction ? 'Production' : 'Development'}</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:#55686C;">Base path</span>
            <strong>/api/v1</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:#55686C;">Server time</span>
            <strong>${now.toISOString()}</strong>
          </div>
        </div>
      </div>
    </div>
  `;
};
