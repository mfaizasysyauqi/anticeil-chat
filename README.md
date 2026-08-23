# 🤖 Anticeil

> **Bring Your Own Key (BYOK) Cross-Platform AI Assistant** built with **Next.js 15+ (Web)**, **Expo React Native (Mobile)**, and **Tauri 2.0 (Desktop)** powered by **Feature-First Clean Architecture**.

---

## 🏛️ Monorepo Architecture

```text
anticeil/
├── packages/
│   ├── core/                        # Pure TypeScript: Domain Models, Token Estimator, Theme Tokens, i18n
│   └── typescript-config/           # Centralized tsconfigs for Next.js, React Library, and Base
│
├── apps/
│   ├── web/                         # Next.js 15+ App Router with Thin Controllers (< 30 lines)
│   ├── mobile/                      # Expo (React Native) with Flutter-style Feature-First Architecture
│   └── desktop/                     # Tauri 2.0 Native Desktop App
```

---

## ⚡ Supported Providers

- 🟢 **OpenAI**: GPT-4o, GPT-4o-mini, o3-mini
- 🟣 **Anthropic Claude**: Claude 3.7 Sonnet, Claude 3.5 Sonnet, Claude 3.5 Haiku
- 🔵 **Google Gemini**: Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash
- 🟠 **DeepSeek**: DeepSeek-V3, DeepSeek-R1 (Reasoning model)
- ⚡ **Groq Cloud**: Llama 3.3 70B, Mixtral 8x7B (Ultra-fast LPU inference)
- 🦙 **Ollama (Local)**: Llama 3.2, DeepSeek-R1 8B (100% offline & private)
- ⚙️ **Custom Endpoints**: OpenAI-compatible API gateways (e.g. OpenRouter, vLLM, LM Studio)

---

## 🚀 Quick Start

### Install Dependencies
```bash
pnpm install
```

### Run Type Checking Across All Packages
```bash
pnpm check-types
```

### Run Web Development Server (Next.js)
```bash
pnpm --filter web dev
```

### Run Mobile Development Server (Expo)
```bash
pnpm --filter mobile start
```

### Run Desktop App (Tauri)
```bash
pnpm --filter desktop dev
```

---

## 🔒 Security & Privacy
- **Zero-Proxy Architecture**: API requests are transmitted directly from your client machine to each AI provider API endpoint.
- **100% Local Key Storage**: API keys are securely stored in your device's browser / mobile / desktop local storage. No server database ever receives or logs your credentials.
