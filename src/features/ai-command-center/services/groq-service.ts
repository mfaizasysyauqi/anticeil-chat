import type {
  AiMessage,
  AiSystemContext,
  GroqConfig,
  AiToolCall,
} from '../types';

export const GROQ_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'launch_application',
      description:
        'Buka atau luncurkan aplikasi aktivitas Anticeil (YouTube Watch Together, Jamspace Whiteboard, Anticeil Chess, Share Screen, TradingView) atau buka halaman daftar Applications & Activities.',
      parameters: {
        type: 'object',
        properties: {
          appId: {
            type: 'string',
            enum: ['watch-together', 'jamspace-whiteboard', 'whiteboard', 'anticeil-chess', 'chess', 'share-screen', 'screenshare', 'tradingview', 'anticeil-platform', 'apps-view'],
            description:
              'ID aplikasi: "watch-together" untuk YouTube Watch Together, "whiteboard" atau "jamspace-whiteboard" untuk Jamspace Whiteboard, "chess" atau "anticeil-chess" untuk Anticeil Chess, "screenshare" atau "share-screen" untuk Berbagi Layar, "tradingview" untuk TradingView, "anticeil-platform" untuk Anticeil Platform, "apps-view" untuk membuka halaman daftar Aplikasi & Aktivitas.',
          },
          appName: {
            type: 'string',
            description: 'Nama aplikasi dalam tampilan UI',
          },
          mode: {
            type: 'string',
            enum: ['standalone', 'channel', 'navigation'],
            description: 'Mode buka: "standalone" (layar penuh tanpa channel), "channel" (di dalam saluran), atau "navigation" (pindah ke halaman aplikasi).',
          },
        },
        required: ['appId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_direct_message',
      description:
        'Kirim atau balas pesan langsung (Direct Message / DM) secara pribadi ke seorang teman atau pengguna.',
      parameters: {
        type: 'object',
        properties: {
          recipient: {
            type: 'string',
            description: 'Nama pengguna, username (misal @faiz), atau ID akun yang dituju.',
          },
          content: {
            type: 'string',
            description: 'Isi teks pesan yang ingin dikirimkan.',
          },
        },
        required: ['recipient', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_colony_channel_message',
      description:
        'Kirim pesan ke saluran/channel teks tertentu di dalam suatu colony/server komunitas.',
      parameters: {
        type: 'object',
        properties: {
          colonyName: {
            type: 'string',
            description: 'Nama colony atau server tujuan (contoh: "Tech", "as", "General")',
          },
          channelName: {
            type: 'string',
            description: 'Nama saluran/channel tujuan (contoh: "general", "pengumuman", "asx")',
          },
          content: {
            type: 'string',
            description: 'Isi pesan teks yang ingin dikirimkan ke saluran.',
          },
        },
        required: ['colonyName', 'channelName', 'content'],
      },
    },
  },
];

function buildSystemPrompt(context: AiSystemContext): string {
  const coloniesList = context.colonies.map((c) => `- "${c.name}" (id: ${c.id})`).join('\n');
  const channelsList = context.channels.map((ch) => `- #${ch.name} (id: ${ch.id}, colonyId: ${ch.colonyId || 'anticeil'})`).join('\n');
  const friendsList = context.friends.map((f) => `- ${f.name} (@${f.username || f.id})`).join('\n');
  const appsList = context.apps.map((a) => `- ${a.name} (id: ${a.id})`).join('\n');

  return `Kamu adalah "Anticeil AI Command Center", asisten operasional cerdas untuk platform kolaborasi Anticeil.
Tugas utamamu adalah membantu pengguna mengendalikan ekosistem Anticeil secara efisien melalui percakapan alami.

Kamu memiliki akses langsung ke tools berikut:
1. launch_application: Membuka aplikasi aktivitas (Jamspace Whiteboard, YouTube Watch Together, Anticeil Chess, Share Screen).
2. send_direct_message: Mengirim/membalas DM ke teman.
3. send_colony_channel_message: Mengirim pesan ke channel tertentu di suatu colony.

DATA EKOSISTEM PENGGUNA SAAT INI:
- Pengguna Aktif: ${context.currentUser?.name || 'User'} (@${context.currentUser?.username || 'user'})
- Daftar Colony Tersedia:
${coloniesList || 'Tidak ada colony'}
- Daftar Saluran / Channel:
${channelsList || 'Tidak ada channel'}
- Daftar Teman:
${friendsList || 'Tidak ada teman'}
- Daftar Aplikasi:
${appsList || 'Tidak ada aplikasi'}

PEDOMAN:
- Jika pengguna meminta membuka daftar atau halaman Aplikasi & Aktivitas (Applications & Activities / Apps), panggil tool launch_application dengan appId "apps-view" dan appName "Aplikasi & Aktivitas".
- Jika pengguna meminta membuka aplikasi tertentu (YouTube, Whiteboard, Chess, Share Screen, TradingView), panggil tool launch_application dengan appId yang sesuai.
- Jika pengguna meminta mengirim/membalas DM ke teman, panggil tool send_direct_message.
- Jika pengguna meminta mengirim pesan ke saluran di suatu colony, panggil tool send_colony_channel_message.
- Jawab secara cerdas, ramah, dan solutif dalam bahasa Indonesia menggunakan format Markdown yang rapi.

FITUR ARTIFACTS (Seperti Claude & LibreChat):
Ketika pengguna meminta membuat aplikasi, website, game, form, kalkulator, visualisasi SVG, diagram, atau kode substansial (>15 baris), buatlah sebuah ARTIFACT menggunakan tag <antArtifact>:
<antArtifact identifier="unique-id" type="text/html" title="Nama Judul Artifact">
...isi kode HTML lengkap yang mandiri dan interaktif...
</antArtifact>

Tipe Artifact yang didukung:
- "text/html": Aplikasi web interaktif, mini game HTML5 Canvas, widget, kalkulator, form (didukung dengan Tailwind CSS CDN dan JavaScript interaktif).
- "image/svg+xml": Vektor grafis atau ikon SVG mandiri.
- "application/vnd.ant.markdown": Dokumen panduan, laporan, atau spesifikasi teknis.
- "application/vnd.ant.code": Kode script mandiri (sertakan language="python" atau bahasa terkait).
- "application/vnd.ant.mermaid": Diagram alur atau flowchart.
- "application/vnd.ant.react": Komponen React JSX.`;
}

/**
 * Intelligent local intent parser for offline fallback.
 * This guarantees 100% reliability and immediate demo/functionality.
 */
function parseIntentLocally(
  userPrompt: string,
  context: AiSystemContext,
): { replyText: string; toolCalls: AiToolCall[] } {
  const prompt = userPrompt.toLowerCase().trim();
  const toolCalls: AiToolCall[] = [];

  // 0. Check Artifact Generation Requests (LibreChat / Claude style)
  if (prompt.includes('kalkulator') || prompt.includes('calculator')) {
    return {
      replyText: `Berikut adalah aplikasi **Kalkulator Modern Interaktif** yang telah saya buatkan khusus untuk Anda dalam bentuk **Artifact**:

<antArtifact identifier="interactive-calculator" type="text/html" title="Kalkulator Modern Interaktif">
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-white min-h-screen flex items-center justify-center p-4">
  <div class="w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl">
    <div class="text-xs text-zinc-500 font-semibold mb-1 flex items-center justify-between">
      <span>ANTICEIL CALC</span>
      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
    </div>
    <div id="display" class="w-full bg-black/60 border border-zinc-800/80 rounded-2xl px-4 py-3 text-right text-3xl font-mono text-zinc-100 mb-5 overflow-hidden text-ellipsis select-all">
      0
    </div>
    <div class="grid grid-cols-4 gap-2.5 font-medium text-sm">
      <button onclick="clearDisplay()" class="col-span-2 p-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl transition">AC</button>
      <button onclick="deleteLast()" class="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition">DEL</button>
      <button onclick="appendOp('/')" class="p-3 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl transition">/</button>

      <button onclick="appendNum('7')" class="p-3 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl transition">7</button>
      <button onclick="appendNum('8')" class="p-3 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl transition">8</button>
      <button onclick="appendNum('9')" class="p-3 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl transition">9</button>
      <button onclick="appendOp('*')" class="p-3 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl transition">×</button>

      <button onclick="appendNum('4')" class="p-3 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl transition">4</button>
      <button onclick="appendNum('5')" class="p-3 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl transition">5</button>
      <button onclick="appendNum('6')" class="p-3 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl transition">6</button>
      <button onclick="appendOp('-')" class="p-3 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl transition">-</button>

      <button onclick="appendNum('1')" class="p-3 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl transition">1</button>
      <button onclick="appendNum('2')" class="p-3 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl transition">2</button>
      <button onclick="appendNum('3')" class="p-3 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl transition">3</button>
      <button onclick="appendOp('+')" class="p-3 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl transition">+</button>

      <button onclick="appendNum('0')" class="col-span-2 p-3 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl transition">0</button>
      <button onclick="appendNum('.')" class="p-3 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl transition">.</button>
      <button onclick="calculate()" class="p-3 bg-emerald-600 text-white hover:bg-emerald-500 rounded-xl transition font-bold">=</button>
    </div>
  </div>

  <script>
    let expr = '';
    const display = document.getElementById('display');

    function appendNum(num) {
      if (expr === '0' && num !== '.') expr = '';
      expr += num;
      display.innerText = expr;
    }

    function appendOp(op) {
      if (!expr && op !== '-') return;
      if (['+', '-', '*', '/'].includes(expr.slice(-1))) {
        expr = expr.slice(0, -1);
      }
      expr += op;
      display.innerText = expr;
    }

    function clearDisplay() {
      expr = '0';
      display.innerText = expr;
    }

    function deleteLast() {
      expr = expr.slice(0, -1) || '0';
      display.innerText = expr;
    }

    function calculate() {
      try {
        const res = eval(expr);
        expr = String(res);
        display.innerText = expr;
      } catch (e) {
        display.innerText = 'Error';
        expr = '';
      }
    }
  </script>
</body>
</html>
</antArtifact>

Klik kartu di atas untuk membuka dan mencoba aplikasi di panel Artifacts!`,
      toolCalls: [],
    };
  }

  if (prompt.includes('game') || prompt.includes('pong') || prompt.includes('arcade')) {
    return {
      replyText: `Berikut adalah mini game **Retro Pong Arcade** yang saya rancang menggunakan HTML5 Canvas dalam bentuk **Artifact**:

<antArtifact identifier="retro-pong-game" type="text/html" title="Retro Pong Arcade Game">
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-white flex flex-col items-center justify-center min-h-screen p-4 font-mono select-none">
  <div class="flex items-center justify-between w-full max-w-md mb-3 px-2">
    <div class="text-xs text-zinc-400">PONG ARCADE</div>
    <div class="text-sm font-bold text-indigo-400" id="score">PLAYER: 0 | CPU: 0</div>
  </div>
  <canvas id="gameCanvas" width="480" height="320" class="border-2 border-indigo-500/50 rounded-xl bg-black shadow-2xl"></canvas>
  <div class="text-xs text-zinc-500 mt-3">Gerakkan mouse atau sentuh layar ke atas/bawah untuk mengontrol paddle.</div>

  <script>
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');

    let playerScore = 0, cpuScore = 0;
    const paddleH = 60, paddleW = 8;
    let playerY = (canvas.height - paddleH) / 2;
    let cpuY = (canvas.height - paddleH) / 2;

    let ballX = canvas.width / 2, ballY = canvas.height / 2;
    let ballSpeedX = 4, ballSpeedY = 3;

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      playerY = e.clientY - rect.top - paddleH / 2;
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      playerY = e.touches[0].clientY - rect.top - paddleH / 2;
    });

    function update() {
      ballX += ballSpeedX;
      ballY += ballSpeedY;

      if (ballY <= 0 || ballY >= canvas.height - 8) ballSpeedY = -ballSpeedY;

      // CPU AI
      if (cpuY + paddleH / 2 < ballY - 10) cpuY += 3.5;
      else if (cpuY + paddleH / 2 > ballY + 10) cpuY -= 3.5;

      // Player paddle collision
      if (ballX <= 18 && ballY >= playerY && ballY <= playerY + paddleH) {
        ballSpeedX = -ballSpeedX * 1.05;
      }

      // CPU paddle collision
      if (ballX >= canvas.width - 26 && ballY >= cpuY && ballY <= cpuY + paddleH) {
        ballSpeedX = -ballSpeedX * 1.05;
      }

      // Out of bounds
      if (ballX < 0) {
        cpuScore++;
        resetBall();
      } else if (ballX > canvas.width) {
        playerScore++;
        resetBall();
      }

      scoreEl.innerText = 'PLAYER: ' + playerScore + ' | CPU: ' + cpuScore;
    }

    function resetBall() {
      ballX = canvas.width / 2;
      ballY = canvas.height / 2;
      ballSpeedX = ballSpeedX > 0 ? -4 : 4;
      ballSpeedY = (Math.random() - 0.5) * 6;
    }

    function draw() {
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Center dashed line
      ctx.strokeStyle = '#27272a';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();

      // Paddles
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(10, Math.max(0, Math.min(canvas.height - paddleH, playerY)), paddleW, paddleH);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(canvas.width - 18, Math.max(0, Math.min(canvas.height - paddleH, cpuY)), paddleW, paddleH);

      // Ball
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ballX, ballY, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    function loop() {
      update();
      draw();
      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>
</antArtifact>

Klik kartu di atas untuk memainkan game ini secara langsung di panel Artifacts!`,
      toolCalls: [],
    };
  }

  if (prompt.includes('artifact') || prompt.includes('artefak') || prompt.includes('svg')) {
    return {
      replyText: `Tentu! Berikut adalah contoh **Vector Art Badge** yang dibuat dalam format SVG sebagai **Artifact**:

<antArtifact identifier="anticeil-neon-emblem" type="image/svg+xml" title="Anticeil Neon Cyber Emblem">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#090a0f" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="50%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="400" height="400" fill="#090a0f"/>
  <circle cx="200" cy="200" r="180" fill="url(#bgGlow)"/>

  <!-- Outer Cyber Rings -->
  <circle cx="200" cy="200" r="150" fill="none" stroke="#27272a" stroke-width="2" stroke-dasharray="10, 8"/>
  <circle cx="200" cy="200" r="130" fill="none" stroke="url(#neonGradient)" stroke-width="3" filter="url(#glow)"/>

  <!-- Geometric Polygon Hexagon -->
  <polygon points="200,90 295,145 295,255 200,310 105,255 105,145" fill="none" stroke="#6366f1" stroke-width="2"/>

  <!-- Glowing Emblem Core -->
  <path d="M 200 130 L 250 220 L 200 270 L 150 220 Z" fill="none" stroke="url(#neonGradient)" stroke-width="4" filter="url(#glow)"/>
  <circle cx="200" cy="200" r="14" fill="#06b6d4" filter="url(#glow)"/>

  <!-- Emblem Text -->
  <text x="200" y="350" font-family="monospace" font-size="14" fill="#a1a1aa" font-weight="bold" text-anchor="middle" letter-spacing="4">
    ANTICEIL • ARTIFACT
  </text>
</svg>
</antArtifact>

Artifacts mendukung preview interaktif, inspeksi kode, serta unduh langsung.`,
      toolCalls: [],
    };
  }

  // 0. Check Applications & Activities view navigation
  if (
    prompt.includes('applications') ||
    prompt.includes('activities') ||
    prompt.includes('aktivitas') ||
    prompt.includes('buka apps') ||
    prompt.includes('buka aplikasi') ||
    prompt === 'apps' ||
    prompt === 'aplikasi'
  ) {
    toolCalls.push({
      id: `call_${Date.now()}_apps`,
      type: 'function',
      function: {
        name: 'launch_application',
        arguments: JSON.stringify({
          appId: 'apps-view',
          appName: 'Aplikasi & Aktivitas',
          mode: 'navigation',
        }),
      },
      parsedArgs: {
        appId: 'apps-view',
        appName: 'Aplikasi & Aktivitas',
        mode: 'navigation',
      },
      status: 'pending',
    });
    return {
      replyText: 'Siap! Membuka halaman **Aplikasi & Aktivitas** untuk Anda.',
      toolCalls,
    };
  }

  // 1. Check Launch Application intent
  if (
    prompt.includes('whiteboard') ||
    prompt.includes('jamspace') ||
    prompt.includes('papan tulis') ||
    prompt.includes('coret')
  ) {
    toolCalls.push({
      id: `call_${Date.now()}_app`,
      type: 'function',
      function: {
        name: 'launch_application',
        arguments: JSON.stringify({
          appId: 'jamspace-whiteboard',
          appName: 'Jamspace Whiteboard',
          mode: 'standalone',
        }),
      },
      parsedArgs: {
        appId: 'jamspace-whiteboard',
        appName: 'Jamspace Whiteboard',
        mode: 'standalone',
      },
      status: 'pending',
    });
    return {
      replyText: 'Baik, saya siapkan papan tulis **Jamspace Whiteboard** untuk Anda dalam mode standalone.',
      toolCalls,
    };
  }

  if (
    prompt.includes('youtube') ||
    prompt.includes('watch together') ||
    prompt.includes('nonton') ||
    prompt.includes('video')
  ) {
    toolCalls.push({
      id: `call_${Date.now()}_app`,
      type: 'function',
      function: {
        name: 'launch_application',
        arguments: JSON.stringify({
          appId: 'watch-together',
          appName: 'YouTube Watch Together',
          mode: 'standalone',
        }),
      },
      parsedArgs: {
        appId: 'watch-together',
        appName: 'YouTube Watch Together',
        mode: 'standalone',
      },
      status: 'pending',
    });
    return {
      replyText: 'Siap! Meluncurkan **YouTube Watch Together** untuk menonton video bersama.',
      toolCalls,
    };
  }

  if (prompt.includes('chess') || prompt.includes('catur')) {
    toolCalls.push({
      id: `call_${Date.now()}_app`,
      type: 'function',
      function: {
        name: 'launch_application',
        arguments: JSON.stringify({
          appId: 'anticeil-chess',
          appName: 'Anticeil Chess',
          mode: 'standalone',
        }),
      },
      parsedArgs: {
        appId: 'anticeil-chess',
        appName: 'Anticeil Chess',
        mode: 'standalone',
      },
      status: 'pending',
    });
    return {
      replyText: 'Membuka papan permainan **Anticeil Chess** sekarang.',
      toolCalls,
    };
  }

  if (
    prompt.includes('share screen') ||
    prompt.includes('berbagi layar') ||
    prompt.includes('bagi layar')
  ) {
    toolCalls.push({
      id: `call_${Date.now()}_app`,
      type: 'function',
      function: {
        name: 'launch_application',
        arguments: JSON.stringify({
          appId: 'share-screen',
          appName: 'Share Screen',
          mode: 'standalone',
        }),
      },
      parsedArgs: {
        appId: 'share-screen',
        appName: 'Share Screen',
        mode: 'standalone',
      },
      status: 'pending',
    });
    return {
      replyText: 'Menyiapkan modul **Share Screen** untuk berbagi layar.',
      toolCalls,
    };
  }

  if (
    prompt.includes('tradingview') ||
    prompt.includes('trading') ||
    prompt.includes('chart') ||
    prompt.includes('crypto')
  ) {
    toolCalls.push({
      id: `call_${Date.now()}_app`,
      type: 'function',
      function: {
        name: 'launch_application',
        arguments: JSON.stringify({
          appId: 'tradingview',
          appName: 'TradingView Charts',
          mode: 'standalone',
        }),
      },
      parsedArgs: {
        appId: 'tradingview',
        appName: 'TradingView Charts',
        mode: 'standalone',
      },
      status: 'pending',
    });
    return {
      replyText: 'Siap! Meluncurkan **TradingView Charts** dalam mode standalone.',
      toolCalls,
    };
  }

  if (
    prompt.includes('anticeil platform') ||
    prompt.includes('platform') ||
    prompt.includes('otomasi') ||
    prompt.includes('dashboard')
  ) {
    toolCalls.push({
      id: `call_${Date.now()}_app`,
      type: 'function',
      function: {
        name: 'launch_application',
        arguments: JSON.stringify({
          appId: 'anticeil-platform',
          appName: 'Anticeil Platform',
          mode: 'standalone',
        }),
      },
      parsedArgs: {
        appId: 'anticeil-platform',
        appName: 'Anticeil Platform',
        mode: 'standalone',
      },
      status: 'pending',
    });
    return {
      replyText: 'Siap! Membuka **Anticeil Platform** dengan autentikasi SSO dalam mode standalone.',
      toolCalls,
    };
  }

  // 2. Check Send Channel Message intent (e.g. "kirim pesan ke channel general di colony as: halo")
  const channelMatch =
    prompt.match(/(?:kirim|post|balas|pesan)\s+(?:ke\s+)?(?:channel|saluran\s+)?#?([a-zA-Z0-9_-]+)\s+(?:di|pada|colony\s+)?([a-zA-Z0-9_-]+)?(?:\s*:\s*|\s+bilang\s+|\s+isi\s+)(.+)/i) ||
    prompt.match(/(?:kirim|post)\s+(?:ke\s+colony\s+)?([a-zA-Z0-9_-]+)\s+(?:channel|saluran\s+)?#?([a-zA-Z0-9_-]+)(?:\s*:\s*|\s+bilang\s+|\s+isi\s+)(.+)/i);

  if (channelMatch) {
    const rawColony = channelMatch[2] || context.colonies[0]?.name || 'default';
    const rawChannel = channelMatch[1] || 'general';
    const content = channelMatch[3]?.trim() || '';

    // match against real colonies
    const matchedColony = context.colonies.find(
      (c) => c.name.toLowerCase().includes(rawColony.toLowerCase()) || rawColony.toLowerCase().includes(c.name.toLowerCase()),
    ) || context.colonies[0];

    const matchedChannel = context.channels.find(
      (ch) => ch.name.toLowerCase().includes(rawChannel.toLowerCase()) || rawChannel.toLowerCase().includes(ch.name.toLowerCase()),
    ) || { name: rawChannel };

    toolCalls.push({
      id: `call_${Date.now()}_ch`,
      type: 'function',
      function: {
        name: 'send_colony_channel_message',
        arguments: JSON.stringify({
          colonyName: matchedColony?.name || rawColony,
          channelName: matchedChannel?.name || rawChannel,
          content,
        }),
      },
      parsedArgs: {
        colonyName: matchedColony?.name || rawColony,
        channelName: matchedChannel?.name || rawChannel,
        content,
      },
      status: 'pending',
    });

    return {
      replyText: `Saya telah menyiapkan pengiriman pesan ke saluran **#${matchedChannel?.name || rawChannel}** di colony **${matchedColony?.name || rawColony}**. Silakan konfirmasi kartu di bawah ini:`,
      toolCalls,
    };
  }

  // 3. Check Send Direct Message intent (e.g. "kirim dm ke faiz halo bro", "balas pesan budi bilang lagi otw")
  const dmMatch =
    prompt.match(/(?:kirim|balas)\s+(?:dm|pesan\s+langsung|pesan)?\s*(?:ke|kepada)?\s*@?([a-zA-Z0-9_.-]+)(?:\s*:\s*|\s+bilang\s+|\s+isi\s+|\s+)(.+)/i);

  if (dmMatch) {
    const rawRecipient = dmMatch[1];
    const content = dmMatch[2]?.trim() || '';

    const matchedFriend = context.friends.find(
      (f) =>
        f.name.toLowerCase().includes(rawRecipient.toLowerCase()) ||
        f.username?.toLowerCase().includes(rawRecipient.toLowerCase()),
    );

    const recipientName = matchedFriend?.name || rawRecipient;

    toolCalls.push({
      id: `call_${Date.now()}_dm`,
      type: 'function',
      function: {
        name: 'send_direct_message',
        arguments: JSON.stringify({
          recipient: recipientName,
          content,
        }),
      },
      parsedArgs: {
        recipient: recipientName,
        content,
      },
      status: 'pending',
    });

    return {
      replyText: `Siap! Saya telah menyiapkan pesan langsung (DM) untuk **${recipientName}**. Periksa detail di bawah sebelum mengirim:`,
      toolCalls,
    };
  }

  // General conversational response
  return {
    replyText: `Halo! Saya adalah **Anticeil AI Command Center**. Anda dapat meminta saya untuk:
1. 🚀 **Membuka aplikasi**: *"Buka Jamspace Whiteboard"*, *"Nonton YouTube Watch Together"*, atau *"Main catur"*.
2. 💬 **Kirim pesan ke channel**: *"Kirim pesan ke #general di colony ${context.colonies[0]?.name || 'as'}: Halo semua!"*
3. ✉️ **Balas Direct Message**: *"Kirim DM ke ${context.friends[0]?.name || 'teman'}: Aku lagi di jalan ya"*.

Apa yang ingin Anda lakukan sekarang?`,
    toolCalls: [],
  };
}

export async function executeGroqCommand({
  messages,
  context,
  config,
}: {
  messages: AiMessage[];
  context: AiSystemContext;
  config: GroqConfig;
}): Promise<{ replyText: string; toolCalls: AiToolCall[] }> {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const userPrompt = lastUserMsg?.content || '';

  // If no Groq API Key is configured, use the fast local heuristic parser
  if (!config.apiKey || !config.apiKey.startsWith('gsk_')) {
    // Artificial small delay for realistic smooth feel
    await new Promise((r) => setTimeout(r, 450));
    return parseIntentLocally(userPrompt, context);
  }

  // Call Groq API endpoint
  try {
    const systemPrompt = buildSystemPrompt(context);
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    let activeModel = config.model || 'openai/gpt-oss-120b';
    if (activeModel === 'llama-3.3-70b-versatile') {
      activeModel = 'openai/gpt-oss-120b';
    }

    let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: activeModel,
        messages: apiMessages,
        tools: GROQ_TOOLS,
        tool_choice: 'auto',
        temperature: config.temperature ?? 0.2,
      }),
    });

    // If model returned 404, retry with default reliable model
    if (response.status === 404 && activeModel !== 'openai/gpt-oss-120b') {
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: apiMessages,
          tools: GROQ_TOOLS,
          tool_choice: 'auto',
          temperature: config.temperature ?? 0.2,
        }),
      });
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      console.warn('Groq API returned error status:', response.status, errJson);
      // Fallback to local intent parser gracefully if API key expired or quota error
      const localFallback = parseIntentLocally(userPrompt, context);
      return {
        replyText: localFallback.replyText,
        toolCalls: localFallback.toolCalls,
      };
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    let replyText = message?.content || '';
    const rawToolCalls = message?.tool_calls || [];
    const parsedToolCalls: AiToolCall[] = [];

    for (const tc of rawToolCalls) {
      try {
        const args = JSON.parse(tc.function.arguments || '{}');
        parsedToolCalls.push({
          id: tc.id || `call_${Date.now()}`,
          type: 'function',
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
          parsedArgs: args,
          status: 'pending',
        });
      } catch (err) {
        console.warn('Failed to parse tool call args', err);
      }
    }

    if (!replyText && parsedToolCalls.length > 0) {
      replyText = 'Saya telah menyiapkan perintah berikut untuk dijalankan:';
    }

    return {
      replyText: replyText || 'Perintah diproses.',
      toolCalls: parsedToolCalls,
    };
  } catch (error) {
    console.warn('Groq API call failed with network error, using local parser fallback', error);
    return parseIntentLocally(userPrompt, context);
  }
}
