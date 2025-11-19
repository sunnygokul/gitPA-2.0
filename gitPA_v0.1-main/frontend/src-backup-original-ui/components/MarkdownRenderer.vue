<script setup lang="ts">
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { computed } from 'vue';

const props = defineProps<{
  content: string;
}>();

// Configure marked to use highlight.js for code blocks
// `marked` allows a highlight function; typed here with any to satisfy TS checks
(marked as any).setOptions({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  highlight: (code: any, lang: any) => {
    if (lang && hljs.getLanguage(lang)) {
      // highlight returns a result object; use .value
      return (hljs.highlight(code, { language: lang }) as any).value;
    }
    return (hljs.highlightAuto(code) as any).value;
  },
});

const renderedContent = computed(() => marked(props.content));
</script>

<template>
  <div class="prose prose-sm max-w-none text-left dark:prose-invert" v-html="renderedContent"></div>
</template>

<style scoped>
:deep(pre) {
  @apply bg-gray-800 p-4 rounded-md overflow-x-auto text-left;
}

:deep(code) {
  @apply font-mono text-sm text-left text-white;
}

:deep(p) {
  @apply my-2 text-left;
}

:deep(ul) {
  @apply list-disc pl-6 my-2 text-left;
}

:deep(ol) {
  @apply list-decimal pl-6 my-2 text-left;
}

:deep(h1) {
  @apply text-2xl font-bold my-4 text-left;
}

:deep(h2) {
  @apply text-xl font-bold my-3 text-left;
}

:deep(h3) {
  @apply text-lg font-bold my-2 text-left;
}

:deep(blockquote) {
  @apply border-l-4 border-gray-600 pl-4 italic my-2 text-left;
}

:deep(a) {
  @apply text-blue-400 hover:text-blue-300 underline text-left;
}
</style> 