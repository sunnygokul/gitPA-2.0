<template>
  <div v-if="testCases && testCases.length > 0" class="bg-[#161b22] rounded-lg border border-[#30363d] p-6 mb-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center space-x-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#3fb950]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-lg font-semibold text-[#c9d1d9]">Generated Test Suite</h3>
        <span class="ml-auto text-sm text-[#8b949e]">{{ testCases.length }} test{{ testCases.length !== 1 ? 's' : '' }}</span>
      </div>
      
      <button 
        v-if="zipSpec"
        @click="downloadZip"
        class="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>Download ZIP</span>
      </button>
    </div>

    <!-- Test Cases -->
    <div class="space-y-4">
      <div v-for="(test, idx) in testCases" :key="idx" class="border border-[#30363d] rounded-lg overflow-hidden">
        <div class="bg-[#0d1117] px-4 py-3 flex items-center justify-between cursor-pointer" @click="toggleTest(idx)">
          <div class="flex items-center space-x-3">
            <span class="text-xs font-mono px-2 py-1 rounded bg-[#3fb9501a] text-[#3fb950]">Test {{ idx + 1 }}</span>
            <span class="text-sm font-medium text-[#c9d1d9]">{{ test.name }}</span>
          </div>
          <svg :class="['h-5 w-5 text-[#8b949e] transition-transform', expandedTests[idx] ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <div v-show="expandedTests[idx]" class="p-4 bg-[#0d1117]">
          <p v-if="test.description" class="text-sm text-[#8b949e] mb-3">{{ test.description }}</p>
          
          <div class="relative">
            <pre class="bg-[#161b22] rounded-lg p-4 overflow-x-auto text-sm border border-[#30363d]"><code class="text-[#c9d1d9]">{{ test.code }}</code></pre>
            <button 
              @click="copyCode(test.code, idx)"
              class="absolute top-2 right-2 p-2 bg-[#21262d] hover:bg-[#30363d] rounded text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
              :title="copiedIndex === idx ? 'Copied!' : 'Copy code'"
            >
              <svg v-if="copiedIndex !== idx" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <svg v-else class="h-4 w-4 text-[#3fb950]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ZIP Specification -->
    <div v-if="zipSpec && zipSpec.structure" class="mt-6 bg-[#0d1117] rounded-lg border border-[#30363d] p-4">
      <h4 class="text-sm font-semibold text-[#58a6ff] mb-3">📦 ZIP Package Structure</h4>
      <pre class="text-xs text-[#8b949e] font-mono whitespace-pre">{{ zipSpec.structure }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { TestCase, ZipSpecification } from '../utils/aiResponseParser';

defineProps<{
  testCases: TestCase[] | undefined;
  zipSpec: ZipSpecification | undefined;
}>();

const expandedTests = ref<Record<number, boolean>>({});
const copiedIndex = ref<number | null>(null);

function toggleTest(index: number) {
  expandedTests.value[index] = !expandedTests.value[index];
}

async function copyCode(code: string, index: number) {
  try {
    await navigator.clipboard.writeText(code);
    copiedIndex.value = index;
    setTimeout(() => {
      copiedIndex.value = null;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy code:', err);
  }
}

function downloadZip() {
  // TODO: Implement ZIP generation
  alert('ZIP download will be implemented in the next update. For now, you can copy individual test codes.');
}
</script>
