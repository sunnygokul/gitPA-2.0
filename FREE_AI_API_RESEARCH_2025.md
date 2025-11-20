# FREE AI APIs for Code Analysis - Comprehensive Research 2025

**Research Date:** November 20, 2025  
**Purpose:** Identify truly FREE AI APIs suitable for GitHub repository code analysis

---

## Executive Summary

After comprehensive research, here are the **truly FREE options** that meet your requirements:

### ✅ Best FREE Options (No Credit Card Required)
1. **Google Gemini** - Most generous free tier
2. **Groq** - Extremely fast inference with free tier
3. **Hugging Face Inference API** - Multiple models, free tier available

### ⚠️ Limited Free Options (Require Credit Card or Deposits)
4. **Cohere** - Free trial tier with limitations
5. **Together.ai** - Pay-as-you-go only (no free tier)

### ❌ NO Free API Access
6. **Claude (Anthropic)** - Requires $5 minimum deposit
7. **DeepSeek** - Available through aggregators only
8. **Code Llama** - Available through aggregators only
9. **Mistral AI** - No free API tier

---

## Detailed Provider Analysis

### 1. Google Gemini ⭐ **BEST FOR CODE ANALYSIS**

**Status:** ✅ **COMPLETELY FREE** (No credit card required)

#### Free Tier Details:
- **Truly Free:** Yes, no payment method required
- **Rate Limits:**
  - **Gemini 2.5 Flash:** 15 RPM, 1M TPM, 1,500 RPD
  - **Gemini 2.0 Flash:** 15 RPM, 1M TPM, 200 RPD
  - **Gemini 2.5 Flash-Lite:** 15 RPM, 250K TPM, 1,000 RPD
- **Context Window:** Up to 1M tokens (2M for some models)
- **Output Limits:** Varies by model
- **Geographic Restrictions:** Available in most countries
- **API Key:** Free at https://aistudio.google.com/apikey

#### Best Model for Code Analysis:
**Gemini 2.5 Flash** or **Gemini 2.0 Flash**
- Excellent at code understanding and reasoning
- 1M token context window (can analyze entire large repositories)
- FREE input and output tokens
- Fast inference

#### Code Example:
```python
import google.generativeai as genai

genai.configure(api_key='YOUR_API_KEY')
model = genai.GenerativeModel('gemini-2.5-flash')

response = model.generate_content(
    f"Analyze this code and identify security vulnerabilities:\n\n{code}"
)
print(response.text)
```

#### Integration:
- REST API: ✅ Simple
- SDKs: Python, JavaScript, Go, Kotlin
- Documentation: Excellent

#### Verdict:
🏆 **TOP CHOICE** - Most generous free tier, excellent for code analysis, no credit card needed, high rate limits

---

### 2. Groq ⭐ **FASTEST INFERENCE**

**Status:** ✅ **COMPLETELY FREE** (No credit card required for free tier)

#### Free Tier Details:
- **Truly Free:** Yes for trial accounts
- **Rate Limits (Free Tier):**
  - **Llama 3.3 70B:** 30 RPM, 14.4K RPD, 12K TPM, 100K TPD
  - **Llama 3.1 8B:** 30 RPM, 14.4K RPD, 6K TPM, 500K TPD
  - **Qwen3 32B:** 60 RPM, 1K RPD, 6K TPM, 500K TPD
  - **GPT-OSS-120B:** 30 RPM, 1K RPD, 8K TPM, 200K TPD
- **Context Window:** 128K tokens (Llama 3.3 70B)
- **Output Limits:** Varies by model
- **Geographic Restrictions:** Global
- **API Key:** Free at https://console.groq.com/

#### Best Model for Code Analysis:
**Llama 3.3 70B Versatile** or **Qwen3 32B**
- Excellent code understanding
- Very fast inference (Groq's LPU architecture)
- Good context window

#### Pricing After Free Tier:
- Llama 3.3 70B: $0.59/1M input, $0.79/1M output
- Llama 3.1 8B: $0.05/1M input, $0.08/1M output
- Very affordable for production use

#### Code Example:
```python
from groq import Groq

client = Groq(api_key="YOUR_API_KEY")
completion = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {"role": "user", "content": f"Analyze this code: {code}"}
    ]
)
print(completion.choices[0].message.content)
```

#### Integration:
- REST API: ✅ Simple (OpenAI-compatible)
- SDKs: Python, JavaScript
- Documentation: Excellent

#### Verdict:
🚀 **BEST FOR SPEED** - Extremely fast inference, generous free tier, great for development and testing

---

### 3. Hugging Face Inference API ⭐ **MOST MODEL VARIETY**

**Status:** ✅ **FREE TIER AVAILABLE** (No credit card required)

#### Free Tier Details:
- **Truly Free:** Yes for community tier
- **Rate Limits (Free):** Varies by model, generally limited but usable
- **PRO Account:** $9/month gives 20× inference credits
- **Context Window:** Varies by model (typically 4K-32K)
- **Output Limits:** Varies by model
- **Geographic Restrictions:** Global
- **API Key:** Free at https://huggingface.co/settings/tokens

#### Available Free Models for Code:
- **CodeLlama models** (via inference API)
- **StarCoder models**
- **DeepSeek Coder** (via aggregators like Together.ai on HF)
- **Qwen2.5-Coder models**
- **Many open-source code models**

#### Best Models for Code Analysis:
- **CodeLlama-34B-Instruct**
- **StarCoder2-15B**
- **Qwen2.5-Coder-32B-Instruct**

#### Code Example:
```python
from huggingface_hub import InferenceClient

client = InferenceClient(token="YOUR_HF_TOKEN")
response = client.chat_completion(
    model="meta-llama/CodeLlama-34b-Instruct-hf",
    messages=[{"role": "user", "content": f"Review this code: {code}"}]
)
print(response.choices[0].message.content)
```

#### Integration:
- REST API: ✅ Available
- SDKs: Python, JavaScript
- Documentation: Good
- Inference Providers: Access to multiple backends (Groq, Together.ai, etc.)

#### Verdict:
🎯 **BEST FOR VARIETY** - Access to hundreds of models, free tier available, great for experimentation

---

### 4. Cohere ⚠️ **LIMITED FREE TRIAL**

**Status:** ⚠️ **TRIAL KEY ONLY** (Limited to 1,000 calls/month)

#### Trial Tier Details:
- **Truly Free:** Trial only (limited)
- **Rate Limits (Trial):**
  - Chat: 10 RPM, 1,000 calls/month
  - Embed: 100 RPM
  - Rerank: 10 RPM
- **Context Window:** 128K tokens (Command R+)
- **Output Limits:** Varies
- **Geographic Restrictions:** Global
- **API Key:** Free trial at https://dashboard.cohere.com/api-keys

#### Production Pricing:
- **Command R:** $0.15/1M input, $0.60/1M output
- **Command R+:** $2.50/1M input, $10/1M output
- Requires production key for serious use

#### Best Model for Code:
**Command R** or **Command R+**
- Good at code understanding
- Multilingual support

#### Verdict:
⚠️ **NOT RECOMMENDED FOR FREE USE** - Only 1,000 calls/month on trial, need production key for real work

---

### 5. Together.ai ❌ **NO FREE TIER**

**Status:** ❌ **PAY-AS-YOU-GO ONLY** (Credit card required)

#### Pricing:
- **DeepSeek-V3:** $0.60/1M input, $1.70/1M output
- **Qwen3-Coder-480B:** $2.00/1M input, $2.00/1M output
- **Llama 3.1 70B:** $0.88/1M input, $0.88/1M output
- **Code Llama 70B:** Available but requires payment

#### Features:
- Access to many cutting-edge models
- Fast inference
- Batch API with 50% discount
- NO free tier

#### Verdict:
❌ **NOT FREE** - Requires payment from the start, but very affordable for production use

---

### 6. Claude (Anthropic) ❌ **NO FREE API**

**Status:** ❌ **MINIMUM $5 DEPOSIT REQUIRED**

#### API Pricing Tiers:
- **Tier 1:** Requires $5 deposit, $100/month limit
- **Tier 2:** Requires $40 cumulative, $500/month limit
- **Tier 3:** Requires $200 cumulative, $1,000/month limit
- **Tier 4:** Requires $400 cumulative, $5,000/month limit

#### Rate Limits (Tier 1):
- **Claude 3.5 Sonnet:** 50 RPM, 40K ITPM, 8K OTPM
- **Claude 3 Haiku:** 50 RPM, 100K ITPM, 20K OTPM

#### Pricing:
- **Claude 3.5 Sonnet:** $3/1M input, $15/1M output
- **Claude 3 Haiku:** $0.25/1M input, $1.25/1M output

#### Best Model for Code:
**Claude 3.5 Sonnet** - Excellent at code analysis but EXPENSIVE

#### Verdict:
❌ **NOT FREE** - Requires $5 minimum deposit, expensive compared to alternatives

---

### 7. DeepSeek Coder V2 ℹ️ **AVAILABLE VIA AGGREGATORS**

**Status:** ℹ️ **NO DIRECT FREE API** (Available through aggregators)

#### Where to Access:
1. **Together.ai** - $0.60/1M input, $1.70/1M output (paid)
2. **Hugging Face Inference API** - Limited free tier possible
3. **SiliconFlow** - Free tier in some regions (China-based)

#### Model Details:
- **DeepSeek-V3:** 685B parameters, excellent for code
- **DeepSeek-Coder-V2:** Specialized for coding
- **Context Window:** 64K-128K tokens

#### Verdict:
ℹ️ **NO DIRECT FREE ACCESS** - Must use aggregators, which may have costs

---

### 8. Code Llama 70B ℹ️ **AVAILABLE VIA AGGREGATORS**

**Status:** ℹ️ **NO DIRECT FREE API** (Available through aggregators)

#### Where to Access:
1. **Groq** - Free tier available (14.4K RPD)
2. **Together.ai** - Paid only
3. **Hugging Face** - Free inference API (limited)
4. **Replicate** - Pay per use

#### Model Details:
- **Code Llama 70B:** Meta's largest code model
- **Context Window:** 16K-100K tokens
- Excellent for code generation and analysis

#### Verdict:
✅ **FREE VIA GROQ** - Best accessed through Groq's free tier

---

### 9. Mistral AI ❌ **NO FREE API TIER**

**Status:** ❌ **PAID API ONLY**

#### Chat Pricing (Le Chat):
- **Free Plan:** Le Chat web interface (not API)
- **Pro Plan:** $14.99/month (not API access)

#### API Pricing:
- **Mistral Large:** $2/1M input, $6/1M output
- **Mistral Small:** $0.20/1M input, $0.60/1M output
- **Codestral:** $0.20/1M input, $0.60/1M output

#### Verdict:
❌ **NO FREE API** - Le Chat is free but API requires payment

---

## Comparison Table

| Provider | Free API | No CC Required | Rate Limits | Context Window | Best Model | Code Analysis |
|----------|----------|----------------|-------------|----------------|------------|---------------|
| **Google Gemini** | ✅ Yes | ✅ Yes | 15 RPM, 1M TPM | 1M-2M tokens | Gemini 2.5 Flash | ⭐⭐⭐⭐⭐ |
| **Groq** | ✅ Yes | ✅ Yes | 30 RPM, 6-12K TPM | 128K tokens | Llama 3.3 70B | ⭐⭐⭐⭐⭐ |
| **Hugging Face** | ✅ Limited | ✅ Yes | Varies | 4K-32K | CodeLlama 34B | ⭐⭐⭐⭐ |
| **Cohere** | ⚠️ Trial | ✅ Yes | 10 RPM, 1K/mo | 128K | Command R | ⭐⭐⭐ |
| **Together.ai** | ❌ No | ❌ No | N/A (paid) | Varies | Multiple | ⭐⭐⭐⭐⭐ |
| **Claude** | ❌ No | ❌ No | N/A ($5 min) | 200K | Sonnet 3.5 | ⭐⭐⭐⭐⭐ |
| **DeepSeek** | ℹ️ Indirect | Varies | Via aggregators | 64K-128K | DeepSeek-V3 | ⭐⭐⭐⭐⭐ |
| **Code Llama** | ✅ Via Groq | ✅ Yes | Via Groq | 100K | Code Llama 70B | ⭐⭐⭐⭐ |
| **Mistral** | ❌ No | ❌ No | N/A (paid) | 32K | Codestral | ⭐⭐⭐⭐ |

---

## Recommendations for Your Code Analysis Project

### 🏆 Primary Recommendation: **Google Gemini 2.5 Flash**

**Why:**
1. ✅ Completely FREE (no credit card)
2. ✅ Very generous rate limits (1M tokens per minute!)
3. ✅ Massive context window (1M tokens = entire large repos)
4. ✅ Excellent code understanding
5. ✅ Fast and reliable
6. ✅ No geographic restrictions
7. ✅ Easy REST API integration

**Rate Limits Are Perfect:**
- 15 RPM = 21,600 requests/day
- 1M TPM = can analyze huge files
- 1,500 RPD = plenty for development

### 🥈 Secondary Recommendation: **Groq (Llama 3.3 70B)**

**Why:**
1. ✅ FREE tier available
2. ✅ EXTREMELY FAST inference
3. ✅ Good code understanding
4. ✅ OpenAI-compatible API
5. ✅ Affordable for production ($0.59/$0.79 per 1M tokens)

**Use Case:**
- When you need lightning-fast responses
- When Gemini rate limits are reached
- For testing and development

### 🥉 Tertiary Option: **Hugging Face Inference API**

**Why:**
1. ✅ Access to hundreds of models
2. ✅ Can experiment with different approaches
3. ✅ CodeLlama and other specialized models
4. ✅ Free tier available

**Use Case:**
- Experimentation with different models
- Specialized tasks (code completion, etc.)
- When you want model variety

---

## Implementation Strategy

### Phase 1: Development (FREE)
1. **Primary:** Google Gemini 2.5 Flash
   - Use for all main features
   - 1,500 requests/day is plenty for development
2. **Backup:** Groq (Llama 3.3 70B)
   - Fallback when Gemini limits reached
   - Testing alternative analysis approaches

### Phase 2: Production (Mostly FREE + Low Cost)
1. **Primary:** Google Gemini 2.5 Flash (FREE)
   - Should handle most usage
   - If you exceed free tier, upgrade to paid tier (very affordable)
2. **Secondary:** Groq (Llama 3.3 70B)
   - For high-speed requirements
   - Production pricing is very affordable
   - $0.59-$0.79 per 1M tokens
3. **Tertiary:** Paid tier only if needed
   - Together.ai for DeepSeek-V3 ($0.60/$1.70 per 1M)
   - Only for advanced features

### Cost Estimation (if exceeding free tier):
- **Gemini 2.5 Flash (Paid):** $0.30/$2.50 per 1M tokens
- **Groq (Llama 3.3):** $0.59/$0.79 per 1M tokens
- **Example:** Analyzing 1,000 repos/day with 10K tokens each
  - Input: 10M tokens/day = $3-6/day
  - Output: ~1M tokens/day = $0.79-2.50/day
  - **Total: $4-9/day = $120-270/month** (worst case)

---

## Sample Integration Code

### 1. Google Gemini Integration

```python
import google.generativeai as genai
from typing import List, Dict

class GeminiCodeAnalyzer:
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def analyze_code(self, code: str, analysis_type: str) -> str:
        """Analyze code with Gemini"""
        prompts = {
            'security': f"Analyze this code for security vulnerabilities:\n\n{code}",
            'quality': f"Review this code for quality issues and best practices:\n\n{code}",
            'bugs': f"Find potential bugs in this code:\n\n{code}",
            'refactor': f"Suggest refactoring improvements for this code:\n\n{code}"
        }
        
        response = self.model.generate_content(prompts.get(analysis_type, prompts['quality']))
        return response.text
    
    def analyze_repository(self, files: List[Dict]) -> Dict:
        """Analyze entire repository"""
        results = {}
        for file in files:
            if file['size'] < 100000:  # Skip very large files
                results[file['path']] = self.analyze_code(
                    file['content'], 
                    'quality'
                )
        return results

# Usage
analyzer = GeminiCodeAnalyzer(api_key="YOUR_GEMINI_API_KEY")
result = analyzer.analyze_code(code_snippet, 'security')
print(result)
```

### 2. Groq Integration (Fallback)

```python
from groq import Groq

class GroqCodeAnalyzer:
    def __init__(self, api_key: str):
        self.client = Groq(api_key=api_key)
    
    def analyze_code(self, code: str, analysis_type: str) -> str:
        """Analyze code with Groq"""
        completion = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a senior code reviewer."},
                {"role": "user", "content": f"Analyze this code for {analysis_type}:\n\n{code}"}
            ],
            temperature=0.3,
            max_tokens=2048
        )
        return completion.choices[0].message.content

# Usage
analyzer = GroqCodeAnalyzer(api_key="YOUR_GROQ_API_KEY")
result = analyzer.analyze_code(code_snippet, 'security issues')
print(result)
```

### 3. Multi-Provider Fallback System

```python
class MultiProviderAnalyzer:
    def __init__(self, gemini_key: str, groq_key: str):
        self.gemini = GeminiCodeAnalyzer(gemini_key)
        self.groq = GroqCodeAnalyzer(groq_key)
        self.rate_limit_tracker = {
            'gemini': {'count': 0, 'limit': 1500, 'reset': None},
            'groq': {'count': 0, 'limit': 14400, 'reset': None}
        }
    
    def analyze_code(self, code: str, analysis_type: str) -> str:
        """Try Gemini first, fallback to Groq if rate limited"""
        try:
            if self.rate_limit_tracker['gemini']['count'] < self.rate_limit_tracker['gemini']['limit']:
                result = self.gemini.analyze_code(code, analysis_type)
                self.rate_limit_tracker['gemini']['count'] += 1
                return result
        except Exception as e:
            print(f"Gemini failed: {e}, falling back to Groq")
        
        try:
            result = self.groq.analyze_code(code, analysis_type)
            self.rate_limit_tracker['groq']['count'] += 1
            return result
        except Exception as e:
            print(f"Groq also failed: {e}")
            raise

# Usage
analyzer = MultiProviderAnalyzer(
    gemini_key="YOUR_GEMINI_KEY",
    groq_key="YOUR_GROQ_KEY"
)
result = analyzer.analyze_code(code, 'security')
```

---

## Key Findings Summary

### ✅ What's Actually FREE (No Credit Card):
1. **Google Gemini** - Best overall choice
2. **Groq** - Best for speed
3. **Hugging Face** - Best for variety

### ⚠️ What Claims "Free" But Has Limits:
1. **Cohere** - Only 1,000 calls/month trial
2. **Hugging Face** - Limited free tier, PRO gives better limits

### ❌ What's NOT Free:
1. **Claude (Anthropic)** - Requires $5 minimum deposit
2. **Together.ai** - Pay-as-you-go only
3. **Mistral AI** - Paid API only
4. **DeepSeek (direct)** - No direct free access

---

## Geographic Restrictions Summary

| Provider | Global Access | Restrictions |
|----------|---------------|--------------|
| Google Gemini | ✅ Yes | [Check available regions](https://ai.google.dev/gemini-api/docs/available-regions) |
| Groq | ✅ Yes | None reported |
| Hugging Face | ✅ Yes | None |
| Cohere | ✅ Yes | None |
| Claude | ✅ Yes | [Supported countries](https://www.anthropic.com/supported-countries) |
| Together.ai | ✅ Yes | None |
| Mistral | ✅ Yes | None |

---

## Final Recommendations

### For Development & Testing:
**Use Google Gemini 2.5 Flash + Groq as backup**
- Cost: $0
- Rate limits: More than enough
- Quality: Excellent

### For Production (Small Scale):
**Start with Google Gemini free tier**
- Free for 1,500 requests/day
- Upgrade to paid if needed ($0.30/$2.50 per 1M tokens)

### For Production (Large Scale):
**Multi-provider approach:**
1. Google Gemini (primary)
2. Groq (high-speed needs)
3. Together.ai (DeepSeek-V3 for advanced analysis)

Estimated cost: $100-500/month depending on usage

---

## Additional Resources

### Documentation Links:
- **Google Gemini:** https://ai.google.dev/gemini-api/docs
- **Groq:** https://console.groq.com/docs/overview
- **Hugging Face:** https://huggingface.co/docs/inference-providers
- **Cohere:** https://docs.cohere.com/
- **Claude:** https://docs.claude.com/

### Community Support:
- **Google Gemini:** https://discuss.ai.google.dev/
- **Groq:** https://community.groq.com/
- **Hugging Face:** https://discuss.huggingface.co/
- **Claude:** https://www.anthropic.com/discord

---

## Conclusion

For a GitHub code analysis project in 2025, **Google Gemini 2.5 Flash** is the clear winner for free usage:

✅ No credit card required  
✅ 1M token context window (analyze entire repos)  
✅ 15 RPM, 1M TPM, 1,500 RPD rate limits  
✅ Excellent code understanding  
✅ FREE input and output  
✅ Easy to integrate  

**Groq (Llama 3.3 70B)** is an excellent backup/fallback option with even faster inference and good free tier limits.

Start with these two providers, and you'll have a robust, FREE code analysis system that can scale to production if needed.

**Total Implementation Cost:** $0 for development and small-scale production use! 🎉
