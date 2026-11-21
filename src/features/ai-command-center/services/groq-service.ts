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
            enum: ['watch-together', 'jamspace-whiteboard', 'anticeil-chess', 'share-screen', 'tradingview', 'apps-view'],
            description:
              'ID aplikasi: "watch-together" untuk YouTube Watch Together, "jamspace-whiteboard" untuk Jamspace Whiteboard, "anticeil-chess" untuk Anticeil Chess, "share-screen" untuk Berbagi Layar, "tradingview" untuk TradingView, "apps-view" untuk membuka halaman daftar Aplikasi & Aktivitas.',
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
- Jawab secara cerdas, ramah, dan solutif dalam bahasa Indonesia menggunakan format Markdown yang rapi.`;
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
