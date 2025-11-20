<template>
  <div class="bg-[#0d1117] rounded-lg border-l-4 p-4" :class="borderColor">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center space-x-3 mb-2">
          <span class="text-xs font-mono px-2 py-1 rounded" :class="badgeClass">
            {{ issue.severity }}
          </span>
          <span class="text-sm font-medium text-[#c9d1d9]">{{ issue.file }}</span>
          <span v-if="issue.line" class="text-xs text-[#8b949e]">Line {{ issue.line }}</span>
        </div>

        <p class="text-sm text-[#c9d1d9] mb-3">{{ issue.description }}</p>

        <!-- Expandable details -->
        <button 
          v-if="hasDetails"
          @click="expanded = !expanded"
          class="text-xs text-[#58a6ff] hover:underline flex items-center space-x-1"
        >
          <span>{{ expanded ? 'Hide' : 'Show' }} details</span>
          <svg :class="['h-3 w-3 transition-transform', expanded ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div v-show="expanded" class="mt-3 space-y-3 text-sm">
          <!-- Attack Scenario -->
          <div v-if="issue.attackScenario" class="bg-[#161b22] rounded p-3 border border-[#30363d]">
            <h5 class="text-xs font-semibold text-[#f85149] mb-1">⚔️ Attack Scenario</h5>
            <p class="text-[#8b949e]">{{ issue.attackScenario }}</p>
          </div>

          <!-- Fix Recommendation -->
          <div v-if="issue.fixRecommendation" class="bg-[#161b22] rounded p-3 border border-[#30363d]">
            <h5 class="text-xs font-semibold text-[#3fb950] mb-1">✅ Fix Recommendation</h5>
            <p class="text-[#8b949e]">{{ issue.fixRecommendation }}</p>
          </div>

          <!-- Impact Scope -->
          <div v-if="issue.impactScope" class="bg-[#161b22] rounded p-3 border border-[#30363d]">
            <h5 class="text-xs font-semibold text-[#d29922] mb-1">🎯 Impact Scope</h5>
            <p class="text-[#8b949e]">{{ issue.impactScope }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { SecurityIssue } from '../utils/aiResponseParser';

const props = defineProps<{
  issue: SecurityIssue;
}>();

const expanded = ref(false);

const hasDetails = computed(() => 
  !!(props.issue.attackScenario || props.issue.fixRecommendation || props.issue.impactScope)
);

const borderColor = computed(() => {
  switch (props.issue.severity) {
    case 'CRITICAL': return 'border-[#f85149]';
    case 'HIGH': return 'border-[#ff8800]';
    case 'MEDIUM': return 'border-[#d29922]';
    case 'LOW': return 'border-[#3fb950]';
    default: return 'border-[#30363d]';
  }
});

const badgeClass = computed(() => {
  switch (props.issue.severity) {
    case 'CRITICAL': return 'bg-[#f851491a] text-[#f85149]';
    case 'HIGH': return 'bg-[#ff88001a] text-[#ff8800]';
    case 'MEDIUM': return 'bg-[#d299221a] text-[#d29922]';
    case 'LOW': return 'bg-[#3fb9501a] text-[#3fb950]';
    default: return 'bg-[#30363d] text-[#8b949e]';
  }
});
</script>
