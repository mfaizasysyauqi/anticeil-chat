import { NextRequest, NextResponse } from 'next/server';
import { resolveModelProvider } from '@/features/gateway/services/routerEngine';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-anticeil-keys',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

function createChunkPayload(id: string, model: string, content: string, finishReason: string | null = null) {
  return `data: ${JSON.stringify({
    id,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        delta: content ? { content } : {},
        finish_reason: finishReason,
      },
    ],
  })}\n\n`;
}

export async function POST(req: NextRequest) {
  const reqId = `chatcmpl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  try {
    const body = await req.json();
    const { model, messages, temperature = 0.7, stream = false, max_tokens = 4096 } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: { message: 'Missing or invalid "messages" parameter in request body.', type: 'invalid_request_error' } },
        { status: 400, headers: corsHeaders }
      );
    }

    // Extract Bearer token and optional client-supplied user provider keys header
    const authHeader = req.headers.get('authorization') || '';
    const bearerKey = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';

    let clientKeys: Record<string, { apiKey?: string; baseUrl?: string }> = {};
    const clientKeysHeader = req.headers.get('x-anticeil-keys');
    if (clientKeysHeader) {
      try {
        clientKeys = JSON.parse(clientKeysHeader);
      } catch {}
    }

    // Resolve provider & model
    const resolution = resolveModelProvider(model || 'groq/compound', clientKeys);

    // If caller provided a direct provider key (e.g. sk-... or gsk_...) instead of Anticeil gateway key, use it
    let effectiveApiKey = resolution.apiKey;
    if (bearerKey && !bearerKey.startsWith('sk-anticeil-')) {
      effectiveApiKey = bearerKey;
    }

    const { providerId, normalizedModelId, baseUrl } = resolution;

    // ─── 1. Anthropic Provider ──────────────────────────────────────────
    if (providerId === 'anthropic') {
      const systemMessage = messages.find((m: any) => m.role === 'system');
      const chatMessages = messages
        .filter((m: any) => m.role === 'user' || m.role === 'assistant')
        .map((m: any) => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
        }));

      const anthropicRes = await fetch(`${baseUrl.replace(/\/+$/, '')}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': effectiveApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: normalizedModelId,
          system: systemMessage ? (typeof systemMessage.content === 'string' ? systemMessage.content : '') : undefined,
          messages: chatMessages,
          max_tokens,
          temperature,
          stream,
        }),
      });

      if (!anthropicRes.ok) {
        const errorText = await anthropicRes.text();
        return NextResponse.json(
          { error: { message: `Anthropic upstream error: ${errorText}`, type: 'upstream_error' } },
          { status: anthropicRes.status, headers: corsHeaders }
        );
      }

      if (!stream) {
        const data = await anthropicRes.json();
        const content = data.content?.map((c: any) => c.text).join('') || '';
        return NextResponse.json(
          {
            id: reqId,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model,
            choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
            usage: {
              prompt_tokens: data.usage?.input_tokens || 0,
              completion_tokens: data.usage?.output_tokens || 0,
              total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
            },
          },
          { headers: corsHeaders }
        );
      }

      // Stream translation for Anthropic SSE -> OpenAI SSE
      const encoder = new TextEncoder();
      const customStream = new ReadableStream({
        async start(controller) {
          const reader = anthropicRes.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data: ')) continue;
                const dataStr = trimmed.slice(6);
                if (dataStr === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    controller.enqueue(encoder.encode(createChunkPayload(reqId, model, parsed.delta.text)));
                  }
                } catch {}
              }
            }

            controller.enqueue(encoder.encode(createChunkPayload(reqId, model, '', 'stop')));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } catch (err) {
            controller.error(err);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(customStream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    // ─── 2. Google Gemini Provider ───────────────────────────────────────
    if (providerId === 'gemini') {
      const contents = messages
        .filter((m: any) => m.role === 'user' || m.role === 'assistant')
        .map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
        }));

      const systemMessage = messages.find((m: any) => m.role === 'system');
      const action = stream ? 'streamGenerateContent?alt=sse' : 'generateContent';
      const endpoint = `${baseUrl.replace(/\/+$/, '')}/models/${normalizedModelId}:${action}&key=${effectiveApiKey}`;

      const geminiRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: systemMessage
            ? { parts: [{ text: typeof systemMessage.content === 'string' ? systemMessage.content : '' }] }
            : undefined,
          generationConfig: { temperature, maxOutputTokens: max_tokens },
        }),
      });

      if (!geminiRes.ok) {
        const errorText = await geminiRes.text();
        return NextResponse.json(
          { error: { message: `Gemini upstream error: ${errorText}`, type: 'upstream_error' } },
          { status: geminiRes.status, headers: corsHeaders }
        );
      }

      if (!stream) {
        const data = await geminiRes.json();
        const content = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
        return NextResponse.json(
          {
            id: reqId,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model,
            choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
          },
          { headers: corsHeaders }
        );
      }

      // Stream translation for Gemini SSE -> OpenAI SSE
      const encoder = new TextEncoder();
      const customStream = new ReadableStream({
        async start(controller) {
          const reader = geminiRes.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data: ')) continue;
                try {
                  const parsed = JSON.parse(trimmed.slice(6));
                  const text = parsed.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('');
                  if (text) {
                    controller.enqueue(encoder.encode(createChunkPayload(reqId, model, text)));
                  }
                } catch {}
              }
            }

            controller.enqueue(encoder.encode(createChunkPayload(reqId, model, '', 'stop')));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } catch (err) {
            controller.error(err);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(customStream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    // ─── 3. Standard OpenAI / Groq / DeepSeek / Ollama / Custom ────────
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (effectiveApiKey) {
      headers['Authorization'] = `Bearer ${effectiveApiKey}`;
    }

    const upstreamRes = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: normalizedModelId,
        messages,
        temperature,
        stream,
        max_tokens,
      }),
    });

    if (!upstreamRes.ok) {
      const errorText = await upstreamRes.text();
      return NextResponse.json(
        { error: { message: `Upstream error (${providerId}): ${errorText}`, type: 'upstream_error' } },
        { status: upstreamRes.status, headers: corsHeaders }
      );
    }

    if (!stream) {
      const data = await upstreamRes.json();
      return NextResponse.json(data, { headers: corsHeaders });
    }

    // Direct pipe for OpenAI-compatible streaming
    return new Response(upstreamRes.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'Internal gateway error', type: 'internal_error' } },
      { status: 500, headers: corsHeaders }
    );
  }
}