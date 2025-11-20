<template>
  <div v-if="suggestions && suggestions.length > 0" class="bg-[#161b22] rounded-lg border border-[#30363d] p-6 mb-6">
    <div class="flex items-center space-x-3 mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#a371f7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <h3 class="text-lg font-semibold text-[#c9d1d9]">Intelligent Refactoring Suggestions</h3>
      <span class="ml-auto text-sm text-[#8b949e]">{{ suggestions.length }} suggestion{{ suggestions.length !== 1 ? 's' : '' }}</span>
    </div>

    <div class="space-y-4">
      <div v-for="(suggestion, idx) in suggestions" :key="idx" class="bg-[#0d1117] rounded-lg border border-[#30363d] p-4">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center space-x-3">
            <span v-if="suggestion.severity || suggestion.priority" class="text-xs font-mono px-2 py-1 rounded" :class="getPriorityClass(suggestion.severity || suggestion.priority)">
              {{ suggestion.severity || suggestion.priority }}
            </span>
            <span v-if="suggestion.type" class="text-xs px-2 py-1 rounded bg-[#161b22] text-[#a371f7] border border-[#30363d]">
              {{ suggestion.type }}
            </span>
            <span class="text-sm font-medium text-[#58a6ff]">{{ suggestion.file }}</span>
          </div>
        </div>

        <div class="space-y-3">
          <!-- Title -->
          <div v-if="suggestion.title">
            <h5 class="text-sm font-semibold text-[#c9d1d9] mb-2">{{ suggestion.title }}</h5>
          </div>

          <!-- Issue / Description (Clean display - parse out redundant text) -->
          <div v-if="getCleanIssue(suggestion)">
            <h5 class="text-xs font-semibold text-[#8b949e] mb-1">🔍 Issue</h5>
            <p class="text-sm text-[#c9d1d9]">{{ getCleanIssue(suggestion) }}</p>
          </div>

          <!-- Before Code -->
          <div v-if="suggestion.before" class="bg-[#161b22] rounded p-3 border border-[#30363d]">
            <h5 class="text-xs font-semibold text-[#8b949e] mb-2">❌ Before</h5>
            <pre class="text-xs text-[#c9d1d9] overflow-x-auto"><code>{{ suggestion.before }}</code></pre>
          </div>

          <!-- Recommendation (Clean display) -->
          <div v-if="getCleanRecommendation(suggestion)">
            <h5 class="text-xs font-semibold text-[#8b949e] mb-1">💡 Recommendation</h5>
            <pre v-if="suggestion.after" class="text-xs text-[#3fb950] bg-[#161b22] rounded p-3 border border-[#30363d] overflow-x-auto"><code>{{ suggestion.after }}</code></pre>
            <p v-else class="text-sm text-[#c9d1d9]">{{ getCleanRecommendation(suggestion) }}</p>
          </div>

          <!-- Benefits (Clean display) -->
          <div v-if="getCleanBenefits(suggestion)">
            <div class="bg-[#161b22] rounded p-3 border border-[#30363d]">
              <h5 class="text-xs font-semibold text-[#3fb950] mb-1">✨ Benefits</h5>
              <p class="text-sm text-[#8b949e]">{{ getCleanBenefits(suggestion) }}</p>
            </div>
          </div>

          <!-- Impact (Clean display - only if not already in benefits) -->
          <div v-if="getCleanImpact(suggestion)">
            <div class="bg-[#161b22] rounded p-3 border border-[#30363d]">
              <h5 class="text-xs font-semibold text-[#d29922] mb-1">🎯 Impact on Other Files</h5>
              <p class="text-sm text-[#8b949e]">{{ getCleanImpact(suggestion) }}</p>
            </div>
          </div>

          <!-- Security (Clean display - only if not already in benefits) -->
          <div v-if="getCleanSecurity(suggestion)">
            <div class="bg-[#161b22] rounded p-3 border border-[#30363d]">
              <h5 class="text-xs font-semibold text-[#f85149] mb-1">🔒 Security Implications</h5>
              <p class="text-sm text-[#8b949e]">{{ getCleanSecurity(suggestion) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RefactorSuggestion } from '../utils/aiResponseParser';

defineProps<{
  suggestions: RefactorSuggestion[] | undefined;
}>();

function getPriorityClass(priority: string | undefined): string {
  if (!priority) return 'bg-[#30363d] text-[#8b949e]';
  const p = priority.toUpperCase();
  switch (p) {
    case 'HIGH': 
    case 'CRITICAL': 
      return 'bg-[#f851491a] text-[#f85149]';
    case 'MEDIUM': 
      return 'bg-[#d299221a] text-[#d29922]';
    case 'LOW': 
      return 'bg-[#3fb9501a] text-[#3fb950]';
    default: 
      return 'bg-[#30363d] text-[#8b949e]';
  }
}

// Clean up duplicate/redundant text
function getCleanIssue(suggestion: any): string {
  const issue = suggestion.issue || suggestion.description || '';
  // Remove everything after " - Refactor Recommendation:" to avoid duplication
  return issue.split(' - Refactor Recommendation:')[0].trim();
}

function getCleanRecommendation(suggestion: any): string {
  const rec = suggestion.recommendation || suggestion.after || '';
  // Remove everything after " - Impact on Other Files:" to avoid duplication
  return rec.split(' - Impact on Other Files:')[0].trim();
}

function getCleanBenefits(suggestion: any): string {
  const benefits = suggestion.benefits || '';
  // Only show if it doesn't contain redundant info
  if (benefits.includes('Security Implications:') || benefits.includes('Impact on Other Files:')) {
    // Extract just the benefits part
    return benefits.split(' - Security Implications:')[0].split(' - Impact on Other Files:')[0].replace('Expected Benefits:', '').trim();
  }
  return benefits;
}

function getCleanImpact(suggestion: any): string {
  const impact = suggestion.impactOnOtherFiles || '';
  // Remove security implications if present
  const clean = impact.split(' - Security Implications:')[0].split(' - Expected Benefits:')[0].trim();
  // Only show if meaningful and not "None"
  return clean && clean.toLowerCase() !== 'none' ? clean : '';
}

function getCleanSecurity(suggestion: any): string {
  const security = suggestion.securityImplications || '';
  // Remove expected benefits if present
  const clean = security.split(' - Expected Benefits:')[0].trim();
  // Only show if meaningful and not "None"
  return clean && clean.toLowerCase() !== 'none' ? clean : '';
}
</script>
