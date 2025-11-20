<template>
  <div v-if="hasContent" class="bg-[#161b22] rounded-lg border border-[#30363d] p-6 mb-6">
    <div class="flex items-center space-x-3 mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#a371f7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <h3 class="text-lg font-semibold text-[#c9d1d9]">Additional Analysis</h3>
    </div>

    <!-- Tabs -->
    <div class="flex space-x-1 mb-4 border-b border-[#30363d]">
      <button 
        v-if="architecture"
        @click="activeTab = 'architecture'"
        :class="['px-4 py-2 text-sm font-medium transition-colors', 
                 activeTab === 'architecture' 
                   ? 'text-[#58a6ff] border-b-2 border-[#58a6ff]' 
                   : 'text-[#8b949e] hover:text-[#c9d1d9]']"
      >
        🏗️ Architecture
      </button>
      <button 
        v-if="dependencies"
        @click="activeTab = 'dependencies'"
        :class="['px-4 py-2 text-sm font-medium transition-colors', 
                 activeTab === 'dependencies' 
                   ? 'text-[#58a6ff] border-b-2 border-[#58a6ff]' 
                   : 'text-[#8b949e] hover:text-[#c9d1d9]']"
      >
        📦 Dependencies
      </button>
      <button 
        v-if="performance"
        @click="activeTab = 'performance'"
        :class="['px-4 py-2 text-sm font-medium transition-colors', 
                 activeTab === 'performance' 
                   ? 'text-[#58a6ff] border-b-2 border-[#58a6ff]' 
                   : 'text-[#8b949e] hover:text-[#c9d1d9]']"
      >
        ⚡ Performance
      </button>
    </div>

    <!-- Content -->
    <div class="prose prose-invert max-w-none">
      <!-- Architecture Assessment -->
      <div v-if="activeTab === 'architecture' && architecture" class="text-sm text-[#c9d1d9] whitespace-pre-wrap">
        {{ architecture }}
      </div>

      <!-- Dependency Risk Analysis -->
      <div v-if="activeTab === 'dependencies' && dependencies" class="text-sm text-[#c9d1d9] whitespace-pre-wrap">
        {{ dependencies }}
      </div>

      <!-- Performance Concerns -->
      <div v-if="activeTab === 'performance' && performance" class="text-sm text-[#c9d1d9] whitespace-pre-wrap">
        {{ performance }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  architecture: string | undefined;
  dependencies: string | undefined;
  performance: string | undefined;
}>();

const activeTab = ref<'architecture' | 'dependencies' | 'performance'>('architecture');

const hasContent = computed(() => {
  return props.architecture || props.dependencies || props.performance;
});

// Set initial active tab to first available content
watch(() => [props.architecture, props.dependencies, props.performance], () => {
  if (props.architecture) {
    activeTab.value = 'architecture';
  } else if (props.dependencies) {
    activeTab.value = 'dependencies';
  } else if (props.performance) {
    activeTab.value = 'performance';
  }
}, { immediate: true });
</script>
