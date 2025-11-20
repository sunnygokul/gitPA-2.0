<template>
  <div v-if="issues && issues.length > 0" class="bg-[#161b22] rounded-lg border border-[#30363d] p-6 mb-6">
    <div class="flex items-center space-x-3 mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#f85149]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h3 class="text-lg font-semibold text-[#c9d1d9]">Security & Code Review</h3>
      <span class="ml-auto text-sm text-[#8b949e]">{{ issues.length }} issue{{ issues.length !== 1 ? 's' : '' }} found</span>
    </div>

    <!-- Issues grouped by severity -->
    <div class="space-y-4">
      <!-- Critical Issues -->
      <div v-if="criticalIssues.length > 0">
        <h4 class="text-sm font-bold text-[#f85149] mb-3 flex items-center space-x-2">
          <span class="px-2 py-1 rounded text-xs bg-[#f851491a]">🔴 CRITICAL</span>
          <span>({{ criticalIssues.length }})</span>
        </h4>
        <div class="space-y-3">
          <SecurityIssueCard v-for="(issue, idx) in criticalIssues" :key="idx" :issue="issue" />
        </div>
      </div>

      <!-- High Issues -->
      <div v-if="highIssues.length > 0">
        <h4 class="text-sm font-bold text-[#ff8800] mb-3 flex items-center space-x-2">
          <span class="px-2 py-1 rounded text-xs bg-[#ff88001a]">🟠 HIGH</span>
          <span>({{ highIssues.length }})</span>
        </h4>
        <div class="space-y-3">
          <SecurityIssueCard v-for="(issue, idx) in highIssues" :key="idx" :issue="issue" />
        </div>
      </div>

      <!-- Medium Issues -->
      <div v-if="mediumIssues.length > 0">
        <h4 class="text-sm font-bold text-[#d29922] mb-3 flex items-center space-x-2">
          <span class="px-2 py-1 rounded text-xs bg-[#d299221a]">🟡 MEDIUM</span>
          <span>({{ mediumIssues.length }})</span>
        </h4>
        <div class="space-y-3">
          <SecurityIssueCard v-for="(issue, idx) in mediumIssues" :key="idx" :issue="issue" />
        </div>
      </div>

      <!-- Low Issues -->
      <div v-if="lowIssues.length > 0">
        <h4 class="text-sm font-bold text-[#3fb950] mb-3 flex items-center space-x-2">
          <span class="px-2 py-1 rounded text-xs bg-[#3fb9501a]">🟢 LOW</span>
          <span>({{ lowIssues.length }})</span>
        </h4>
        <div class="space-y-3">
          <SecurityIssueCard v-for="(issue, idx) in lowIssues" :key="idx" :issue="issue" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SecurityIssue } from '../utils/aiResponseParser';
import SecurityIssueCard from './SecurityIssueCard.vue';

const props = defineProps<{
  issues: SecurityIssue[] | undefined;
}>();

const criticalIssues = computed(() => props.issues?.filter(i => i.severity === 'CRITICAL') || []);
const highIssues = computed(() => props.issues?.filter(i => i.severity === 'HIGH') || []);
const mediumIssues = computed(() => props.issues?.filter(i => i.severity === 'MEDIUM') || []);
const lowIssues = computed(() => props.issues?.filter(i => i.severity === 'LOW') || []);
</script>
