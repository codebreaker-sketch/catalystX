import { useState, useEffect, useRef, useCallback } from "react";

/* ─── LOGO as base64-embedded SVG placeholder ───
   In production, swap LOGO_SRC with your actual image path */
const LOGO_SRC = "/SAVE_20260625_193602.jpg"; // replaced below via inline style trick

/* ══════════════════════════════════════════════════════
   GLOBAL STYLES injected once
══════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500&display=swap');
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  html { scroll-behavior: smooth; }
  body { background:#000; color:#fff; font-family:'Space Grotesk',sans-serif; margin:0; overflow-x:hidden; width:100%; min-height:100%; cursor:none; }
  #root { min-height:100vh; overflow-x:hidden; width:100%; }
  img { display:block; max-width:100%; }
  a, button, input, [data-cursor] { cursor:none; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:#000; }
  ::-webkit-scrollbar-thumb { background:#22c55e; border-radius:2px; }
  ::selection { background:rgba(34,197,94,0.3); color:#fff; }
`;

/* ══════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════ */
const G = "#22c55e";
const GLOW = "rgba(34,197,94,0.4)";
const BORDER = "rgba(34,197,94,0.18)";
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const buildApiUrl = (path) => `${API_BASE || (import.meta.env.DEV ? "http://localhost:4000" : "")}${path}`;
const AUTH_TOKEN_KEY = "catalystx_token";

const TEAM = [
  { initials:"AW", name:"M. Abdul Wasay Sohail", role:"CEO & Founder", sub:"The Vision Architect", li:"https://www.linkedin.com/in/abdul-wasay-617149308?utm_source=share_via&utm_content=profile&utm_medium=member_android", color:"#22c55e", photo:"/member-aw.jpg" },
  { initials:"MG", name:"Syed Mujtaba Gillani",  role:"Co-Founder",    sub:"Social Media Lead",  li:"https://www.linkedin.com/in/syed-mujtaba-gillani/",  color:"#16a34a", photo:"/member-mg.jpg" },
  { initials:"MB", name:"M. Moin Bukhari",        role:"Co-Founder",    sub:"Social Media Lead",  li:"https://www.linkedin.com/in/muhammad-moin-bukhari-1249ab32a/",      color:"#15803d", photo:"/member-mb.jpg" },
  { initials:"JA", name:"M. Jamal Azeem",         role:"Co-Founder",    sub:"Graphics Lead",      li:"https://www.linkedin.com/in/jamal-satti-97a939346",         color:"#166534", photo:"/member-ja.jpg" },
];

const CARDS = [
  { icon:"🤖", title:"AI & Tech Sessions",    body:"Live LLM demos, hands-on workshops, and deep dives — demystifying tech for every background." },
  { icon:"💼", title:"Career Acceleration",   body:"CV clinics, mock interviews, LinkedIn optimization, and talks from professionals who've been there." },
  { icon:"🎤", title:"Expert Speaker Series", body:"Professors, entrepreneurs, and alumni sharing strategies, stories, and hard-won lessons." },
  { icon:"🌐", title:"Networking Events",      body:"Online and in-person meetups sparking real connections, collaborations, and lasting friendships." },
  { icon:"📚", title:"Learning Resources",     body:"Session recordings, curated guides, and a growing knowledge library — always free, always on-demand." },
  { icon:"🌙", title:"Values & Leadership",    body:"Islamic and ethical frameworks for navigating tech, entrepreneurship, and life with integrity." },
];

const PILLARS = [
  { icon:"⚡", title:"Tech for Everyone",      body:"We break down AI, coding, and digital tools for all backgrounds — no CS degree required." },
  { icon:"🎯", title:"Career Acceleration",    body:"Practical skills, mentors, and networks that open real doors for young professionals." },
  { icon:"🌙", title:"Values-Driven Growth",   body:"Islamic perspective on leadership, ethics in tech, and building with lasting purpose." },
  { icon:"🤝", title:"Real Community",         body:"Not just followers — a tight-knit group that shows up, shares, and grows together." },
];

/* ══════════════════════════════════════════════════════
   HOOKS
══════════════════════════════════════════════════════ */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useMouseTilt(strength = 8) {
  const ref = useRef(null);
  const onMove = useCallback(e => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width  - 0.5) * strength;
    const y = ((e.clientY - r.top)  / r.height - 0.5) * strength;
    el.style.transform = `perspective(700px) rotateY(${x}deg) rotateX(${-y}deg) translateZ(12px)`;
  }, [strength]);
  const onLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = "perspective(700px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
  }, []);
  return { ref, onMouseMove: onMove, onMouseLeave: onLeave };
}

function useCounter(target, active, suffix = "") {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let cur = 0;
    const step = Math.ceil(target / 50);
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(cur);
      if (cur >= target) clearInterval(t);
    }, 28);
    return () => clearInterval(t);
  }, [active, target]);
  return val + suffix;
}

function useIsMobile(breakpoint = 860) {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= breakpoint : false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);
  return isMobile;
}

function AuthPage({ onSuccess, onCancel }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const isMobile = useIsMobile(760);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("loading");

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload = { email: form.email.trim(), password: form.password.trim() };
    if (mode === "register") payload.name = form.name.trim();

    try {
      const response = await fetch(buildApiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.message || "Unable to complete authentication.");
        setStatus("error");
        return;
      }
      localStorage.setItem(AUTH_TOKEN_KEY, body.token);
      onSuccess(body.user);
    } catch (err) {
      console.error(err);
      setError("Server error. Make sure the auth server is running.");
      setStatus("error");
    }
  };

  return (
    <div style={{ minHeight: isMobile ? "auto" : "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "1rem" : "2rem", background: "radial-gradient(circle at top, rgba(34,197,94,0.12), transparent 28%), #000" }}>
      <div style={{ width: "100%", maxWidth: 980, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr", gap: isMobile ? "1rem" : "2rem", background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 28, overflow: "hidden", boxShadow: `0 30px 80px rgba(0,0,0,0.3)` }}>
        <div style={{ padding: isMobile ? "1.3rem 1rem 0.75rem" : "2.5rem 2rem", display: "flex", flexDirection: "column", justifyContent: "center", gap: "1.2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.85rem", marginBottom: "1rem" }}>
            <div style={{ width: 12, height: 12, borderRadius: 999, background: G }} />
            <span style={{ color: G, textTransform: "uppercase", letterSpacing: "0.16em", fontSize: "0.75rem", fontWeight: 700 }}>CatalystX Community</span>
          </div>
          <h1 style={{ fontFamily: "Orbitron,sans-serif", fontSize: "clamp(2rem,4vw,3.4rem)", lineHeight: 1.05, margin: 0 }}>Welcome to your launchpad.</h1>
          <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8, maxWidth: 540 }}>
            Sign in to connect with the community, access events, and secure your membership. New here? Register and set up your credentials with Mongo Atlas-backed auth.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(2, minmax(0, 1fr))", gap: "0.8rem" }}>
            <button type="button" onClick={() => setMode("login")} style={{ padding: "0.95rem 1.1rem", borderRadius: 999, border: mode === "login" ? `1px solid ${G}` : `1px solid rgba(255,255,255,0.12)`, background: mode === "login" ? "rgba(34,197,94,0.12)" : "transparent", color: "#fff", fontWeight: 700, minHeight: 44, touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}>Sign In</button>
            <button type="button" onClick={() => setMode("register")} style={{ padding: "0.95rem 1.1rem", borderRadius: 999, border: mode === "register" ? `1px solid ${G}` : `1px solid rgba(255,255,255,0.12)`, background: mode === "register" ? "rgba(34,197,94,0.12)" : "transparent", color: "#fff", fontWeight: 700, minHeight: 44, touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}>Register</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: isMobile ? "0.75rem 1rem 1.25rem" : "2.5rem 2rem", display: "flex", flexDirection: "column", gap: "1rem", background: "rgba(0,0,0,0.45)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.85rem", fontWeight: 600 }}>Email address</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required style={{ width: "100%", borderRadius: 16, border: `1px solid rgba(255,255,255,0.14)`, padding: "1rem 1rem", background: "rgba(255,255,255,0.03)", color: "#fff", fontSize: "1rem", minHeight: 44 }} />
          </div>
          {mode === "register" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.85rem", fontWeight: 600 }}>Full name</label>
              <input name="name" type="text" value={form.name} onChange={handleChange} required style={{ width: "100%", borderRadius: 16, border: `1px solid rgba(255,255,255,0.14)`, padding: "1rem 1rem", background: "rgba(255,255,255,0.03)", color: "#fff", fontSize: "1rem", minHeight: 44 }} />
            </div>
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.85rem", fontWeight: 600 }}>Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required style={{ width: "100%", borderRadius: 16, border: `1px solid rgba(255,255,255,0.14)`, padding: "1rem 1rem", background: "rgba(255,255,255,0.03)", color: "#fff", fontSize: "1rem", minHeight: 44 }} />
          </div>
          {error ? <div style={{ color: "#f87171", fontSize: "0.9rem", minHeight: 24 }}>{error}</div> : <div style={{ minHeight: 24 }} />}
          <button type="submit" style={{ marginTop: "0.5rem", padding: "1rem 1.25rem", borderRadius: 16, border: "none", background: G, color: "#000", fontWeight: 700, fontSize: "1rem", minHeight: 48, touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}>
            {status === "loading" ? "Working..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", lineHeight: 1.6, marginTop: "0.5rem" }}>
            {mode === "login" ? "New here? Click Register to create your account and join CatalystX." : "Already have an account? Click Sign In to return to the login form."}
          </p>
        </form>
      </div>
    </div>
  );
}

function WelcomeBanner({ user }) {
  const firstName = user.name?.split(" ")[0] || "Friend";
  return (
    <section style={{ padding: "5rem 2rem 1.5rem", textAlign: "center", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.7rem", marginBottom: "1rem" }}>
        <div style={{ width: 10, height: 10, borderRadius: 999, background: G }} />
        <span style={{ color: "rgba(34,197,94,0.85)", letterSpacing: "0.18em", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>Welcome back</span>
      </div>
      <h2 style={{ fontFamily: "Orbitron,sans-serif", fontSize: "clamp(2rem,4vw,3.5rem)", margin: "0 0 1rem", lineHeight: 1.05 }}>Hello, {firstName}. Your CatalystX community awaits.</h2>
      <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "1rem", lineHeight: 1.75, maxWidth: 680, margin: "0 auto" }}>
        You’re signed in with secure Mongo Atlas-backed auth. Explore sessions, events, and member resources with your team.
      </p>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   THREE.JS PARTICLE SCENE (canvas)
══════════════════════════════════════════════════════ */
function ParticleCanvas() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    // Fallback to 2D if WebGL not available
    if (!gl) {
      const ctx = canvas.getContext("2d");
      let particles = [];
      let raf;

      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        particles = Array.from({ length: 160 }, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 1.4 + 0.3,
          a: Math.random() * 0.55 + 0.1,
          green: Math.random() > 0.65,
        }));
      };
      resize();
      window.addEventListener("resize", resize);
      window.addEventListener("mousemove", e => {
        mouse.current = { x: e.clientX, y: e.clientY };
      });

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
          p.x += p.vx; p.y += p.vy;
          const dx = mouse.current.x - p.x, dy = mouse.current.y - p.y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < 140) { p.x += dx * 0.0012; p.y += dy * 0.0012; }
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.green ? `rgba(34,197,94,${p.a})` : `rgba(255,255,255,${p.a * 0.3})`;
          ctx.fill();
        });
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 100) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(34,197,94,${(1 - dist/100) * 0.14})`;
              ctx.lineWidth = 0.5;
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
        raf = requestAnimationFrame(draw);
      };
      draw();
      return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
    }

    // WebGL path — vertex shader with mouse displacement
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; gl.viewport(0, 0, canvas.width, canvas.height); };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", e => { mouse.current = { x: e.clientX / canvas.width, y: 1 - e.clientY / canvas.height }; });

    const N = 280;
    const pos = new Float32Array(N * 2);
    const vel = new Float32Array(N * 2);
    const col = new Float32Array(N * 4);
    const sizes = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      pos[i*2]   = Math.random() * 2 - 1;
      pos[i*2+1] = Math.random() * 2 - 1;
      vel[i*2]   = (Math.random() - 0.5) * 0.003;
      vel[i*2+1] = (Math.random() - 0.5) * 0.003;
      const green = Math.random() > 0.6;
      col[i*4]   = green ? 0.133 : 1;
      col[i*4+1] = green ? 0.773 : 1;
      col[i*4+2] = green ? 0.369 : 1;
      col[i*4+3] = Math.random() * 0.5 + 0.15;
      sizes[i] = Math.random() * 3 + 1;
    }

    const vs = `attribute vec2 a_pos; attribute vec4 a_col; attribute float a_size;
    uniform vec2 u_mouse; uniform float u_time;
    varying vec4 v_col;
    void main(){
      vec2 p = a_pos;
      vec2 dm = u_mouse - (p * 0.5 + 0.5);
      float dist = length(dm);
      if(dist < 0.18) p += dm * 0.04 * (0.18 - dist) / 0.18;
      p.x += sin(u_time * 0.0008 + p.y * 3.0) * 0.003;
      p.y += cos(u_time * 0.0006 + p.x * 3.0) * 0.003;
      gl_Position = vec4(p, 0, 1);
      gl_PointSize = a_size;
      v_col = a_col;
    }`;
    const fs = `precision mediump float; varying vec4 v_col;
    void main(){
      vec2 c = gl_PointCoord - 0.5;
      float r = length(c) * 2.0;
      if(r > 1.0) discard;
      float alpha = v_col.a * (1.0 - r);
      gl_FragColor = vec4(v_col.rgb, alpha);
    }`;

    const compile = (src, type) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(vs, gl.VERTEX_SHADER));
    gl.attachShader(prog, compile(fs, gl.FRAGMENT_SHADER));
    gl.linkProgram(prog); gl.useProgram(prog);

    const mkBuf = (data, attr) => {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
      const loc = gl.getAttribLocation(prog, attr);
      const size = data.length / N;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      return buf;
    };

    const posBuf  = mkBuf(pos, "a_pos");
    const colBuf  = mkBuf(col, "a_col");
    const sizBuf  = mkBuf(sizes, "a_size");
    const uMouse  = gl.getUniformLocation(prog, "u_mouse");
    const uTime   = gl.getUniformLocation(prog, "u_time");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.viewport(0, 0, canvas.width, canvas.height);

    let raf;
    const loop = (t) => {
      for (let i = 0; i < N; i++) {
        pos[i*2]   += vel[i*2];
        pos[i*2+1] += vel[i*2+1];
        if (pos[i*2] > 1 || pos[i*2] < -1) vel[i*2] *= -1;
        if (pos[i*2+1] > 1 || pos[i*2+1] < -1) vel[i*2+1] *= -1;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uMouse, mouse.current.x, mouse.current.y);
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.POINTS, 0, N);
      raf = requestAnimationFrame(loop);
    };
    loop(0);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <canvas ref={canvasRef} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", width:"100vw", height:"100vh" }} />
  );
}

/* ══════════════════════════════════════════════════════
   LOGO CIRCLE — floating 3D sphere illusion
══════════════════════════════════════════════════════ */
function LogoSphere({ size = 160, glow = true }) {
  const t = useRef(0);
  const divRef = useRef(null);
  useEffect(() => {
    let raf;
    const animate = () => {
      t.current += 0.008;
      if (divRef.current) {
        const y = Math.sin(t.current) * 10;
        const rx = Math.sin(t.current * 0.7) * 4;
        divRef.current.style.transform = `translateY(${y}px) rotateX(${rx}deg) rotateY(${Math.sin(t.current * 0.5) * 6}deg)`;
      }
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={divRef} style={{ width: size, height: size, position:"relative", transformStyle:"preserve-3d", cursor:"default" }}>
      {/* Glow rings */}
      {[1.35, 1.6, 1.9].map((scale, i) => (
        <div key={i} style={{
          position:"absolute", inset:0,
          borderRadius:"50%",
          border:`1px solid rgba(34,197,94,${0.22 - i*0.06})`,
          transform:`scale(${scale})`,
          animation:`spinRing ${10 + i*6}s linear infinite ${i % 2 === 0 ? "" : "reverse"}`,
          pointerEvents:"none",
        }} />
      ))}
      {/* Logo image */}
      <div style={{
        width:"100%", height:"100%",
        borderRadius:"50%",
        border:`2.5px solid ${G}`,
        boxShadow: glow ? `0 0 40px ${GLOW}, 0 0 80px rgba(34,197,94,0.18), inset 0 0 30px rgba(34,197,94,0.05)` : "none",
        overflow:"hidden",
        background:"#000",
        display:"flex", alignItems:"center", justifyContent:"center",
        position:"relative", zIndex:1,
      }}>
        <div style={{
          width:"100%", height:"100%",
          backgroundImage:"url(/SAVE_20260625_193602.jpg)",
          backgroundSize:"cover", backgroundPosition:"center",
          borderRadius:"50%",
        }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   NAV
══════════════════════════════════════════════════════ */
function Nav({ user, onSignOut, onJoinClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile(760);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navStyle = {
    position:"fixed", top:0, left:0, right:0, zIndex:1000,
    display:"flex", alignItems:"center", justifyContent:"space-between",
    flexWrap:"wrap", gap:"0.7rem",
    padding: isMobile ? "0.8rem 1rem" : "1rem 2.5rem",
    background: scrolled ? "rgba(0,0,0,0.92)" : "rgba(0,0,0,0.4)",
    backdropFilter:"blur(20px)",
    borderBottom:`1px solid ${scrolled ? BORDER : "transparent"}`,
    transition:"all 0.4s ease",
  };

  return (
    <nav style={navStyle}>
      <a href="#hero" style={{ display:"flex", alignItems:"center", gap:"0.7rem", textDecoration:"none", flexShrink:0 }}>
        <div style={{ width:40, height:40, borderRadius:"50%", border:`1.5px solid ${G}`, overflow:"hidden", boxShadow:`0 0 14px ${GLOW}` }}>
          <div style={{ width:"100%", height:"100%", backgroundImage:"url(/SAVE_20260625_193602.jpg)", backgroundSize:"cover" }} />
        </div>
        <span style={{ fontFamily:"Orbitron,sans-serif", fontWeight:700, fontSize:"1rem", color:"#fff", letterSpacing:"0.06em" }}>
          Catalyst<span style={{ color:G }}>X</span>
        </span>
      </a>
      <div style={{ display:"flex", gap: isMobile ? "0.6rem" : "1.2rem", alignItems:"center", flexWrap:"wrap", justifyContent:"flex-end", marginLeft:"auto", minWidth:0 }}>
        {!isMobile && ["About","What We Do","Team"].map(l => (
          <a key={l} href={`#${l.toLowerCase().replace(/ /g,"-")}`}
            style={{ color:"rgba(255,255,255,0.6)", textDecoration:"none", fontSize:"0.86rem", fontWeight:500, letterSpacing:"0.04em", transition:"color 0.2s" }}
            onMouseEnter={e => e.target.style.color = G}
            onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.6)"}
          >{l}</a>
        ))}
        <button onClick={onJoinClick} style={{
          padding: isMobile ? "0.55rem 1rem" : "0.55rem 1.4rem",
          background:G, color:"#000", borderRadius:8,
          fontWeight:700, fontSize:"0.84rem", border:"none", letterSpacing:"0.04em",
          boxShadow:`0 0 18px rgba(34,197,94,0.25)`,
          transition:"box-shadow 0.25s, transform 0.2s",
          cursor:"pointer",
        }}
          onMouseEnter={e => { e.target.style.boxShadow = `0 0 35px ${GLOW}`; e.target.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.target.style.boxShadow = `0 0 18px rgba(34,197,94,0.25)`; e.target.style.transform = ""; }}
        >{user ? "Dashboard →" : "Join Us →"}</button>
        {user ? (
          <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", flexWrap:"wrap" }}>
            <span style={{ color:"rgba(255,255,255,0.8)", fontSize:"0.84rem", fontWeight:700 }}>{user.name.split(" ")[0]}</span>
            <button onClick={onSignOut} style={{ whiteSpace:"nowrap", padding:"0.5rem 0.9rem", borderRadius:999, border:`1px solid ${G}`, background:"rgba(34,197,94,0.08)", color:G, fontWeight:700, cursor:"pointer" }}>Sign Out</button>
          </div>
        ) : null}
      </div>
    </nav>
  );
}

/* ══════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════ */
function Hero() {
  const [loaded, setLoaded] = useState(false);
  const isMobile = useIsMobile(720);
  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  const fade = (delay) => ({
    opacity: loaded ? 1 : 0,
    transform: loaded ? "translateY(0)" : "translateY(28px)",
    transition: `opacity 0.8s ${delay}s ease, transform 0.8s ${delay}s ease`,
  });

  return (
    <section id="hero" style={{ position:"relative", zIndex:1, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding: isMobile ? "1.2rem 1rem 1rem" : "2rem 2rem 1.5rem" }}>

      {/* Ambient glow blob */}
      <div style={{ position:"absolute", top:"30%", left:"50%", transform:"translate(-50%,-50%)", width:600, height:600, background:"radial-gradient(ellipse, rgba(34,197,94,0.1) 0%, transparent 65%)", pointerEvents:"none", zIndex:0 }} />

      <div style={{ ...fade(0), position:"relative", zIndex:1 }}>
        <span style={{
          display:"inline-flex", alignItems:"center", gap:"0.5rem",
          background:"rgba(34,197,94,0.1)", border:`1px solid ${BORDER}`,
          color:G, fontSize:"0.75rem", fontWeight:700, letterSpacing:"0.15em",
          textTransform:"uppercase", padding:"0.35rem 1rem", borderRadius:999,
          marginBottom:"1rem",
        }}>
          <span style={{ width:6, height:6, background:G, borderRadius:"50%", display:"inline-block", animation:"pulse 2s infinite" }} />
          Four Minds. One Mission.
        </span>
      </div>

      <div style={{ ...fade(0.1), position:"relative", zIndex:1, marginBottom:"1rem" }}>
        <LogoSphere size={160} />
      </div>

      <h1 style={{
        ...fade(0.25),
        position:"relative", zIndex:1,
        fontFamily:"Orbitron,sans-serif",
        fontSize:"clamp(2.8rem,7vw,4.8rem)",
        fontWeight:800, lineHeight:1.05,
        letterSpacing:"-0.02em",
        background:"linear-gradient(135deg,#fff 30%,#22c55e 100%)",
        WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        backgroundClip:"text",
      }}>
        CATALYST<span style={{ WebkitTextFillColor:G, textShadow:`0 0 32px ${G}` }}>X</span>
      </h1>

      <p style={{ ...fade(0.35), position:"relative", zIndex:1, fontSize:"0.78rem", color:G, letterSpacing:"0.28em", fontWeight:600, textTransform:"uppercase", margin:"1rem 0 1.25rem" }}>
        Learn&nbsp;•&nbsp;Build&nbsp;•&nbsp;Lead
      </p>

      <p style={{ ...fade(0.45), position:"relative", zIndex:1, maxWidth:620, fontSize:"clamp(0.98rem,1.4vw,1.05rem)", color:"rgba(255,255,255,0.65)", lineHeight:1.8, fontWeight:300, marginBottom:"1rem" }}>
        <strong style={{ color:"#fff", fontWeight:600 }}>Four minds</strong> coming together at one point to create{" "}
        <strong style={{ color:"#fff", fontWeight:600 }}>impact, innovation</strong> and{" "}
        <strong style={{ color:"#fff", fontWeight:600 }}>opportunities</strong> for young people — tech and non-tech alike.
      </p>

      <div style={{ ...fade(0.55), position:"relative", zIndex:1, display:"flex", gap: isMobile ? "0.75rem" : "1rem", flexWrap:"wrap", justifyContent:"center", width:"100%" }}>
        <GlowBtn href="#join" primary fullWidth={isMobile}>Join the Community</GlowBtn>
        <GlowBtn href="#about" fullWidth={isMobile}>Discover More ↓</GlowBtn>
      </div>

      {/* Scroll indicator */}
      {/* <div style={{ position:"absolute", bottom:"2rem", left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:"0.4rem", opacity:0.5 }}>
        <div style={{ width:1, height:44, background:`linear-gradient(to bottom, ${G}, transparent)`, animation:"scrollPulse 1.8s ease-in-out infinite" }} />
        <span style={{ fontSize:"0.7rem", letterSpacing:"0.12em", textTransform:"uppercase", color:G }}>scroll</span>
      </div> */}
    </section>
  );
}

function GlowBtn({ href, children, primary, fullWidth }) {
  const base = {
    display:"inline-flex", justifyContent:"center", alignItems:"center", padding:"0.88rem 2.2rem",
    borderRadius:10, fontWeight:700, fontSize:"0.92rem",
    textDecoration:"none", letterSpacing:"0.04em",
    transition:"all 0.25s ease", position:"relative", overflow:"hidden",
    width: fullWidth ? "100%" : "auto",
    maxWidth: fullWidth ? "320px" : "none",
  };
  const styles = primary
    ? { ...base, background:G, color:"#000", boxShadow:`0 0 22px rgba(34,197,94,0.3)` }
    : { ...base, background:"transparent", color:"#fff", border:"1px solid rgba(255,255,255,0.22)" };

  return (
    <a href={href} style={styles}
      onMouseEnter={e => {
        if (primary) { e.currentTarget.style.boxShadow = `0 0 45px ${GLOW}`; e.currentTarget.style.transform = "translateY(-3px) scale(1.03)"; }
        else { e.currentTarget.style.borderColor = G; e.currentTarget.style.color = G; e.currentTarget.style.transform = "translateY(-3px)"; }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        if (primary) e.currentTarget.style.boxShadow = `0 0 22px rgba(34,197,94,0.3)`;
        else { e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; e.currentTarget.style.color = "#fff"; }
      }}
    >{children}</a>
  );
}

/* ══════════════════════════════════════════════════════
   STATS
══════════════════════════════════════════════════════ */
function Stats() {
  const [ref, visible] = useInView();
  const isMobile = useIsMobile(640);
  const stats = [
    { target:4,    suffix:"",  label:"Co-Founders" },
    { target:100,  suffix:"+", label:"Target Members" },
    { target:6,    suffix:"+", label:"Monthly Events" },
    { target:2,    suffix:"",  label:"Months to Launch" },
  ];
  return (
    <div ref={ref} id="stats" style={{
      position:"relative", zIndex:1,
      background:"linear-gradient(90deg,rgba(34,197,94,0.06),rgba(34,197,94,0.02))",
      borderTop:`1px solid ${BORDER}`, borderBottom:`1px solid ${BORDER}`,
      padding: isMobile ? "1rem 1rem" : "1.2rem 2rem",
    }}>
      <div style={{ maxWidth:1000, margin:"0 auto", display:"grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4,1fr)", gap:"1rem", textAlign:"center" }}>
        {stats.map((s, i) => <StatItem key={i} {...s} active={visible} delay={i * 0.08} />)}
      </div>
    </div>
  );
}

function StatItem({ target, suffix, label, active, delay }) {
  const val = useCounter(target, active, suffix);
  return (
    <div style={{ opacity: active ? 1 : 0, transform: active ? "translateY(0)" : "translateY(20px)", transition:`opacity 0.6s ${delay}s, transform 0.6s ${delay}s` }}>
      <div style={{ fontFamily:"Orbitron,sans-serif", fontSize:"clamp(2rem,4vw,3rem)", fontWeight:900, color:G, lineHeight:1 }}>{val}</div>
      <div style={{ fontSize:"0.78rem", color:"rgba(255,255,255,0.5)", marginTop:"0.4rem", letterSpacing:"0.08em", textTransform:"uppercase" }}>{label}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ABOUT
══════════════════════════════════════════════════════ */
function About() {
  const [ref, visible] = useInView();
  const isMobile = useIsMobile(760);
  return (
    <section id="about" ref={ref} style={{ position:"relative", zIndex:1, padding: isMobile ? "1.5rem 1rem" : "2.5rem 2rem", maxWidth:1100, margin:"0 auto" }}>
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.9fr", gap: isMobile ? "1.25rem" : "1rem", alignItems:"center" }}>

        {/* Content side */}
        <div style={{ opacity:visible?1:0, transform:visible?"translateX(0)":"translateX(-40px)", transition:"all 0.9s ease", maxWidth:540 }}>
          <span style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color:G }}>Our Purpose</span>
          <h2 style={{ fontFamily:"Orbitron,sans-serif", fontSize:"clamp(1.8rem,3vw,2.4rem)", fontWeight:700, lineHeight:1.2, margin:"0.4rem 0 0.8rem" }}>
            Why We Built<br />CatalystX
          </h2>
          <p style={{ color:"rgba(255,255,255,0.68)", fontSize:"clamp(0.95rem,1.15vw,1rem)", lineHeight:1.85, marginBottom:"1rem" }}>
            We saw a gap — young people full of potential, lacking direction, community, and real opportunities.
            CatalystX exists to close that gap, combining technology, career growth, and meaningful dialogue in one space.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.9rem" }}>
            {PILLARS.map((p, i) => <PillarRow key={i} {...p} delay={i * 0.08} visible={visible} />)}
          </div>
        </div>

        {/* Visual side */}
        <div style={{ display:"flex", justifyContent: isMobile ? "center" : "flex-end", opacity:visible?1:0, transform:visible?"translateX(0)":"translateX(40px)", transition:"all 0.9s 0.15s ease" }}>
          <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <LogoSphere size={isMobile ? 180 : 240} />
          </div>
        </div>
      </div>
    </section>
  );
}

function PillarRow({ icon, title, body, visible, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display:"flex", gap:"1rem", alignItems:"flex-start",
        padding:"1rem 1.3rem", borderRadius:12,
        background: hov ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${hov ? "rgba(34,197,94,0.4)" : BORDER}`,
        transition:"all 0.25s ease",
        transform: hov ? "translateX(6px)" : "",
        opacity: visible ? 1 : 0,
        transitionDelay: `${delay}s`,
        cursor:"default",
      }}
    >
      <div style={{ width:38, height:38, borderRadius:9, background:"rgba(34,197,94,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontWeight:600, fontSize:"0.92rem", marginBottom:"0.2rem" }}>{title}</div>
        <div style={{ fontSize:"0.82rem", color:"rgba(255,255,255,0.5)", lineHeight:1.55 }}>{body}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   WHAT WE DO
══════════════════════════════════════════════════════ */
function WhatWeDo() {
  const [ref, visible] = useInView();
  const isMobile = useIsMobile(760);
  return (
    <section id="what-we-do" ref={ref} style={{ position:"relative", zIndex:1, padding: isMobile ? "1.5rem 1rem" : "2.5rem 2rem", background:"#080808", borderTop:`1px solid ${BORDER}`, borderBottom:`1px solid ${BORDER}` }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:"1rem", opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(24px)", transition:"all 0.7s ease" }}>
          <span style={{ fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:G }}>What We Do</span>
          <h2 style={{ fontFamily:"Orbitron,sans-serif", fontSize:"clamp(1.8rem,4vw,3rem)", fontWeight:700, margin:"0.6rem 0 0.8rem" }}>Everything You Need<br />to Level Up</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", maxWidth:520, margin:"0 auto", lineHeight:1.7 }}>
            Whether you're a coder or a creative — there's a seat at the table for you.
          </p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap:"0.8rem" }}>
          {CARDS.map((c, i) => <ServiceCard key={i} {...c} visible={visible} delay={i * 0.07} />)}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ icon, title, body, visible, delay }) {
  const tilt = useMouseTilt(7);
  const [hov, setHov] = useState(false);
  return (
    <div
      {...tilt}
      onMouseEnter={e => { tilt.onMouseMove(e); setHov(true); }}
      onMouseLeave={e => { tilt.onMouseLeave(e); setHov(false); }}
      style={{
        background: hov ? "rgba(34,197,94,0.04)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${hov ? "rgba(34,197,94,0.5)" : BORDER}`,
        borderRadius:16, padding:"2rem 1.8rem",
        position:"relative", overflow:"hidden",
        transition:"border-color 0.3s, box-shadow 0.3s, background 0.3s",
        boxShadow: hov ? `0 20px 60px rgba(34,197,94,0.1), 0 0 0 1px rgba(34,197,94,0.15)` : "none",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transitionDuration: "0.65s",
        transitionDelay: `${delay}s`,
        cursor:"default",
      }}
    >
      {/* Top glow bar */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${G},transparent)`, opacity: hov ? 1 : 0, transition:"opacity 0.3s" }} />
      {/* Corner accent */}
      <div style={{ position:"absolute", bottom:0, right:0, width:60, height:60, background:`radial-gradient(circle at 100% 100%, rgba(34,197,94,0.08), transparent 70%)`, pointerEvents:"none" }} />

      <div style={{ width:52, height:52, borderRadius:13, background:"rgba(34,197,94,0.1)", border:`1px solid rgba(34,197,94,0.2)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", marginBottom:"0.8rem" }}>{icon}</div>
      <h3 style={{ fontSize:"1rem", fontWeight:700, marginBottom:"0.55rem" }}>{title}</h3>
      <p style={{ fontSize:"0.84rem", color:"rgba(255,255,255,0.5)", lineHeight:1.65 }}>{body}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TEAM
══════════════════════════════════════════════════════ */
function Team() {
  const [ref, visible] = useInView();
  const isMobile = useIsMobile(760);
  return (
    <section id="team" ref={ref} style={{ position:"relative", zIndex:1, padding: isMobile ? "1.5rem 1rem" : "2.5rem 2rem", maxWidth:1100, margin:"0 auto" }}>
      <div style={{ textAlign:"center", marginBottom:"1rem", opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(24px)", transition:"all 0.7s ease" }}>
        <span style={{ fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:G }}>The Founders</span>
        <h2 style={{ fontFamily:"Orbitron,sans-serif", fontSize:"clamp(1.8rem,4vw,3rem)", fontWeight:700, margin:"0.6rem 0 0.8rem" }}>Four Minds.<br />One Mission.</h2>
        <p style={{ color:"rgba(255,255,255,0.5)", maxWidth:480, margin:"0 auto", lineHeight:1.7 }}>
          United by the belief that community is the greatest catalyst for growth.
        </p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4,1fr)", gap:"1rem" }}>
        {TEAM.map((m, i) => <MemberCard key={i} {...m} visible={visible} delay={i * 0.1} />)}
      </div>
    </section>
  );
}

function MemberCard({ initials, name, role, sub, li, color, photo, visible, delay }) {
  const tilt = useMouseTilt(10);
  const [hov, setHov] = useState(false);
  return (
    <div
      {...tilt}
      onMouseEnter={e => { tilt.onMouseMove(e); setHov(true); }}
      onMouseLeave={e => { tilt.onMouseLeave(e); setHov(false); }}
      style={{
        background: hov ? "rgba(34,197,94,0.04)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${hov ? "rgba(34,197,94,0.5)" : BORDER}`,
        borderRadius:18, padding:"2.2rem 1.6rem",
        textAlign:"center", position:"relative", overflow:"hidden",
        transition:"border-color 0.3s, box-shadow 0.3s, background 0.3s",
        boxShadow: hov ? `0 25px 60px rgba(34,197,94,0.1)` : "none",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transitionDuration:"0.65s",
        transitionDelay:`${delay}s`,
        cursor:"default",
      }}
    >
      {/* Radial highlight */}
      <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:"100%", height:120, background:`radial-gradient(ellipse at 50% 0%, rgba(34,197,94,${hov?"0.12":"0.04"}) 0%, transparent 70%)`, transition:"all 0.3s", pointerEvents:"none" }} />

      {/* Avatar */}
      <div style={{
        width:88, height:88, borderRadius:"50%", overflow:"hidden",
        background:`linear-gradient(135deg, ${color}, #052e16)`,
        border: `2px solid rgba(34,197,94,${hov?"0.7":"0.3"})`,
        boxShadow: hov ? `0 0 30px ${GLOW}` : "none",
        display:"flex", alignItems:"center", justifyContent:"center",
        margin:"0 auto 0.8rem",
        transition:"all 0.3s",
        position:"relative", zIndex:1,
      }}>
        {photo ? (
          <img src={photo} alt={name} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
        ) : (
          <span style={{ fontFamily:"Orbitron,sans-serif", fontWeight:900, fontSize:"1.5rem", color:"#fff" }}>{initials}</span>
        )}
      </div>

      <div style={{ fontWeight:700, fontSize:"0.95rem", marginBottom:"0.25rem", position:"relative", zIndex:1 }}>{name}</div>
      <div style={{ color:G, fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:"0.2rem", position:"relative", zIndex:1 }}>{role}</div>
      <div style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.76rem", marginBottom:"0.8rem", position:"relative", zIndex:1 }}>{sub}</div>

      <a href={li} target="_blank" rel="noreferrer" style={{
        display:"inline-flex", alignItems:"center", gap:"0.4rem",
        fontSize:"0.74rem", color: hov ? G : "rgba(255,255,255,0.45)",
        border:`1px solid ${hov ? G : BORDER}`,
        padding:"0.32rem 0.9rem", borderRadius:999, textDecoration:"none",
        transition:"all 0.25s", position:"relative", zIndex:1,
      }}
        onMouseEnter={e => { e.currentTarget.style.color = G; e.currentTarget.style.borderColor = G; }}
        onMouseLeave={e => { e.currentTarget.style.color = hov ? G : "rgba(255,255,255,0.45)"; e.currentTarget.style.borderColor = hov ? G : BORDER; }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        LinkedIn
      </a>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   JOIN
══════════════════════════════════════════════════════ */
function Join({ onJoinClick, isLoggedIn }) {
  const [ref, visible] = useInView();
  const isMobile = useIsMobile(760);

  return (
    <section id="join" ref={ref} style={{
      position:"relative", zIndex:1,
      padding: isMobile ? "1.5rem 1rem" : "2.5rem 2rem",
      background:"#080808",
      borderTop:`1px solid ${BORDER}`,
      textAlign:"center", overflow:"hidden",
    }}>
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:700, height:400, background:"radial-gradient(ellipse, rgba(34,197,94,0.1) 0%, transparent 65%)", pointerEvents:"none" }} />

      <div style={{ position:"relative", zIndex:1, maxWidth:600, margin:"0 auto" }}>
        <span style={{ fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:G, opacity:visible?1:0, transition:"opacity 0.7s", display:"block", marginBottom:"0.5rem" }}>Be Part of Something</span>
        <h2 style={{ fontFamily:"Orbitron,sans-serif", fontSize:"clamp(2rem,5vw,3.5rem)", fontWeight:700, margin:"0.4rem 0 1.2rem", opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(20px)", transition:"all 0.7s 0.1s ease" }}>
          Ready to Ignite<br />Your Potential?
        </h2>
        <p style={{ color:"rgba(255,255,255,0.5)", lineHeight:1.75, marginBottom:"1.6rem", opacity:visible?1:0, transition:"opacity 0.7s 0.2s" }}>
          {isLoggedIn ? "Welcome back! Explore events, resources, and opportunities." : "Join CatalystX and become part of a thriving community. Sign up now to access exclusive events and resources."}
        </p>
        {!isLoggedIn && (
          <button onClick={onJoinClick} style={{
            padding:"0.95rem 2.4rem", background:G, color:"#000",
            border:"none", borderRadius:10, fontWeight:700, fontSize:"1rem",
            cursor:"pointer", opacity:visible?1:0, transition:"all 0.5s 0.3s",
            transform:visible?"scale(1)":"scale(0.9)",
            boxShadow:`0 0 20px rgba(34,197,94,0.3)`,
          }}
          onMouseEnter={e => { e.target.style.boxShadow=`0 0 40px rgba(34,197,94,0.6)`; e.target.style.transform="scale(1.05)"; }}
          onMouseLeave={e => { e.target.style.boxShadow=`0 0 20px rgba(34,197,94,0.3)`; e.target.style.transform="scale(1)"; }}>
            Join Us Now
          </button>
        )}
        {isLoggedIn && (
          <div style={{ padding:"1.2rem 2rem", background:"rgba(34,197,94,0.1)", border:`1px solid ${G}`, borderRadius:12, color:G, fontWeight:600, fontSize:"1rem" }}>
            ✓ You're already part of the community!
          </div>
        )}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════ */
function Footer() {
  const isMobile = useIsMobile(760);
  return (
    <footer style={{ position:"relative", zIndex:1, background:"#000", borderTop:`1px solid ${BORDER}`, padding:isMobile ? "1.2rem 1rem 1rem" : "1.5rem 1.8rem 1rem" }}>
      <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr", gap:"1rem", marginBottom:"1rem" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1rem" }}>
            <div style={{ width:36, height:36, borderRadius:"50%", border:`1.5px solid ${G}`, overflow:"hidden", boxShadow:`0 0 10px ${GLOW}` }}>
              <div style={{ width:"100%", height:"100%", backgroundImage:"url(/SAVE_20260625_193602.jpg)", backgroundSize:"cover" }} />
            </div>
            <span style={{ fontFamily:"Orbitron,sans-serif", fontWeight:700, fontSize:"1rem" }}>Catalyst<span style={{ color:G }}>X</span></span>
          </div>
          <p style={{ fontSize:"0.82rem", color:"rgba(255,255,255,0.4)", lineHeight:1.7, maxWidth:300 }}>
            Four minds. One mission. Creating impact, innovation, and opportunities for young people — in tech and beyond.
          </p>
        </div>
        {[
          { head:"Navigate", links:[["About","#about"],["What We Do","#what-we-do"],["Team","#team"],["Join","#join"]] },
          { head:"Connect",  links:[["Instagram","https://www.instagram.com/catalystx_official_?igsh=OTJiMjRmNDd1em9x"],["LinkedIn","https://www.linkedin.com/in/catalyst-x-116919419?utm_source=share_via&utm_content=profile&utm_medium=member_android"],["Facebook","https://www.facebook.com/share/1BtqXpGako/"],["WhatsApp","https://chat.whatsapp.com/G2sHPQAiEy76sNUcFAjsGD"]] },
        ].map(col => (
          <div key={col.head}>
            <h5 style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color:G, marginBottom:"1rem" }}>{col.head}</h5>
            <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:"0.55rem" }}>
              {col.links.map(([l, h]) => (
                <li key={l}><a href={h} style={{ color:"rgba(255,255,255,0.45)", fontSize:"0.85rem", textDecoration:"none", transition:"color 0.2s" }}
                  onMouseEnter={e => e.target.style.color = "#fff"}
                  onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.45)"}
                >{l}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ maxWidth:1100, margin:"0 auto", paddingTop:"1.5rem", borderTop:`1px solid ${BORDER}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"0.75rem" }}>
        <span style={{ fontSize:"0.76rem", color:"rgba(255,255,255,0.3)" }}>© 2026 CatalystX. Built with purpose.</span>
        <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
          {["LEARN","BUILD","LEAD"].map(p => (
            <span key={p} style={{ padding:"0.22rem 0.75rem", background:"rgba(34,197,94,0.08)", border:`1px solid ${BORDER}`, borderRadius:999, fontSize:"0.68rem", fontWeight:700, color:G, letterSpacing:"0.08em" }}>{p}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════
   CUSTOM CURSOR
══════════════════════════════════════════════════════ */
function CustomCursor() {
  // dot  = the sharp inner cursor, snaps instantly to mouse
  // ring = the larger trailing ring, lerps behind
  // Both positions tracked with refs to avoid re-renders
  const dotRef  = useRef(null);
  const ringRef = useRef(null);

  // raw mouse position
  const mouse   = useRef({ x: -200, y: -200 });
  // smoothed ring position
  const ring    = useRef({ x: -200, y: -200 });
  // current ring scale (1 normally, bigger on hover, 0 on click)
  const scale   = useRef(1);
  const targetScale = useRef(1);

  useEffect(() => {
    let raf;

    // ── Track raw mouse ──
    const onMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    // ── Hover state: enlarge ring over interactive elements ──
    const onEnter = () => { targetScale.current = 2.6; };
    const onLeave = () => { targetScale.current = 1; };

    // ── Click burst: squeeze then expand ──
    const onDown = () => { targetScale.current = 0.55; };
    const onUp   = () => { targetScale.current = 1; };

    // Attach hover listeners to all buttons, links, inputs
    const attach = () => {
      document.querySelectorAll("a,button,input,[data-cursor]").forEach(el => {
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
      });
    };
    attach();
    // Re-attach when DOM changes (for dynamically rendered elements)
    const mutObs = new MutationObserver(attach);
    mutObs.observe(document.body, { childList:true, subtree:true });

    window.addEventListener("mousemove",  onMove);
    window.addEventListener("mousedown",  onDown);
    window.addEventListener("mouseup",    onUp);

    // ── RAF loop: lerp the ring ──
    const lerp = (a, b, t) => a + (b - a) * t;

    const tick = () => {
      // Dot snaps immediately
      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate(${mouse.current.x - 4}px, ${mouse.current.y - 4}px)`;
      }

      // Ring lags (lerp speed: 0.12 = heavy drag, 0.18 = balanced)
      ring.current.x = lerp(ring.current.x, mouse.current.x, 0.14);
      ring.current.y = lerp(ring.current.y, mouse.current.y, 0.14);
      scale.current  = lerp(scale.current, targetScale.current, 0.1);

      if (ringRef.current) {
        // ring is 36px, so offset by 18 to center
        ringRef.current.style.transform =
          `translate(${ring.current.x - 18}px, ${ring.current.y - 18}px) scale(${scale.current})`;
      }

      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
      mutObs.disconnect();
    };
  }, []);

  const shared = {
    position: "fixed",
    top: 0, left: 0,
    pointerEvents: "none",
    zIndex: 99999,
    willChange: "transform",
  };

  return (
    <>
      {/* ── Inner dot ── sharp, instant */}
      <div ref={dotRef} style={{
        ...shared,
        width: 8, height: 8,
        borderRadius: "50%",
        background: G,
        boxShadow: `0 0 8px ${G}, 0 0 16px rgba(34,197,94,0.6)`,
        transition: "opacity 0.2s",
      }} />

      {/* ── Outer ring ── lagging, elegant */}
      <div ref={ringRef} style={{
        ...shared,
        width: 36, height: 36,
        borderRadius: "50%",
        border: `1.5px solid rgba(34,197,94,0.7)`,
        // subtle green tint fill so the ring is never invisible on dark bg
        background: "rgba(34,197,94,0.04)",
        boxShadow: `0 0 12px rgba(34,197,94,0.25), inset 0 0 8px rgba(34,197,94,0.05)`,
        transition: "opacity 0.2s",
      }} />

      {/* Trailing particle sparks — 4 micro-dots that follow with increasing lag */}
      {[0.22, 0.32, 0.42, 0.52].map((lag, i) => (
        <TrailDot key={i} lag={lag} mouse={mouse} size={3 - i * 0.4} opacity={0.5 - i * 0.1} />
      ))}
    </>
  );
}

/* ── Individual trailing spark dot ── */
function TrailDot({ lag, mouse, size, opacity }) {
  const ref  = useRef(null);
  const pos  = useRef({ x: -200, y: -200 });

  useEffect(() => {
    let raf;
    const lerp = (a, b, t) => a + (b - a) * t;
    const tick = () => {
      pos.current.x = lerp(pos.current.x, mouse.current.x, lag);
      pos.current.y = lerp(pos.current.y, mouse.current.y, lag);
      if (ref.current) {
        ref.current.style.transform =
          `translate(${pos.current.x - size / 2}px, ${pos.current.y - size / 2}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [lag, mouse, size]);

  return (
    <div ref={ref} style={{
      position:"fixed", top:0, left:0,
      width: size, height: size,
      borderRadius: "50%",
      background: G,
      opacity,
      pointerEvents:"none",
      zIndex: 99998,
      willChange:"transform",
      boxShadow: `0 0 ${size * 2}px rgba(34,197,94,0.5)`,
    }} />
  );
}

/* ══════════════════════════════════════════════════════
   KEYFRAME INJECTION
══════════════════════════════════════════════════════ */
const KEYFRAMES = `
  @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.8);opacity:0.4} }
  @keyframes scrollPulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
  @keyframes spinRing { from{transform:rotate(0deg) scale(var(--s,1))} to{transform:rotate(360deg) scale(var(--s,1))} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
`;

/* ══════════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════════ */
/* ──────────────────────────────────────────────────────────
   AUTH MODAL WRAPPER
────────────────────────────────────────────────────────── */
function AuthModal({ isOpen, onClose, onSuccess }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0,
      width: "100%", height: "100%",
      background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10000,
      padding: "1rem",
      overflowY: "auto",
      backdropFilter: "blur(4px)",
    }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 980 }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "-2.5rem", right: 0,
            background: "none", border: "none",
            color: "#fff", fontSize: "2rem",
            cursor: "pointer", padding: 0,
            zIndex: 10001,
          }}
        >
          ✕
        </button>
        <AuthPage onSuccess={onSuccess} onCancel={onClose} />
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(AUTH_TOKEN_KEY) || "");
  const [loadingAuth, setLoadingAuth] = useState(!!token);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS + KEYFRAMES;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  /* Verify token if it exists (on app load) */
  useEffect(() => {
    if (!token) {
      setLoadingAuth(false);
      return;
    }

    setLoadingAuth(true);
    fetch(buildApiUrl("/api/auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Auth failed");
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken("");
        setUser(null);
      })
      .finally(() => setLoadingAuth(false));
  }, [token]);

  const handleAuthSuccess = (user) => {
    setUser(user);
    setToken(localStorage.getItem(AUTH_TOKEN_KEY) || "");
    setShowAuthModal(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setToken("");
  };

  if (loadingAuth) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#000", color: "#fff" }}>
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 420 }}>
          <div style={{ fontSize: "1rem", letterSpacing: "0.24em", textTransform: "uppercase", color: G, marginBottom: "1rem" }}>CatalystX</div>
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", margin: 0 }}>Checking your session...</h1>
          <p style={{ color: "rgba(255,255,255,0.7)", marginTop: "1rem" }}>Hang tight while we connect to your community account.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <CustomCursor />
      <ParticleCanvas />
      <Nav user={user} onSignOut={handleSignOut} onJoinClick={() => setShowAuthModal(true)} />
      {user ? <WelcomeBanner user={user} /> : null}
      <Hero />
      <Stats />
      <About />
      <WhatWeDo />
      <Team />
      <Join onJoinClick={() => setShowAuthModal(true)} isLoggedIn={!!user} />
      <Footer />
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={handleAuthSuccess} 
      />
    </div>
  );
}
