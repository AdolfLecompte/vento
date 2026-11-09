<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Lexend"; font-weight: 400; src: url("assets/fonts/Lexend_400Regular.ttf"); }
      @font-face { font-family: "Lexend"; font-weight: 500; src: url("assets/fonts/Lexend_500Medium.ttf"); }
      @font-face { font-family: "Lexend"; font-weight: 600; src: url("assets/fonts/Lexend_600SemiBold.ttf"); }
      @font-face { font-family: "Lexend"; font-weight: 700; src: url("assets/fonts/Lexend_700Bold.ttf"); }
      @font-face { font-family: "Unbounded"; font-weight: 700; src: url("assets/fonts/Unbounded_700Bold.ttf"); }

      :root {
        --ground: #f2faf4;
        --ink: #0f172a;
        --muted: #55657a;
        --green: #16a34a;
        --green-text: #15803d;
        --soft: #dcfce7;
        --card: #f4faf6;
        --line: #e2e8f0;
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: var(--ground); }
      #root { position: relative; width: 100%; height: 100%; font-family: "Lexend", sans-serif; color: var(--ink); overflow: hidden; }

      /* background: two soft circles that sit still, the motion lives in the scenes */
      .blob { position: absolute; border-radius: 50%; background: var(--soft); opacity: 0.7; }
      #blob1 { width: 900px; height: 900px; right: -260px; top: -300px; }
      #blob2 { width: 640px; height: 640px; left: -220px; bottom: -280px; opacity: 0.5; }

      .scene { position: absolute; inset: 0; }
      .inner { position: absolute; inset: 0; }

      /* ---- left column: kicker, title, mascot with its bubble ---- */
      .left { position: absolute; left: 120px; top: 140px; width: 820px; }
      .kicker { font-weight: 600; font-size: 28px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--green-text); }
      .title { margin-top: 22px; font-weight: 700; font-size: 92px; line-height: 1.06; letter-spacing: -0.02em; }
      .mrow { position: absolute; left: 120px; bottom: 96px; display: flex; align-items: flex-end; gap: 30px; }
      .mwrap { width: 330px; height: 330px; flex: none; }
      .mas { display: block; width: 100%; height: 100%; overflow: visible; }
      .mas ellipse { transform-box: fill-box; transform-origin: center; }
      .bubble { position: relative; max-width: 500px; margin-bottom: 120px; padding: 30px 40px; border-radius: 40px; background: #fff; font-weight: 500; font-size: 38px; line-height: 1.3; box-shadow: 0 18px 50px rgba(15, 23, 42, 0.1); }
      .bubble::before { content: ""; position: absolute; left: -12px; bottom: 44px; width: 28px; height: 28px; background: #fff; border-radius: 6px; transform: rotate(45deg); }

      /* ---- the phone ---- */
      .phone { position: absolute; right: 150px; top: 90px; width: 700px; height: 900px; padding: 40px 36px; border-radius: 72px; background: #fff; box-shadow: 0 40px 100px rgba(15, 23, 42, 0.16); overflow: hidden; }
      .hdr { display: flex; align-items: center; justify-content: space-between; font-weight: 700; font-size: 46px; margin-bottom: 26px; }
      .chips { display: flex; gap: 12px; margin-bottom: 26px; }
      .chip { flex: 1; height: 64px; border-radius: 32px; display: flex; align-items: center; justify-content: center; background: var(--card); font-weight: 500; font-size: 28px; color: var(--ink); }
      .chip.on { background: var(--green); color: #fff; }
      .card { background: var(--card); border-radius: 36px; padding: 26px 28px; margin-bottom: 20px; }
      .row { display: flex; align-items: center; gap: 20px; }
      .grow { flex: 1; min-width: 0; }
      .name { font-weight: 600; font-size: 32px; }
      .sub { font-weight: 400; font-size: 28px; color: var(--muted); margin-top: 2px; }
      .amt { font-weight: 700; font-size: 32px; text-align: right; }
      .earn { font-weight: 500; font-size: 28px; color: var(--green-text); text-align: right; }
      .pills { display: flex; gap: 10px; margin-top: 16px; }
      .pill { padding: 6px 20px; border-radius: 22px; font-weight: 500; font-size: 28px; }
      .p-ok { background: var(--soft); color: #166534; }
      .p-part { background: #fef3c7; color: #854d0e; }
      .p-due { background: #ffedd5; color: #9a3412; }
      .p-mute { background: var(--line); color: #475569; }
      .ico { width: 64px; height: 64px; flex: none; border-radius: 50%; background: var(--soft); display: flex; align-items: center; justify-content: center; }
      .ico svg { width: 34px; height: 34px; }
      .fab { position: absolute; right: 36px; bottom: 36px; height: 80px; padding: 0 36px; border-radius: 40px; background: var(--green); color: #fff; display: flex; align-items: center; gap: 12px; font-weight: 600; font-size: 28px; box-shadow: 0 14px 34px rgba(22, 163, 74, 0.4); }
      mark { background: var(--soft); color: inherit; border-radius: 6px; padding: 0 2px; }

      /* ---- scene 1 and 8: centred ---- */
      .center { position: absolute; left: 0; right: 0; text-align: center; }
      .logo { font-family: "Unbounded", sans-serif; font-weight: 700; font-size: 250px; line-height: 1; letter-spacing: 0.01em; color: var(--green); }
      .logo span { display: inline-block; margin: 0 10px; }
      .tag { font-weight: 600; font-size: 56px; letter-spacing: -0.01em; }
      .tag2 { margin-top: 14px; font-weight: 400; font-size: 36px; color: var(--muted); }
      .six { position: absolute; left: 0; right: 0; display: flex; justify-content: center; gap: 36px; }
      .six .hm { width: 210px; height: 210px; flex: none; }

      /* ---- scene 3 ---- */
      .bigcard { border-radius: 40px; padding: 34px 36px; margin-bottom: 22px; }
      .bigcard.g { background: var(--green); color: #fff; }
      .bigcard.w { background: var(--card); }
      .lbl { font-weight: 500; font-size: 28px; }
      .big { font-weight: 700; font-size: 74px; letter-spacing: -0.02em; margin-top: 6px; }
      .track { margin-top: 22px; height: 18px; border-radius: 9px; background: var(--line); overflow: hidden; }
      .fill { height: 100%; width: 100%; border-radius: 9px; background: var(--green); transform-origin: left center; }

      /* ---- scene 4 ---- */
      .search { display: flex; align-items: center; gap: 16px; height: 84px; border-radius: 42px; border: 3px solid var(--green); padding: 0 18px 0 12px; margin-bottom: 26px; }
      .sicon { width: 56px; height: 56px; border-radius: 50%; background: var(--green); display: flex; align-items: center; justify-content: center; flex: none; }
      .sicon svg { width: 30px; height: 30px; }
      .stext { font-weight: 400; font-size: 30px; color: var(--muted); }

      /* ---- scene 5 ---- */
      .day { display: flex; justify-content: space-between; align-items: baseline; margin: 6px 6px 14px; font-weight: 600; font-size: 28px; }
      .day small { font-weight: 500; font-size: 28px; color: var(--muted); }

      /* ---- scene 6 ---- */
      .notif { background: #fff; border-radius: 36px; padding: 26px 28px; box-shadow: 0 16px 44px rgba(15, 23, 42, 0.14); border: 2px solid var(--line); margin-bottom: 34px; }
      .notif .app { font-weight: 500; font-size: 28px; color: var(--muted); margin-bottom: 8px; }
      .notif .head { font-weight: 600; font-size: 31px; }
      .notif .body { font-weight: 400; font-size: 28px; color: var(--muted); margin-top: 6px; line-height: 1.35; }

      /* ---- scene 7 ---- */
      .band { height: 150px; border-radius: 36px; background: #16a34a; margin-bottom: 30px; display: flex; align-items: center; padding: 0 30px; color: #fff; font-weight: 700; font-size: 40px; }
      .dots { position: relative; display: flex; justify-content: space-between; margin-bottom: 36px; }
      .dot { width: 78px; height: 78px; border-radius: 50%; }
      #ring { position: absolute; left: -7px; top: -7px; width: 92px; height: 92px; border-radius: 50%; border: 6px solid var(--ink); }
      .seg { display: flex; gap: 12px; margin-bottom: 26px; }
      .seg div { flex: 1; height: 68px; border-radius: 34px; display: flex; align-items: center; justify-content: center; font-weight: 500; font-size: 28px; background: var(--card); }
      .seg .on { background: var(--green); color: #fff; }
      .ink7 { color: var(--ink); }

      /* ---- scene 8 ---- */
      .repo { margin-top: 42px; display: inline-block; padding: 18px 44px; border-radius: 50px; background: var(--green); color: #fff; font-weight: 600; font-size: 38px; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="47.5" data-width="1920" data-height="1080">
      <div class="blob" id="blob1" data-layout-allow-overflow></div>
      <div class="blob" id="blob2" data-layout-allow-overflow></div>

      <!-- 1 · title -->
      <section id="s1" class="scene clip" data-start="0" data-duration="5.5" data-track-index="1">
        <div class="inner">
          <div class="center" style="top: 150px">
            <div class="logo"><span>V</span><span>E</span><span>N</span><span>T</span><span>O</span></div>
            <div class="tag" style="margin-top: 36px">A sales notebook for Android</div>
            <div class="tag2">Orders, payments, deliveries and profit. Offline, on your phone.</div>
          </div>
          <div class="six" style="bottom: 70px">
            <div class="hm">{{M:Pan}}</div><div class="hm">{{M:Bebida}}</div><div class="hm">{{M:Billete}}</div>
            <div class="hm">{{M:Moneda}}</div><div class="hm">{{M:Bolsa}}</div><div class="hm">{{M:Cartera}}</div>
          </div>
        </div>
      </section>

      <!-- 2 · orders -->
      <section id="s2" class="scene clip" data-start="5.5" data-duration="6" data-track-index="1">
        <div class="inner">
          <div class="left"><div class="kicker">Orders</div><div class="title">Every order, step by step</div></div>
          <div class="mrow"><div class="mwrap">{{M:Pan}}</div><div class="bubble">Who ordered what? I'll keep track.</div></div>
          <div class="phone">
            <div class="hdr">Orders</div>
            <div class="chips"><div class="chip on">All</div><div class="chip">To collect</div><div class="chip">To deliver</div></div>
            <div class="card o"><div class="row"><div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linejoin="round"><path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg></div><div class="grow"><div class="name">Ana</div><div class="sub">Today</div></div><div><div class="amt">$48.000</div><div class="earn">earns $18.000</div></div></div><div class="pills"><span class="pill p-part">partial</span><span class="pill p-mute">to deliver</span></div></div>
            <div class="card o"><div class="row"><div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linejoin="round"><path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg></div><div class="grow"><div class="name">Luis</div><div class="sub">Yesterday</div></div><div><div class="amt">$15.000</div><div class="earn">earns $5.000</div></div></div><div class="pills"><span class="pill p-due">unpaid</span><span class="pill p-mute">to deliver</span></div></div>
            <div class="card o"><div class="row"><div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linejoin="round"><path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg></div><div class="grow"><div class="name">Marta</div><div class="sub">Nov 6</div></div><div><div class="amt">$92.000</div><div class="earn">earns $31.000</div></div></div><div class="pills"><span class="pill p-ok">paid</span><span class="pill p-mute">to deliver</span></div></div>
            <div class="fab"><span style="font-size: 38px; line-height: 1">+</span> New order</div>
          </div>
        </div>
      </section>

      <!-- 3 · profit -->
      <section id="s3" class="scene clip" data-start="11.5" data-duration="6" data-track-index="1">
        <div class="inner">
          <div class="left"><div class="kicker">Home</div><div class="title">Know what you really earn</div></div>
          <div class="mrow"><div class="mwrap">{{M:Billete}}</div><div class="bubble">Profit, what you collected, and what is still missing.</div></div>
          <div class="phone">
            <div class="hdr">Home</div>
            <div class="chips"><div class="chip on">This month</div><div class="chip">All</div></div>
            <div class="bigcard g bc"><div class="lbl">Profit</div><div class="big" id="n-profit">$0</div></div>
            <div class="bigcard w bc">
              <div class="lbl">Collected</div><div class="big" id="n-coll">$0</div>
              <div class="track"><div class="fill" id="f-coll"></div></div>
              <div class="sub" style="margin-top: 14px">$88.000 missing to reach what you sold</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4 · clients and products -->
      <section id="s4" class="scene clip" data-start="17.5" data-duration="6" data-track-index="1">
        <div class="inner">
          <div class="left"><div class="kicker">Clients &amp; products</div><div class="title">Find anything in seconds</div></div>
          <div class="mrow"><div class="mwrap">{{M:Cartera}}</div><div class="bubble">Search by name, product or date.</div></div>
          <div class="phone">
            <div class="search"><div class="sicon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg></div><div class="stext" id="typed">Search clients and products</div></div>
            <div class="card r"><div class="row"><div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 15-5 16 0"/></svg></div><div class="grow"><div class="name"><mark>Ana</mark> Pérez</div><div class="sub">Owes $30.000</div></div></div></div>
            <div class="card r"><div class="row"><div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M5 8h14l1 12H4z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg></div><div class="grow"><div class="name">Banana chips</div><div class="sub">Costs $1.000 · sells $1.500</div></div><div class="earn">earns $500</div></div></div>
            <div class="card r"><div class="row"><div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M5 8h14l1 12H4z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg></div><div class="grow"><div class="name">Pan de yuca</div><div class="sub">Costs $800 · sells $1.300</div></div><div class="earn">earns $500</div></div></div>
          </div>
        </div>
      </section>

      <!-- 5 · history -->
      <section id="s5" class="scene clip" data-start="23.5" data-duration="6" data-track-index="1">
        <div class="inner">
          <div class="left"><div class="kicker">History</div><div class="title">Finished orders, grouped by day</div></div>
          <div class="mrow"><div class="mwrap">{{M:Bebida}}</div><div class="bubble">Delivered and paid? It moves to History.</div></div>
          <div class="phone">
            <div class="hdr">History</div>
            <div class="day h"><span>Today</span><small>$63.000</small></div>
            <div class="card h"><div class="row"><div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linejoin="round"><path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg></div><div class="grow"><div class="name">Sofía</div><div class="sub">2 products</div></div><div class="amt">$38.000</div></div></div>
            <div class="card h"><div class="row"><div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linejoin="round"><path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg></div><div class="grow"><div class="name">Carlos</div><div class="sub">1 product</div></div><div class="amt">$25.000</div></div></div>
            <div class="day h" style="margin-top: 26px"><span>Yesterday</span><small>$120.000</small></div>
            <div class="card h"><div class="row"><div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linejoin="round"><path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg></div><div class="grow"><div class="name">Marta</div><div class="sub">4 products</div></div><div class="amt">$120.000</div></div></div>
          </div>
        </div>
      </section>

      <!-- 6 · reminders and backups -->
      <section id="s6" class="scene clip" data-start="29.5" data-duration="6" data-track-index="1">
        <div class="inner">
          <div class="left"><div class="kicker">Reminders &amp; backups</div><div class="title">Never forget, never lose</div></div>
          <div class="mrow"><div class="mwrap">{{M:Bolsa}}</div><div class="bubble">A daily nudge, and a backup folder called vento.</div></div>
          <div class="phone">
            <div class="notif nt"><div class="app">Vento · 8:00 AM</div><div class="head">Bolsa: 3 people owe you $65.000</div><div class="body">Ana $30.000, Luis $20.000, Marta $15.000. 2 orders left to deliver.</div></div>
            <div class="card bk"><div class="row"><div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linejoin="round"><path d="M3 6h7l2 2h9v11H3z"/></svg></div><div class="grow"><div class="name">vento</div><div class="sub">Your backup folder</div></div></div></div>
            <div class="card bk"><div class="row"><div class="grow"><div class="name" style="font-size: 28px">vento-2026-11-08.json</div><div class="sub">Saved automatically, every day</div></div><div class="ico" id="okico"><svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg></div></div></div>
          </div>
        </div>
      </section>

      <!-- 7 · style -->
      <section id="s7" class="scene clip" data-start="35.5" data-duration="6" data-track-index="1">
        <div class="inner">
          <div class="left"><div class="kicker">Your style</div><div class="title">Make it yours</div></div>
          <div class="mrow"><div class="mwrap">{{M:Moneda}}</div><div class="bubble">6 colours, dark mode, 6 mascots, English or Spanish.</div></div>
          <div class="phone" id="ph7">
            <div class="band" id="band7">Appearance</div>
            <div class="dots" id="dots7">
              <div class="dot" style="background:#16a34a"></div><div class="dot" style="background:#2563eb"></div><div class="dot" style="background:#7c3aed"></div>
              <div class="dot" style="background:#db2777"></div><div class="dot" style="background:#ea580c"></div><div class="dot" style="background:#0d9488"></div>
              <div id="ring"></div>
            </div>
            <div class="seg"><div id="sl" class="on">Light</div><div id="sd" class="ink7">Dark</div></div>
            <div class="seg"><div id="se" class="on">English</div><div id="ss" class="ink7">Español</div></div>
          </div>
        </div>
      </section>

      <!-- 8 · close -->
      <section id="s8" class="scene clip" data-start="41.5" data-duration="6" data-track-index="1">
        <div class="inner">
          <div class="center" style="top: 170px">
            <div class="tag" style="font-size: 96px; font-weight: 700; letter-spacing: -0.02em">Free and open source</div>
            <div class="tag2" style="font-size: 42px">Your data never leaves your phone.</div>
            <div class="repo">github.com/AdolfLecompte/VENTO</div>
          </div>
          <div class="six" style="bottom: 90px">
            <div class="hm">{{M:Pan}}</div><div class="hm">{{M:Bebida}}</div><div class="hm">{{M:Billete}}</div>
            <div class="hm">{{M:Moneda}}</div><div class="hm">{{M:Bolsa}}</div><div class="hm">{{M:Cartera}}</div>
          </div>
        </div>
      </section>
    </div>

    <script>
      const tl = gsap.timeline({ paused: true });
      const fmt = (n) => "$" + Math.round(n).toLocaleString("de-DE"); // the app writes $1.500

      // Every scene enters the same way, so the video reads as one presentation.
      function enter(id, t0, d, hasLeft) {
        const q = (s) => "#" + id + " " + s;
        tl.fromTo(q(".kicker"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, t0 + 0.1);
        tl.fromTo(q(".title"), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, t0 + 0.2);
        tl.fromTo(q(".mwrap"), { scale: 0, opacity: 0, transformOrigin: "50% 100%" }, { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(1.8)" }, t0 + 0.35);
        tl.fromTo(q(".bubble"), { scale: 0.6, opacity: 0, transformOrigin: "0% 80%" }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.6)" }, t0 + 0.85);
        tl.fromTo(q(".phone"), { x: 160, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, t0 + 0.25);
        // the mascot breathes up and down, then blinks once
        const bob = Math.max(0, Math.floor((d - 1.8) / 0.8) - 1);
        tl.to(q(".mas"), { y: -14, duration: 0.8, ease: "sine.inOut", yoyo: true, repeat: bob }, t0 + 1.3);
        tl.to(q(".mas ellipse"), { scaleY: 0.1, duration: 0.09, yoyo: true, repeat: 1 }, t0 + 2.6);
        tl.to(q(".inner"), { opacity: 0, duration: 0.35, ease: "power1.in" }, t0 + d - 0.35);
      }

      // 1 · title
      tl.fromTo("#s1 .logo span", { y: 60, scale: 0.9 }, { y: 0, scale: 1, duration: 0.7, ease: "power4.out", stagger: 0.09 }, 0);
      tl.fromTo("#s1 .tag", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 1.0);
      tl.fromTo("#s1 .tag2", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 1.3);
      tl.fromTo("#s1 .hm", { y: 140, scale: 0, opacity: 0, transformOrigin: "50% 100%" }, { y: 0, scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.8)", stagger: 0.12 }, 1.6);
      tl.to("#s1 .hm", { y: -28, duration: 0.28, ease: "power2.out", yoyo: true, repeat: 1, stagger: 0.1 }, 3.2);
      tl.to("#s1 .inner", { opacity: 0, duration: 0.35, ease: "power1.in" }, 5.15);

      // 2 · orders
      enter("s2", 5.5, 6);
      tl.fromTo("#s2 .card.o", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.35 }, 6.9);
      tl.fromTo("#s2 .fab", { scale: 0, transformOrigin: "100% 100%" }, { scale: 1, duration: 0.5, ease: "back.out(2)" }, 8.7);
      tl.to("#s2 .chip:nth-child(2)", { backgroundColor: "#16a34a", color: "#ffffff", duration: 0.3 }, 9.6);
      tl.to("#s2 .chip:nth-child(1)", { backgroundColor: "#f4faf6", color: "#0f172a", duration: 0.3 }, 9.6);

      // 3 · profit
      enter("s3", 11.5, 6);
      tl.fromTo("#s3 .bc", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "power3.out", stagger: 0.25 }, 12.8);
      const cp = { v: 0 }, cc = { v: 0 };
      tl.to(cp, { v: 186500, duration: 1.8, ease: "power2.out", onUpdate() { document.getElementById("n-profit").textContent = fmt(cp.v); } }, 13.1);
      tl.to(cc, { v: 412000, duration: 1.8, ease: "power2.out", onUpdate() { document.getElementById("n-coll").textContent = fmt(cc.v); } }, 13.4);
      tl.fromTo("#f-coll", { scaleX: 0 }, { scaleX: 0.82, duration: 1.8, ease: "power2.out" }, 13.4);

      // 4 · search
      enter("s4", 17.5, 6);
      const ty = { n: 0 };
      tl.fromTo("#s4 .search", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 18.6);
      tl.to(ty, { n: 3, duration: 1, ease: "none", onUpdate() {
        const k = Math.round(ty.n), el = document.getElementById("typed");
        el.textContent = k ? "ana".slice(0, k) : "Search clients and products";
        el.style.color = k ? "#0f172a" : "#55657a";
      } }, 19.4);
      tl.fromTo("#s4 .card.r", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.3 }, 20.7);

      // 5 · history
      enter("s5", 23.5, 6);
      tl.fromTo("#s5 .h", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.28 }, 24.9);

      // 6 · reminders and backups
      enter("s6", 29.5, 6);
      tl.fromTo("#s6 .nt", { y: -140, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "back.out(1.4)" }, 31.0);
      tl.fromTo("#s6 .bk", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.3 }, 32.1);
      tl.fromTo("#okico", { scale: 0 }, { scale: 1, duration: 0.5, ease: "back.out(3)" }, 33.2);

      // 7 · style
      enter("s7", 35.5, 6);
      tl.fromTo("#s7 .band, #s7 .dots, #s7 .seg", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.2 }, 36.8);
      const cols = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#0d9488"];
      cols.forEach((c, i) => {
        const at = 37.7 + i * 0.4;
        tl.to("#ring", { x: (i + 1) * (628 - 78) / 5, duration: 0.3, ease: "power2.inOut" }, at);
        tl.to("#band7", { backgroundColor: c, duration: 0.3 }, at);
      });
      tl.to("#ring", { x: 0, duration: 0.4, ease: "power2.inOut" }, 39.8);
      tl.to("#band7", { backgroundColor: "#16a34a", duration: 0.4 }, 39.8);
      tl.to("#ph7", { backgroundColor: "#0c1511", duration: 0.5 }, 40.2);
      tl.to("#ph7 .ink7", { color: "#e6f4ea", duration: 0.5 }, 40.2);
      tl.to("#ph7 .seg div:not(.on)", { backgroundColor: "#16231c", duration: 0.5 }, 40.2);
      tl.to("#sl", { backgroundColor: "#16231c", color: "#e6f4ea", duration: 0.4 }, 40.2);
      tl.to("#sd", { backgroundColor: "#16a34a", color: "#ffffff", duration: 0.4 }, 40.2);
      tl.to("#ss", { backgroundColor: "#16a34a", color: "#ffffff", duration: 0.4 }, 40.8);
      tl.to("#se", { backgroundColor: "#16231c", color: "#e6f4ea", duration: 0.4 }, 40.8);

      // 8 · close
      tl.fromTo("#s8 .tag", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, 41.7);
      tl.fromTo("#s8 .tag2", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 42.1);
      tl.fromTo("#s8 .repo", { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.8)" }, 42.6);
      tl.fromTo("#s8 .hm", { y: 140, scale: 0, opacity: 0, transformOrigin: "50% 100%" }, { y: 0, scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.8)", stagger: 0.1 }, 43.0);
      tl.to("#s8 .hm", { y: -26, duration: 0.28, ease: "power2.out", yoyo: true, repeat: 1, stagger: 0.09 }, 44.4);

      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
