// Style sheet for the static content pages (same colours and type as the tool).
export const PAGES_CSS = `
:root{--bg:#f5f7fa;--fg:#15263d;--card:#fff;--muted:#5c6c80;--border:#dce3ec;--primary:#155eaa;--accent:#e9f2fc;--code:#eef2f7;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#101c2d;--fg:#f4f6f8;--card:#17263b;--muted:#a9b4c2;--border:#304158;--primary:#71b8fc;--accent:#203752;--code:#1c2d44;color-scheme:dark}}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--fg);font-family:"Segoe UI Variable","Segoe UI","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;line-height:1.85;-webkit-font-smoothing:antialiased;word-break:keep-all;overflow-wrap:anywhere}
html[lang=ja] body{font-family:"Segoe UI Variable","Segoe UI","Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic UI","Yu Gothic",Meiryo,"Noto Sans JP",system-ui,sans-serif;word-break:normal;line-break:strict}
a{color:var(--primary)}
.wrap{max-width:820px;margin:0 auto;padding:0 20px}
.skip{position:absolute;left:-999px}.skip:focus{left:12px;top:12px;background:var(--card);padding:8px 12px;z-index:9}
.top{background:var(--card);border-bottom:1px solid var(--border)}
.top .wrap{max-width:1100px;display:flex;align-items:center;gap:20px;min-height:60px;flex-wrap:wrap;padding-top:8px;padding-bottom:8px}
.brand{display:inline-flex;align-items:center;gap:8px;color:var(--fg);text-decoration:none;font-size:17px;white-space:nowrap}
.brand svg{width:22px;height:22px;fill:none;stroke:var(--primary);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.nav-wide{display:flex;gap:18px;margin-left:auto;font-size:14px}
.nav-wide a{color:var(--muted);text-decoration:none}.nav-wide a:hover,.nav-wide a[aria-current]{color:var(--primary)}
.menu{display:none;position:relative}
.menu summary{list-style:none;display:flex;align-items:center;justify-content:center;width:44px;height:44px;border:1px solid var(--border);border-radius:8px;cursor:pointer}
.menu summary::-webkit-details-marker{display:none}
.menu summary svg{width:20px;height:20px;fill:none;stroke:var(--fg);stroke-width:2;stroke-linecap:round}
.menu nav{position:absolute;right:0;top:calc(100% + 6px);z-index:20;min-width:190px;display:flex;flex-direction:column;padding:6px;background:var(--card);border:1px solid var(--border);border-radius:10px;box-shadow:0 10px 28px rgba(0,0,0,.18)}
.menu nav a{display:flex;align-items:center;min-height:44px;padding:0 12px;border-radius:6px;color:var(--fg);text-decoration:none;font-size:15px}
.menu nav a:hover{background:var(--accent)}.menu nav a[aria-current]{color:var(--primary);font-weight:600}
.lang{font-size:13px;color:var(--muted);text-decoration:none;border:1px solid var(--border);border-radius:6px;padding:3px 9px}
.open,.button{display:inline-block;background:var(--primary);color:#fff;text-decoration:none;font-weight:600;font-size:14px;border-radius:6px;padding:8px 14px;white-space:nowrap}
@media (prefers-color-scheme:dark){.open,.button{color:#0d1b2b}}
.button.ghost{background:transparent;color:var(--primary);border:1px solid var(--border)}
.crumbs{font-size:13px;color:var(--muted);margin:22px 0 6px}.crumbs a{color:var(--muted)}
main{padding-bottom:56px}
article h1{font-size:32px;line-height:1.35;letter-spacing:-.5px;margin:6px 0 14px}
.lead{font-size:17px;color:var(--muted)}
.meta{font-size:12px;color:var(--muted);margin:10px 0 30px}
article h2{font-size:22px;line-height:1.45;margin:40px 0 12px;padding-top:6px;border-top:1px solid var(--border)}
article h3{font-size:17px;margin:26px 0 8px}
article p{margin:0 0 14px}
article ul,article ol{margin:0 0 16px 22px}
article li{margin:4px 0}
article code,article kbd{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.9em;background:var(--code);border-radius:4px;padding:1px 5px}
article kbd{border:1px solid var(--border)}
article table{width:100%;border-collapse:collapse;margin:8px 0 20px;font-size:14px;display:block;overflow-x:auto}
article th,article td{border:1px solid var(--border);padding:8px 10px;text-align:left;vertical-align:top}
article th{background:var(--accent)}
.note{background:var(--card);border-left:3px solid var(--primary);padding:14px 18px;border-radius:0 6px 6px 0;margin:18px 0}
.note p:last-child{margin:0}
dl.qa dt{font-weight:650;margin-top:22px}dl.qa dd{margin:6px 0 0}
figure{margin:18px 0}figure svg{width:100%;height:auto;background:var(--card);border:1px solid var(--border);border-radius:8px}
figcaption{font-size:13px;color:var(--muted);margin-top:6px}
.steps{counter-reset:s;list-style:none;margin-left:0}
.steps>li{counter-increment:s;position:relative;padding-left:40px;margin:16px 0}
.steps>li:before{content:counter(s);position:absolute;left:0;top:2px;width:26px;height:26px;border-radius:50%;background:var(--primary);color:var(--card);font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center}
.cta{margin-top:44px;display:flex;gap:18px;align-items:center;justify-content:space-between;flex-wrap:wrap;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:20px 22px}
.cta p{font-size:13px;color:var(--muted);margin:2px 0 0}
.cta-actions{display:flex;gap:8px;flex-wrap:wrap}
.related{margin-top:40px}
.related h2{font-size:18px;margin-bottom:12px}
.related ul{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:12px}
.related a{display:block;height:100%;text-decoration:none;color:var(--fg);background:var(--card);border:1px solid var(--border);border-radius:8px;padding:14px 16px}
.related a:hover{border-color:var(--primary)}
.related strong{display:block;font-size:15px}.related span{display:block;font-size:13px;color:var(--muted);line-height:1.6;margin-top:4px}
.bottom{border-top:1px solid var(--border);background:var(--card);font-size:13px;color:var(--muted)}
.bottom .wrap{max-width:1100px;display:flex;gap:18px;flex-wrap:wrap;align-items:center;padding-top:20px;padding-bottom:20px}
.bottom nav{display:flex;gap:16px;margin-left:auto;flex-wrap:wrap}.bottom a{color:var(--muted)}
/* mid widths: the two other-language links move into the menu so the header stays one row */
@media (min-width:641px) and (max-width:900px){
  .top .lang{display:none}
  .menu{display:block}
}
@media (min-width:641px) and (max-width:720px){
  .nav-wide{display:none}
  .open{margin-left:auto}
}
@media (max-width:640px){
  .top .wrap{flex-wrap:nowrap;gap:10px;min-height:56px;padding-top:6px;padding-bottom:6px}
  .nav-wide,.top .lang{display:none}
  .menu{display:block}
  .top .wrap{padding-left:16px;padding-right:16px}
  .brand{font-size:15px}
  .open{margin-left:auto;padding:0 14px;min-height:44px;display:inline-flex;align-items:center}
  article h1{font-size:26px}
  article h2{font-size:20px}
  .related ul{grid-template-columns:1fr}
  .bottom nav{margin-left:0}
}
@media (max-width:379px){
  .top .brand span{display:none}
}
`;
