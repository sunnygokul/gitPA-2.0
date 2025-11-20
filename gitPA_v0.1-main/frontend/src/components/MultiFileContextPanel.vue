<template>
  <div v-if="context" class="bg-[#161b22] rounded-lg border border-[#30363d] p-6 mb-6">
    <div class="flex items-center justify-between mb-4 cursor-pointer" @click="expanded = !expanded">
      <div class="flex items-center space-x-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#58a6ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="text-lg font-semibold text-[#c9d1d9]">Multi-file Context Reasoning</h3>
      </div>
      <svg :class="['h-5 w-5 text-[#8b949e] transition-transform', expanded ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    <div v-show="expanded" class="space-y-4">
      <!-- Summary -->
      <div v-if="context.summary.length > 0" class="space-y-2">
        <h4 class="text-sm font-medium text-[#58a6ff]">📁 Relevant Files & Relationships</h4>
        <ul class="space-y-1">
          <li v-for="(item, idx) in context.summary" :key="idx" class="text-sm text-[#8b949e] pl-4 border-l-2 border-[#30363d]">
            {{ item }}
          </li>
        </ul>
      </div>

      <!-- Dependencies -->
      <div v-if="context.dependencies.length > 0" class="space-y-2">
        <h4 class="text-sm font-medium text-[#58a6ff]">🔗 Dependencies Involved</h4>
        <ul class="space-y-1">
          <li v-for="(item, idx) in context.dependencies" :key="idx" class="text-sm text-[#8b949e] pl-4 border-l-2 border-[#30363d]">
            {{ item }}
          </li>
        </ul>
      </div>

      <!-- Cross-file Considerations -->
      <div v-if="context.crossFile.length > 0" class="space-y-2">
        <h4 class="text-sm font-medium text-[#58a6ff]">⚡ Cross-file Considerations</h4>
        <ul class="space-y-1">
          <li v-for="(item, idx) in context.crossFile" :key="idx" class="text-sm text-[#8b949e] pl-4 border-l-2 border-[#30363d]">
            {{ item }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { MultiFileContext } from '../utils/aiResponseParser';

defineProps<{
  context: MultiFileContext | undefined;
}>();

const expanded = ref(true);
</script>
