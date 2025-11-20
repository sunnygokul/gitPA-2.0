# 🤖 AI Providers Configuration Guide

This document explains the FREE AI providers integrated into GitPA v2.0 and how to configure them.

## 🎯 Provider Priority & Strategy

The system uses a **cascading fallback strategy** to ensure maximum reliability:

```
1st: Google Gemini 2.5 Flash  (Primary - Best for code analysis)
     ↓ (if rate limited or fails)
2nd: Groq (Llama 3.3 70B)     (Fast fallback - Lightning speed)
     ↓ (if rate limited or fails)
3rd: HuggingFace (Qwen)       (Additional fallback)
     ↓ (if all fail)
Error: "All AI providers failed"
```

---

## ✅ Provider #1: Google Gemini 2.5 Flash (PRIMARY)

### Why Gemini?
- ✅ **COMPLETELY FREE** (no credit card required)
- ✅ **1M token context window** (can analyze entire large repositories!)
- ✅ **1,500 requests/day** FREE tier
- ✅ **Excellent code understanding** (trained on code)
- ✅ **8K output tokens** per request
- ✅ **Global availability** (no region restrictions)

### Rate Limits (FREE Tier)
- **15 RPM** (Requests Per Minute)
- **1M TPM** (Tokens Per Minute)
- **1,500 RPD** (Requests Per Day)

### Setup Instructions

1. **Get API Key** (FREE, no credit card):
   - Go to: https://aistudio.google.com/apikey
   - Sign in with your Google account
   - Click **"Create API Key"**
   - Copy the API key (starts with `AIza...`)

2. **Add to Vercel** (Production):
   - Go to: https://vercel.com/dashboard
   - Select your project
   - Go to **Settings** → **Environment Variables**
   - Add new variable:
     - Name: `GEMINI_API_KEY`
     - Value: `[paste your API key]`
     - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**
   - **Redeploy** your application

3. **Add to Local `.env`** (Development):
   ```bash
   # backend/.env or frontend/.env
   GEMINI_API_KEY="AIzaSyC-YourActualAPIKeyHere..."
   ```

### Usage Stats
With 1,500 requests/day FREE:
- **Analyze ~100 repos/day** (15 requests per repo for full analysis)
- **Perfect for development** and small production apps
- **No credit card** ever required

---

## ⚡ Provider #2: Groq (Llama 3.3 70B) - FAST FALLBACK

### Why Groq?
- ✅ **COMPLETELY FREE** tier available
- ✅ **14,400 requests/day** FREE (nearly 10x more than Gemini!)
- ✅ **Lightning-fast inference** (LPU architecture - 10x faster than GPUs)
- ✅ **128K context window** (sufficient for most repos)
- ✅ **Llama 3.3 70B model** (excellent code quality)
- ✅ **OpenAI-compatible API** (easy to integrate)

### Rate Limits (FREE Tier)
- **30 RPM** (Requests Per Minute)
- **12K TPM** (Tokens Per Minute)
- **14,400 RPD** (Requests Per Day)

### Setup Instructions

1. **Get API Key** (FREE, no credit card):
   - Go to: https://console.groq.com/
   - Sign up with email or GitHub
   - Go to **API Keys** section
   - Click **"Create API Key"**
   - Copy the API key (starts with `gsk_...`)

2. **Add to Vercel** (Production):
   - Go to: https://vercel.com/dashboard
   - Select your project
   - Go to **Settings** → **Environment Variables**
   - Add new variable:
     - Name: `GROQ_API_KEY`
     - Value: `[paste your API key]`
     - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**
   - **Redeploy** your application

3. **Add to Local `.env`** (Development):
   ```bash
   # backend/.env or frontend/.env
   GROQ_API_KEY="gsk_YourActualGroqAPIKeyHere..."
   ```

### Usage Stats
With 14,400 requests/day FREE:
- **Analyze ~1,000 repos/day** (14 requests per repo)
- **Perfect for high-volume production** apps
- **Blazing fast** responses (~500 tokens/second!)

---

## 🔄 Provider #3: HuggingFace (Qwen 2.5-7B) - ADDITIONAL FALLBACK

### Why HuggingFace?
- ✅ **FREE tier available**
- ✅ **Multiple models** to choose from
- ✅ **Good code understanding** (Qwen 2.5-7B specialized for code)
- ⚠️ **Very limited free tier** (few requests/day)
- ⚠️ **Account-based rate limits** (shared across all API keys)

### Rate Limits (FREE Tier)
- **Very limited** (approximately 10-50 requests/day)
- **Rate limits exhausted quickly** (as you experienced)
- **Not recommended** as primary provider

### Setup Instructions

1. **Get API Key** (FREE):
   - Go to: https://huggingface.co/settings/tokens
   - Sign in or create account
   - Click **"New token"**
   - Copy the token (starts with `hf_...`)

2. **Add to Vercel/Local** (Optional - for fallback only):
   ```bash
   HUGGINGFACE_API_KEY="hf_YourActualAPIKeyHere..."
   ```

### Recommendation
**Use only as last resort fallback.** Gemini + Groq provide 16,000+ requests/day which should be more than sufficient.

---

## 🚀 Quick Start (Recommended Setup)

### For Development:
1. **Get Gemini API key** (Primary - takes 2 minutes)
2. **Get Groq API key** (Fallback - takes 2 minutes)
3. Add to `backend/.env`:
   ```bash
   GEMINI_API_KEY="AIzaSyC-YourGeminiKeyHere..."
   GROQ_API_KEY="gsk_YourGroqKeyHere..."
   GITHUB_TOKEN="github_pat_YourTokenHere..."
   ```

### For Production (Vercel):
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add **3 environment variables**:
   - `GEMINI_API_KEY` = [Your Gemini key]
   - `GROQ_API_KEY` = [Your Groq key]
   - `GITHUB_TOKEN` = [Your GitHub token]
3. Click **Save** and **Redeploy**

### Test It Works:
```bash
# In Vercel Function Logs, you should see:
Attempting AI call with Google Gemini 2.5 Flash...
Google Gemini 2.5 Flash: Success ✅
```

If Gemini fails (rate limited):
```bash
Attempting AI call with Google Gemini 2.5 Flash...
Google Gemini 2.5 Flash: Rate limited, trying next provider
Attempting AI call with Groq (Llama 3.3 70B)...
Groq (Llama 3.3 70B): Success ✅
```

---

## 📊 Provider Comparison Table

| Provider | Free Tier | Rate Limit | Context | Output | Speed | Code Quality | Best For |
|----------|-----------|------------|---------|--------|-------|--------------|----------|
| **Gemini 2.5 Flash** | ✅ Forever | 1,500/day | 1M tokens | 8K | Fast | ⭐⭐⭐⭐⭐ | Primary |
| **Groq (Llama 3.3)** | ✅ Forever | 14,400/day | 128K | 8K | Ultra-fast | ⭐⭐⭐⭐ | High-volume |
| **HuggingFace** | ⚠️ Limited | ~10-50/day | 32K | 4K | Medium | ⭐⭐⭐ | Fallback only |

---

## 💡 Cost Analysis

### Current Setup (FREE):
- **Gemini**: 1,500 requests/day = 45,000 requests/month
- **Groq**: 14,400 requests/day = 432,000 requests/month
- **TOTAL**: **477,000 FREE requests/month** = **$0/month** 🎉

### What This Means:
- **100 users** analyzing 10 repos/day = 15,000 requests/day ✅ Covered
- **1,000 users** analyzing 1 repo/day = 15,000 requests/day ✅ Covered
- **Enterprise scale** (100K+ requests/day) = Need paid tier

### If You Need More (Paid Tiers):
- **Gemini Paid**: $0.10-0.30 per 1M input tokens, $0.40-2.50 per 1M output tokens
- **Groq Paid**: Contact for pricing (very affordable)
- **Claude 3.5 Sonnet**: $3 per 1M input, $15 per 1M output (if you need highest quality)

---

## 🔧 Advanced Configuration

### Custom Model Selection

Edit `frontend/api/repo/utils/ai-service.ts`:

```typescript
// Use different Gemini model
model: 'gemini-2.5-pro' // More powerful, same free tier

// Use different Groq model
model: 'llama-3.1-8b-instant' // Faster, smaller
model: 'mixtral-8x7b-32768' // Good alternative
```

### Adjust Provider Priority

Reorder the `providers` array in `ai-service.ts`:

```typescript
const providers: AIProvider[] = [
  { name: 'Groq', ...callGroq },      // Make Groq primary
  { name: 'Gemini', ...callGemini },   // Gemini as fallback
];
```

### Add More Providers

Want to add **Claude**, **DeepSeek**, or others? Edit `ai-service.ts`:

```typescript
// Example: Add DeepSeek Coder
async function callDeepSeek(prompt: string, context: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-coder',
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: `${context}\n\n${prompt}` }
      ],
      max_tokens: 4000,
    }),
  });
  const data = await response.json();
  return data.choices[0].message.content;
}

// Add to providers array
{
  name: 'DeepSeek Coder',
  available: !!process.env.DEEPSEEK_API_KEY,
  maxContext: 128000,
  call: callDeepSeek
}
```

---

## ❓ FAQ

### Q: Which provider is best?
**A:** Gemini 2.5 Flash for code analysis (1M context = analyze huge repos).

### Q: Will I ever need to pay?
**A:** Not for small-medium apps. 477K free requests/month is enough for most use cases.

### Q: What if I hit rate limits?
**A:** Automatic fallback to next provider. If all fail, error is returned.

### Q: Can I use only Groq (skip Gemini)?
**A:** Yes! Just don't set `GEMINI_API_KEY`. Groq will be used as primary.

### Q: How do I monitor usage?
**A:** Check Vercel function logs. Each request shows which provider was used.

### Q: Is my data used for training?
**A:** Free tier: Yes (both Gemini and Groq). Paid tier: No.

---

## 🔗 Useful Links

- **Gemini Docs**: https://ai.google.dev/gemini-api/docs
- **Gemini Pricing**: https://ai.google.dev/pricing
- **Groq Console**: https://console.groq.com/
- **Groq Docs**: https://console.groq.com/docs/quickstart
- **HuggingFace**: https://huggingface.co/docs/api-inference/

---

## 📝 Summary

**Recommended Setup for Everyone:**
1. ✅ Get Gemini API key (FREE, 2 minutes)
2. ✅ Get Groq API key (FREE, 2 minutes)
3. ✅ Add both to Vercel environment variables
4. 🎉 Enjoy 477,000 FREE AI-powered code analyses per month!

**Why this works:**
- Gemini = Best quality for code analysis (1M context)
- Groq = Lightning fast fallback (14K requests/day)
- No credit card needed
- No expiration
- No hidden fees
- Production-ready

---

*Last Updated: November 20, 2025*
*GitPA v2.0 - AI-Powered GitHub Repository Analyzer*
