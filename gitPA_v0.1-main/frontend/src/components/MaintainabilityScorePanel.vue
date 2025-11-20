<template>
  <div v-if="score" class="bg-[#161b22] rounded-lg border border-[#30363d] p-6 mb-6">
    <div class="flex items-center space-x-3 mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#58a6ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <h3 class="text-lg font-semibold text-[#c9d1d9]">Maintainability Score</h3>
    </div>

    <!-- Overall Score -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-[#8b949e]">Overall Score</span>
        <span class="text-2xl font-bold" :class="getScoreColor(score.overall)">{{ score.overall }}/100</span>
      </div>
      <div class="w-full bg-[#0d1117] rounded-full h-3 overflow-hidden border border-[#30363d]">
        <div 
          class="h-full transition-all duration-500 rounded-full"
          :class="getScoreBgColor(score.overall)"
          :style="{ width: `${score.overall}%` }"
        ></div>
      </div>
    </div>

    <!-- Score Breakdown -->
    <div v-if="score.documentation !== undefined || score.testCoverage !== undefined || score.codeComplexity !== undefined" class="space-y-4">
      <h4 class="text-sm font-semibold text-[#c9d1d9]">Breakdown</h4>
      
      <!-- Documentation -->
      <div v-if="score.documentation !== undefined" class="flex items-center justify-between">
        <span class="text-sm text-[#8b949e]">📝 Documentation</span>
        <div class="flex items-center space-x-3">
          <div class="w-32 bg-[#0d1117] rounded-full h-2 overflow-hidden border border-[#30363d]">
            <div 
              class="h-full transition-all rounded-full"
              :class="getScoreBgColor(score.documentation)"
              :style="{ width: `${score.documentation}%` }"
            ></div>
          </div>
          <span class="text-sm font-medium w-12 text-right" :class="getScoreColor(score.documentation)">{{ score.documentation }}</span>
        </div>
      </div>

      <!-- Test Coverage -->
      <div v-if="score.testCoverage !== undefined" class="flex items-center justify-between">
        <span class="text-sm text-[#8b949e]">🧪 Test Coverage</span>
        <div class="flex items-center space-x-3">
          <div class="w-32 bg-[#0d1117] rounded-full h-2 overflow-hidden border border-[#30363d]">
            <div 
              class="h-full transition-all rounded-full"
              :class="getScoreBgColor(score.testCoverage)"
              :style="{ width: `${score.testCoverage}%` }"
            ></div>
          </div>
          <span class="text-sm font-medium w-12 text-right" :class="getScoreColor(score.testCoverage)">{{ score.testCoverage }}</span>
        </div>
      </div>

      <!-- Code Complexity -->
      <div v-if="score.codeComplexity !== undefined" class="flex items-center justify-between">
        <span class="text-sm text-[#8b949e]">⚙️ Code Complexity</span>
        <div class="flex items-center space-x-3">
          <div class="w-32 bg-[#0d1117] rounded-full h-2 overflow-hidden border border-[#30363d]">
            <div 
              class="h-full transition-all rounded-full"
              :class="getScoreBgColor(score.codeComplexity)"
              :style="{ width: `${score.codeComplexity}%` }"
            ></div>
          </div>
          <span class="text-sm font-medium w-12 text-right" :class="getScoreColor(score.codeComplexity)">{{ score.codeComplexity }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MaintainabilityScore } from '../utils/aiResponseParser';

defineProps<{
  score: MaintainabilityScore | undefined;
}>();

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-[#3fb950]';
  if (score >= 60) return 'text-[#d29922]';
  if (score >= 40) return 'text-[#ff8800]';
  return 'text-[#f85149]';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-[#3fb950]';
  if (score >= 60) return 'bg-[#d29922]';
  if (score >= 40) return 'bg-[#ff8800]';
  return 'bg-[#f85149]';
}
</script>
