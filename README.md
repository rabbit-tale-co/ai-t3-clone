# AI T3 CLONE 🤖

<div align="center">

![Rabbit Tale Studiios Banner](https://cdn.discordapp.com/splashes/1004735926234271864/60d186cd18b27e1fe9efba5481e42a19.jpg?size=2048)

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![AI SDK](https://img.shields.io/badge/AI%20SDK-4.3.16-FF6B6B?style=for-the-badge&logo=ai&logoColor=white)](https://sdk.vercel.ai)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-4ECDC4?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](./LICENSE)

</div>

---

## 🚀 Advanced AI Assistant

Welcome to **AI T3 Clone** 🤖 - a modern conversational platform powered by the latest AI models!

This isn't just another chatbot - it's a comprehensive solution that combines the power of multiple AI providers, advanced conversation organization features, and an intuitive interface. Built for professionals, developers, and anyone who wants to harness the full potential of artificial intelligence.

---

## ⭐️ Key Features

### 🔥 Multi-Model AI Support

<table>
  <tr>
    <td align="center" width="33%">
      <h3>🧠 OpenAI</h3>
      <img src="https://img.shields.io/badge/GPT--4-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI">
      <br><br>
      <em>GPT-4, GPT-4 Turbo, GPT-3.5 Turbo with latest capabilities</em>
    </td>
    <td align="center" width="33%">
      <h3>🤖 Anthropic</h3>
      <img src="https://img.shields.io/badge/Claude--3-D4A574?style=for-the-badge&logo=anthropic&logoColor=white" alt="Anthropic">
      <br><br>
      <em>Claude 3 Opus, Sonnet, Haiku - the most intelligent models</em>
    </td>
    <td align="center" width="33%">
      <h3>🌟 Google</h3>
      <img src="https://img.shields.io/badge/Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google">
      <br><br>
      <em>Gemini Pro, Ultra - the future of AI from Google</em>
    </td>
  </tr>
</table>

### 🛠️ Artifacts - Interactive Creation

<div align="center">

| Artifact Type | Features | Status |
|:-------------|:--------|:-------|
| **📝 Documents** | Text editor, suggestions, versioning | ✅ Ready |
| **💻 Code** | Syntax highlighting, code execution, debugging | ✅ Ready |
| **📊 Spreadsheets** | Spreadsheet editor, charts, calculations | ✅ Ready |
| **🖼️ Images** | Generation, editing, optimization | ✅ Ready |

</div>

### 🗂️ Advanced Organization

<div align="center">

#### 📁 **Folders & Tags**
*Organize your conversations in a way that makes sense*

#### 🔐 **Different Account Types**
*From guests to premium - everyone finds something for themselves*

#### 🎨 **Personalization**
*Dark/light themes, custom model settings*

</div>

---

## 🏗️ Architecture & Technologies

<div align="center">

### Frontend & Framework
![Next.js](https://img.shields.io/badge/Next.js-15.3.3-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.10-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

### AI & Backend
![AI SDK](https://img.shields.io/badge/AI%20SDK-4.3.16-FF6B6B?style=for-the-badge&logo=ai&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-0.44.2-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![NextAuth](https://img.shields.io/badge/NextAuth-5.0.0-9333EA?style=for-the-badge&logo=auth0&logoColor=white)

### UI/UX & Tools
![Radix UI](https://img.shields.io/badge/Radix%20UI-161618?style=for-the-badge&logo=radixui&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![Biome](https://img.shields.io/badge/Biome-60A5FA?style=for-the-badge&logo=biome&logoColor=white)

</div>

---

## 🚀 Quick Start

### Requirements
- **Node.js** 18+ or **Bun** (recommended)
- **PostgreSQL** database
- **API Keys** from preferred AI providers

### Installation

```bash
# Clone the repository
git clone https://github.com/rabbit-tale-co/ai-t3-clone
cd ai-t3-clone

# Install dependencies (with Bun - faster!)
bun install

# Or with npm
npm install
```

### Configuration

```bash
# Copy environment file
cp .env.example .env.local

# Fill in environment variables
# DATABASE_URL=postgresql://...
# NEXTAUTH_SECRET=your-secret-here
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```

### Database Setup

```bash
# Generate migrations
bun run db:generate

# Run migrations
bun run db:migrate

# (Optional) Open Drizzle Studio
bun run db:studio
```

### Running

```bash
# Development server
bun run dev

# Build for production
bun run build

# Start production
bun run start
```

---

## 🌟 User Features

<div align="center">

### 👤 **Account Types**

| Type | Limits | Features | Price |
|:----|:-------|:--------|:-----|
| **🆓 Guest** | 10 messages/day | Basic models, (max 2 folders and 3 tags) | Free |
| **👥 Regular** | 20 messages/day | More model choices, (max 5 folders and 10 tags) | Free |
| **⭐ Pro** | 50 messages/day | All models, priority (max 15 folders and 25 tags) | $8/month |
| **👑 Admin** | Unlimited | Admin panel (maybe someday ) | - |

</div>

### 🔐 Authentication

- **Email/Password** - classic registration
- **Guest Mode** - quick start without registration
- **Secure sessions** with NextAuth.js
- **API Keys management** - add your own keys

---

## 🎨 Implementation Details

### 📝 Artifact System

```typescript
// Example of artifact system usage
export interface UIArtifact {
  title: string;
  documentId: string;
  kind: ArtifactKind;
  content: string;
  isVisible: boolean;
  status: 'streaming' | 'idle';
  boundingBox: BoundingBox;
}
```

### 🤖 Multi-Model API

```typescript
// Easy switching between models
const models = [
  'gpt-4-turbo-preview',
  'claude-3-opus-20240229',
  'gemini-pro',
  'mixtral-8x7b-instruct'
];
```

### 📊 Real-time Streaming

- **Server-Sent Events** for real-time responses
- **Resumable streams** - recover interrupted conversations
- **Optimistic updates** for better UX

---

## 🔧 Development Scripts

```bash
# Code formatting
bun run format

# Linting
bun run lint
bun run lint:fix

# Testing
bun run test

# Database operations
bun run db:generate    # Generate migrations
bun run db:migrate     # Run migrations
bun run db:studio      # Open Drizzle Studio
bun run db:push        # Push schema to DB
```

---

## 📈 Roadmap & Plans

> [!IMPORTANT]
> **🎯 Version 3.1**: Enhanced artifacts, better model management
>
> **🎯 Version 3.2**: Plugin system, custom AI models
>
> **🎯 Version 4.0**: Team collaboration, shared workspaces

> [!NOTE]
> **Current status:**
> - [x] Basic AI chat system
> - [x] Support for 9+ AI providers
> - [x] Artifact system (documents, code, spreadsheets, images)
> - [x] Folders and tags
> - [x] Different user types
> - [ ] Plugin system
> - [ ] Team collaboration
> - [ ] Mobile app

---

## 🤝 Support & Community

<div align="center">

### 💻 For Developers

[![Documentation](https://img.shields.io/badge/Docs-Read%20More-4ECDC4?style=for-the-badge&logo=gitbook&logoColor=white)](./docs)
[![API Reference](https://img.shields.io/badge/API-Reference-FF6B6B?style=for-the-badge&logo=swagger&logoColor=white)](./docs/api)
[![Contributing](https://img.shields.io/badge/Contributing-Guide-45B7D1?style=for-the-badge&logo=github&logoColor=white)](./CONTRIBUTING.md)

### 🐛 Issues & Bugs

[![GitHub Issues](https://img.shields.io/badge/Issues-Report%20Bug-D63031?style=for-the-badge&logo=github&logoColor=white)](https://github.com/rabbit-tale-co/ai-t3-clone/issues)
[![Feature Requests](https://img.shields.io/badge/Features-Request-00B894?style=for-the-badge&logo=github&logoColor=white)](https://github.com/rabbit-tale-co/ai-t3-clone/issues/new?template=feature_request.md)

</div>

---

## 📄 License & Legal

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for detailed information.

### Used AI Models
- We respect the terms of service of all AI providers
- API keys are stored securely and encrypted
- User data is protected in accordance with GDPR

---

<div align="center">

### 🌟 *"The future of AI is here - experience it now"* 🚀

**Made with ❤️ for the community**

*Powered by the latest AI models* ✨

---

[![Visitors](https://img.shields.io/badge/Visitors-Welcome-FFB6C1?style=for-the-badge&logo=github&logoColor=black)](https://github.com/rabbit-tale-co/ai-t3-clone)
[![Stars](https://img.shields.io/github/stars/rabbit-tale-co/ai-t3-clone?style=for-the-badge&logo=github&logoColor=white&color=yellow)](https://github.com/rabbit-tale-co/ai-t3-clone/stargazers)
[![Forks](https://img.shields.io/github/forks/rabbit-tale-co/ai-t3-clone?style=for-the-badge&logo=github&logoColor=white&color=green)](https://github.com/rabbit-tale-co/ai-t3-clone/network/members)
[![License](https://img.shields.io/github/license/rabbit-tale-co/ai-t3-clone?style=for-the-badge&logo=opensourceinitiative&logoColor=white&color=blue)](./LICENSE)

</div>
