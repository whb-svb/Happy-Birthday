//  【第一层】3D 粒子生日蛋糕
(function() {
    const canvas = document.getElementById('cakeCanvas');
    const ctx = canvas.getContext('2d');
  
    let W, H;
    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
  
    //自动旋转
    let camDist = 320;
    let camYaw = 0;
    let camPitch = 0.5;
    let camTargetX = 0, camTargetY = 20, camTargetZ = 0;
    let autoRotate = true;  
    const FOV = 500;
  
    // 鼠标控制
    let isDragging = false, isPanning = false;
    let lastMX = 0, lastMY = 0;
    canvas.addEventListener('mousedown', e => {
      if (e.button === 0) isDragging = true;
      if (e.button === 2) isPanning = true;
      lastMX = e.clientX; lastMY = e.clientY;
    });
    window.addEventListener('mouseup', () => { isDragging = false; isPanning = false; });
    window.addEventListener('mousemove', e => {
      const dx = e.clientX - lastMX, dy = e.clientY - lastMY;
      if (isDragging) {
        camYaw -= dx * 0.008;
        camPitch -= dy * 0.008;
        camPitch = Math.max(-1.2, Math.min(1.3, camPitch));
      }
      if (isPanning) {
        const pan = camDist * 0.002;
        camTargetX -= dx * pan * Math.cos(camYaw);
        camTargetZ += dx * pan * Math.sin(camYaw);
        camTargetY += dy * pan;
      }
      lastMX = e.clientX; lastMY = e.clientY;
    });
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      camDist += e.deltaY * 0.15;
      camDist = Math.max(100, Math.min(700, camDist));
    }, { passive: false });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  
    function rotateY(x, y, z, a) {
      const c = Math.cos(a), s = Math.sin(a);
      return [x*c + z*s, y, -x*s + z*c];
    }
    function rotateX(x, y, z, a) {
      const c = Math.cos(a), s = Math.sin(a);
      return [x, y*c - z*s, y*s + z*c];
    }
    function project(x, y, z) {
      x -= camTargetX; y -= camTargetY; z -= camTargetZ;
      let p = rotateY(x, y, z, camYaw);
      p = rotateX(p[0], p[1], p[2], camPitch);
      const zc = p[2] + camDist;
      if (zc < 10) return null;
      const sc = FOV / zc;
      return { x: W/2 + p[0]*sc, y: H/2 - p[1]*sc, z: zc, scale: sc };
    }
  
    class CakeParticle {
      constructor(tx, ty, tz, r, g, b, type) {
        this.tx = tx; this.ty = ty; this.tz = tz;
        this.x = tx + (Math.random()-0.5)*600;
        this.y = ty + (Math.random()-0.5)*600;
        this.z = tz + (Math.random()-0.5)*600;
        this.vx = 0; this.vy = 0; this.vz = 0;
        this.r = r; this.g = g; this.b = b;
        this.type = type;
        this.baseTx = tx; this.baseTy = ty; this.baseTz = tz;
      }
      update(time) {
        if (this.type === 2) {
          if (candlesLit) {
            this.tx = this.baseTx + Math.sin(time*3 + this.x) * 1.2;
            this.ty = this.baseTy + ((time*10 + this.z) % 14);
            this.tz = this.baseTz + Math.cos(time*2.5 + this.y) * 1.2;
          } else {
            this.ty += 0.3;
            this.tx += (Math.random()-0.5)*0.15;
            this.tz += (Math.random()-0.5)*0.15;
          }
        }
        this.vx += (this.tx - this.x) * 0.02;
        this.vy += (this.ty - this.y) * 0.02;
        this.vz += (this.tz - this.z) * 0.02;
        this.vx *= 0.9; this.vy *= 0.9; this.vz *= 0.9;
        this.x += this.vx; this.y += this.vy; this.z += this.vz;
      }
      explode() {
        this.vx = (Math.random()-0.5)*50;
        this.vy = (Math.random()-0.5)*50 + 15;
        this.vz = (Math.random()-0.5)*50;
      }
    }
  
    let particles = [];
    let candlesLit = true;
    let time = 0;
  
    function hexToRgb(hex) {
      return [parseInt(hex.slice(1,3),16)/255, parseInt(hex.slice(3,5),16)/255, parseInt(hex.slice(5,7),16)/255];
    }
  
    function buildCake() {
      particles = [];
      const layers = [
        { r: 45, h: 24, y: 0,   cTop: '#e6a8d7', cBot: '#ba68c8', border: '#8e24aa' },
        { r: 34, h: 22, y: 26,  cTop: '#ffe4b5', cBot: '#deb887', border: '#cd853f' },
        { r: 24, h: 20, y: 50,  cTop: '#ffb6c1', cBot: '#ff69b4', border: '#ff1493' },
      ];
      layers.forEach((layer, li) => {
        const ct = hexToRgb(layer.cTop), cb = hexToRgb(layer.cBot), bb = hexToRgb(layer.border);
        for (let r = 5; r <= layer.r; r += 5) {
          const count = Math.max(10, Math.floor(2*Math.PI*r/5));
          for (let i = 0; i < count; i++) {
            const angle = (i/count)*Math.PI*2;
            const x = Math.cos(angle)*r, z = Math.sin(angle)*r;
            for (let y = layer.y - layer.h/2 + 4; y < layer.y + layer.h/2; y += 5) {
              const t = (y - (layer.y - layer.h/2)) / layer.h;
              particles.push(new CakeParticle(x, y, z, ct[0]*(1-t)+cb[0]*t, ct[1]*(1-t)+cb[1]*t, ct[2]*(1-t)+cb[2]*t, 0));
            }
          }
        }
        for (let i = 0; i < 100; i++) {
          const angle = (i/100)*Math.PI*2;
          particles.push(new CakeParticle(Math.cos(angle)*layer.r, layer.y+layer.h/2, Math.sin(angle)*layer.r, bb[0],bb[1],bb[2], 0));
          particles.push(new CakeParticle(Math.cos(angle)*layer.r, layer.y-layer.h/2, Math.sin(angle)*layer.r, bb[0],bb[1],bb[2], 0));
        }
        if (li < 2) {
          for (let d = 0; d < 14; d++) {
            const angle = (d/14)*Math.PI*2 + 0.2;
            const dropLen = 4 + Math.sin(d*1.7)*3;
            for (let y = layer.y - layer.h/2; y > layer.y - layer.h/2 - dropLen; y -= 2) {
              particles.push(new CakeParticle(Math.cos(angle)*layer.r, y, Math.sin(angle)*layer.r, 1,1,1, 0));
            }
          }
        }
        const sc = ['#ff4081','#ffd740','#69f0ae','#40c4ff','#e040fb','#ff6e40'];
        for (let s = 0; s < 16; s++) {
          const angle = Math.random()*Math.PI*2;
          const r = layer.r*(0.3+Math.random()*0.6);
          const col = hexToRgb(sc[s%sc.length]);
          particles.push(new CakeParticle(Math.cos(angle)*r, layer.y+(Math.random()-0.5)*layer.h*0.5, Math.sin(angle)*r, col[0],col[1],col[2], 3));
        }
      });
      const plateR = 58;
      for (let r = 8; r <= plateR; r += 5) {
        const count = Math.max(12, Math.floor(2*Math.PI*r/5));
        for (let i = 0; i < count; i++) {
          const angle = (i/count)*Math.PI*2;
          const y = -16 + Math.sin((r/plateR)*Math.PI)*2.5;
          particles.push(new CakeParticle(Math.cos(angle)*r, y, Math.sin(angle)*r, 0.35,0.35,0.4, 4));
        }
      }
      for (let i = 0; i < 140; i++) {
        const angle = (i/140)*Math.PI*2;
        particles.push(new CakeParticle(Math.cos(angle)*plateR, -14, Math.sin(angle)*plateR, 0.5,0.5,0.55, 4));
      }
      const candleColors = ['#ff6b6b','#4ecdc4','#ffe66d','#a8e6cf','#c9b1ff'];
      const topY = layers[2].y + layers[2].h/2;
      const candleH = 18, candleY = topY + candleH/2;
      for (let i = 0; i < 5; i++) {
        const angle = (i/5)*Math.PI*2;
        const cx = Math.cos(angle)*11, cz = Math.sin(angle)*11;
        const cc = hexToRgb(candleColors[i]);
        for (let y = candleY - candleH/2; y <= candleY + candleH/2; y += 2.5) {
          for (let a = 0; a < 6; a++) {
            const ca = (a/6)*Math.PI*2;
            particles.push(new CakeParticle(cx+Math.cos(ca)*2.5, y, cz+Math.sin(ca)*2.5, cc[0],cc[1],cc[2], 1));
          }
        }
        particles.push(new CakeParticle(cx, candleY+candleH/2, cz, cc[0],cc[1],cc[2], 1));
        const fc = [hexToRgb('#ffeb3b'), hexToRgb('#ff9800'), hexToRgb('#ff5722')];
        for (let f = 0; f < 25; f++) {
          const col = fc[Math.floor(Math.random()*fc.length)];
          particles.push(new CakeParticle(cx+(Math.random()-0.5)*5, candleY+candleH/2+3+Math.random()*12, cz+(Math.random()-0.5)*5, col[0],col[1],col[2], 2));
        }
      }
    }
  
    const stars = [];
    for (let i = 0; i < 600; i++) {
      stars.push({ x:(Math.random()-0.5)*2000, y:(Math.random()-0.5)*2000, z:(Math.random()-0.5)*2000, size:Math.random()*1.5+0.3, twinkle:Math.random()*Math.PI*2 });
    }
  

    window.cakeExplode = function() { particles.forEach(p => p.explode()); };
    window.cakeToggleCandles = function() {
      candlesLit = !candlesLit;
      if (candlesLit) {
        particles.forEach(p => {
          if (p.type === 2) {
            p.tx = p.baseTx + (Math.random()-0.5)*5;
            p.ty = p.baseTy + Math.random()*12;
            p.tz = p.baseTz + (Math.random()-0.5)*5;
          }
        });
      } else {
        // 吹灭蜡烛 → 显示爱心层 + 隐藏吹蜡烛按钮
        showHeartLayer();
        document.getElementById('candleBtn').style.display = 'none';
      }
    };
    window.cakeToggleAutoRotate = function() { autoRotate = !autoRotate; };
    window.cakeResetCamera = function() {
      camDist = 320; camYaw = 0; camPitch = 0.5;
      camTargetX = 0; camTargetY = 20; camTargetZ = 0;
    };
  
    function animate() {
      requestAnimationFrame(animate);
      time += 0.016;
      if (autoRotate) camYaw += 0.005;
  
      ctx.fillStyle = 'rgba(5, 5, 16, 0.2)';
      ctx.fillRect(0, 0, W, H);
  
      stars.forEach(s => {
        const p = project(s.x, s.y, s.z);
        if (p && p.z > 0) {
          const alpha = 0.3 + Math.sin(time*1.5 + s.twinkle)*0.3;
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, s.size, 0, Math.PI*2);
          ctx.fill();
        }
      });
  
      particles.forEach(p => p.update(time));
  
      const sorted = particles.map(p => {
        const pr = project(p.x, p.y, p.z);
        return { p, pr };
      }).filter(item => item.pr !== null).sort((a, b) => b.pr.z - a.pr.z);
  
      sorted.forEach(item => {
        const { p, pr } = item;
        const size = Math.max(0.5, 2.2 * pr.scale * 0.15);
        const alpha = p.type === 2 ? (candlesLit ? 0.9 : 0.3) : 0.85;
        if (p.type === 2 && candlesLit) {
          const grad = ctx.createRadialGradient(pr.x, pr.y, 0, pr.x, pr.y, size*4);
          grad.addColorStop(0, `rgba(${p.r*255},${p.g*255},${p.b*255},0.5)`);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, size*4, 0, Math.PI*2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(${p.r*255},${p.g*255},${p.b*255},${alpha})`;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, size, 0, Math.PI*2);
        ctx.fill();
      });
    }
  
    buildCake();
    animate();
  })();
  
  
  //  【第二层】粒子爱心
  (function() {
    const canvas = document.getElementById('heartCanvas');
    const ctx = canvas.getContext('2d');
  
    let W, H, CX, CY;
    function resize() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = window.innerHeight;
      CX = W / 2;
      CY = H * 0.42;
    }
    resize();
    window.addEventListener('resize', resize);
  
    // 配色
    const colorSchemes = [
      { main: [255,255,255], glow: [180,200,255], accent: [120,160,255] },
      { main: [255,180,200], glow: [255,100,150], accent: [255,60,100] },
      { main: [200,230,255], glow: [100,180,255], accent: [50,130,255] },
      { main: [255,230,180], glow: [255,180,80], accent: [255,140,30] },
      { main: [220,200,255], glow: [170,130,255], accent: [130,80,255] },
    ];
    let colorIdx = 0;
    let colors = colorSchemes[0];
    let autoColorTimer = null;
  
    function heartPoint(t, scale) {
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t));
      return [x*scale, y*scale];
    }
    function insideHeart(x, y, scale) {
      const nx = x / (17*scale), ny = -y / (17*scale);
      return Math.pow(nx*nx + ny*ny - 1, 3) - nx*nx * ny*ny*ny <= 0;
    }
  
    class HeartParticle {
      constructor() { this.reset(true); }
      reset(initial = false) {
        this.x = CX + (Math.random()-0.5)*30;
        this.y = H*0.85 + Math.random()*20;
        this.px = this.x; this.py = this.y;
        const t = Math.random()*Math.PI*2;
        const scale = Math.min(W, H)*0.018;
        const [hx, hy] = heartPoint(t, scale);
        if (Math.random() < 0.4) {
          const rx = (Math.random()-0.5)*34*scale;
          const ry = (Math.random()-0.5)*34*scale;
          if (insideHeart(rx, ry, scale)) {
            this.targetX = CX + rx; this.targetY = CY + ry;
          } else {
            this.targetX = CX + hx; this.targetY = CY + hy;
          }
        } else {
          this.targetX = CX + hx; this.targetY = CY + hy;
        }
        const angle = -Math.PI/2 + (Math.random()-0.5)*1.2;
        const speed = 3 + Math.random()*6;
        this.vx = Math.cos(angle)*speed;
        this.vy = Math.sin(angle)*speed;
        this.life = 1;
        this.decay = 0.002 + Math.random()*0.004;
        this.size = 0.8 + Math.random()*2.2;
        this.trailLength = 8 + Math.random()*20;
        this.arrived = false;
        this.wobble = Math.random()*Math.PI*2;
        this.wobbleSpeed = 0.02 + Math.random()*0.03;
        if (initial) {
          const progress = Math.random();
          this.x = this.x + (this.targetX - this.x)*progress;
          this.y = this.y + (this.targetY - this.y)*progress;
          this.px = this.x; this.py = this.y;
          this.life = 0.5 + Math.random()*0.5;
        }
      }
      update(beatScale) {
        this.px = this.x; this.py = this.y;
        const tx = CX + (this.targetX - CX)*beatScale;
        const ty = CY + (this.targetY - CY)*beatScale;
        if (!this.arrived) {
          const dx = tx - this.x, dy = ty - this.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 4) {
            this.arrived = true; this.x = tx; this.y = ty;
          } else {
            const accel = 0.12;
            this.vx += (dx/dist)*accel;
            this.vy += (dy/dist)*accel;
            this.vx *= 0.94; this.vy *= 0.94;
            this.x += this.vx; this.y += this.vy;
          }
        } else {
          this.wobble += this.wobbleSpeed;
          this.x = tx + Math.sin(this.wobble)*1.5;
          this.y = ty + Math.cos(this.wobble*0.8)*1.5;
          this.life -= this.decay*0.3;
        }
        this.life -= this.decay*0.5;
        if (this.life <= 0) this.reset();
      }
      draw(ctx) {
        const alpha = Math.max(0, this.life);
        const [mr,mg,mb] = colors.main;
        const [gr,gg,gb] = colors.glow;
        const tailX = this.x - (this.x - this.px)*this.trailLength*0.3;
        const tailY = this.y - (this.y - this.py)*this.trailLength*0.3;
        const grad = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
        grad.addColorStop(0, `rgba(${gr},${gg},${gb},0)`);
        grad.addColorStop(0.6, `rgba(${gr},${gg},${gb},${alpha*0.3})`);
        grad.addColorStop(1, `rgba(${mr},${mg},${mb},${alpha*0.8})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = this.size*0.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
        const glowSize = this.size*4;
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
        glow.addColorStop(0, `rgba(${mr},${mg},${mb},${alpha*0.9})`);
        glow.addColorStop(0.3, `rgba(${gr},${gg},${gb},${alpha*0.4})`);
        glow.addColorStop(1, `rgba(${gr},${gg},${gb},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size*0.5, 0, Math.PI*2);
        ctx.fill();
      }
    }
  
    class BeamParticle {
      constructor() { this.reset(); }
      reset() {
        this.x = CX + (Math.random()-0.5)*15;
        this.y = H*0.88;
        this.px = this.x; this.py = this.y;
        this.vx = (Math.random()-0.5)*1.5;
        this.vy = -(2 + Math.random()*5);
        this.life = 1;
        this.decay = 0.008 + Math.random()*0.015;
        this.size = 1 + Math.random()*2.5;
      }
      update() {
        this.px = this.x; this.py = this.y;
        this.x += this.vx; this.y += this.vy;
        this.vx += (Math.random()-0.5)*0.1;
        this.life -= this.decay;
        if (this.life <= 0 || this.y < CY - 100) this.reset();
      }
      draw(ctx) {
        const alpha = this.life;
        const [mr,mg,mb] = colors.main;
        const [gr,gg,gb] = colors.glow;
        const grad = ctx.createLinearGradient(this.px, this.py, this.x, this.y);
        grad.addColorStop(0, `rgba(${gr},${gg},${gb},0)`);
        grad.addColorStop(1, `rgba(${mr},${mg},${mb},${alpha*0.7})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = this.size*0.6;
        ctx.beginPath();
        ctx.moveTo(this.px, this.py);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${alpha*0.8})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size*0.4, 0, Math.PI*2);
        ctx.fill();
      }
    }
  
    class Bokeh {
      constructor() { this.reset(true); }
      reset(initial = false) {
        this.x = Math.random()*W;
        this.y = H*0.7 + Math.random()*H*0.3;
        this.size = 2 + Math.random()*12;
        this.speed = 0.1 + Math.random()*0.4;
        this.alpha = 0.05 + Math.random()*0.2;
        this.phase = Math.random()*Math.PI*2;
        if (initial) this.y = Math.random()*H;
      }
      update(time) {
        this.y -= this.speed;
        this.x += Math.sin(time*0.5 + this.phase)*0.3;
        if (this.y < -20) this.reset();
      }
      draw(ctx, time) {
        const pulse = 0.7 + Math.sin(time + this.phase)*0.3;
        const [gr,gg,gb] = colors.glow;
        const [ar,ag,ab] = colors.accent;
        const useAccent = Math.random() > 0.7;
        const r = useAccent ? ar : gr, g = useAccent ? ag : gg, b = useAccent ? ab : gb;
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        grad.addColorStop(0, `rgba(${r},${g},${b},${this.alpha*pulse})`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},${this.alpha*pulse*0.3})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
        ctx.fill();
      }
    }
  
 
  
    const PARTICLE_COUNT = 600;
    const BEAM_COUNT = 80;
    const BOKEH_COUNT = 50;
  
    let particles = [];
    let beams = [];
    let bokehs = [];
  
    function initParticles() {
      particles = []; beams = []; bokehs = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new HeartParticle());
      for (let i = 0; i < BEAM_COUNT; i++) beams.push(new BeamParticle());
      for (let i = 0; i < BOKEH_COUNT; i++) bokehs.push(new Bokeh());
    }
    initParticles();
  
    let time = 0;
    let trailEnabled = true;
    let running = false;
  
    function changeColor() {
      colorIdx = (colorIdx + 1) % colorSchemes.length;
      colors = colorSchemes[colorIdx];
    }
  
    function animate() {
      if (!running) return;
      requestAnimationFrame(animate);
      time += 0.016;
  
      const bt = (time * 1.0) % 1;
      let beatScale = 1;
      if (bt < 0.1) beatScale = 1 + Math.sin(bt/0.1*Math.PI)*0.08;
      else if (bt > 0.15 && bt < 0.25) beatScale = 1 + Math.sin((bt-0.15)/0.1*Math.PI)*0.05;
  
      // 透明背景（能看到下层蛋糕）
      if (trailEnabled) {
        ctx.fillStyle = 'rgba(5, 5, 16, 0.08)';
      } else {
        ctx.clearRect(0, 0, W, H);
      }
      ctx.fillRect(0, 0, W, H);
  
      // 底部发光
      const [gr,gg,gb] = colors.glow;
      const sourceGlow = ctx.createRadialGradient(CX, H*0.85, 0, CX, H*0.85, 120);
      sourceGlow.addColorStop(0, 'rgba(255,255,255,0.12)');
      sourceGlow.addColorStop(0.3, `rgba(${gr},${gg},${gb},0.06)`);
      sourceGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sourceGlow;
      ctx.fillRect(CX-150, H*0.85-150, 300, 300);
  
      bokehs.forEach(b => { b.update(time); b.draw(ctx, time); });
  
      ctx.globalCompositeOperation = 'lighter';
      beams.forEach(b => { b.update(); b.draw(ctx); });
      particles.forEach(p => { p.update(beatScale); p.draw(ctx); });
  
      const heartGlow = ctx.createRadialGradient(CX, CY, 0, CX, CY, 80);
      heartGlow.addColorStop(0, `rgba(255,255,255,${0.04 + Math.sin(time*2)*0.02})`);
      heartGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = heartGlow;
      ctx.fillRect(CX-100, CY-100, 200, 200);
      ctx.globalCompositeOperation = 'source-over';
    }
  

    window.showHeartLayer = function() {
      // 显示统一背景（覆盖蛋糕）
      document.getElementById('sceneBg').classList.add('show');
      canvas.style.display = 'block';
      document.getElementById('cubeWrap').classList.add('show');
      document.body.classList.add('show-heart');
      // 替换底部提示文字
      document.querySelector('.hint').textContent = '宝贝生日快乐';
      document.querySelector('.hint').style.color = 'rgba(255,200,220,0.6)';
      document.querySelector('.hint').style.fontSize = '0.9rem';
      document.querySelector('.hint').style.letterSpacing = '4px';
      // 重新计算爱心canvas尺寸
      resize();
      if (!running) {
        running = true;
        animate();
      }
      // 自动一直换色（每2.5秒换一次）
      if (autoColorTimer) clearInterval(autoColorTimer);
      autoColorTimer = setInterval(changeColor, 2500);
    };
  })();