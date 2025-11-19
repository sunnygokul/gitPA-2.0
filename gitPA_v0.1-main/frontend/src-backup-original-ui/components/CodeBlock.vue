<template>
  <div class="code-block">
    <div class="header">
      <div class="file-info">
        <span class="file-icon">
          <!-- Code File Icon -->
          <svg v-if="isCodeFile" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
          <!-- Text File Icon -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        </span>
        <div class="file-details">
          <div class="file-name">{{ fileName }}</div>
          <div class="file-language">{{ language }}</div>
        </div>
      </div>
      <button 
        @click="copyToClipboard" 
        :class="['copy-button', { copied: copied }]"
      >
        <!-- Copy Icon -->
        <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <!-- Check Icon -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>{{ copied ? 'Copied!' : 'Copy' }}</span>
      </button>
    </div>
    
    <div class="code-container">
      <div class="gradient-line"></div>
      <pre class="code-content"><code>{{ content }}</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  content: string;
  fileName: string;
}>();

const copied = ref(false);

const language = computed(() => {
  const ext = props.fileName.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    'vue': 'Vue',
    'js': 'JavaScript',
    'ts': 'TypeScript',
    'jsx': 'React',
    'tsx': 'React TS',
    'json': 'JSON',
    'css': 'CSS',
    'scss': 'SCSS',
    'sass': 'Sass',
    'html': 'HTML',
    'py': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'c': 'C',
    'go': 'Go',
    'rs': 'Rust',
    'php': 'PHP',
    'md': 'Markdown',
    'txt': 'Text',
  };
  return langMap[ext || ''] || 'Code';
});

const isCodeFile = computed(() => {
  const codeExtensions = ['vue', 'js', 'ts', 'jsx', 'tsx', 'css', 'scss', 'sass', 'html', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php'];
  const ext = props.fileName.split('.').pop()?.toLowerCase();
  return ext ? codeExtensions.includes(ext) : false;
});

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(props.content);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};
</script>

<style scoped>
.code-block {
  background: linear-gradient(to bottom right, #1f2937, #111827);
  border: 1px solid rgba(75, 85, 99, 0.5);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
  margin: 24px 0;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(to right, #374151, #1f2937);
  padding: 12px 20px;
  border-bottom: 1px solid rgba(75, 85, 99, 0.5);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  display: flex;
  align-items: center;
  color: #60a5fa;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #e5e7eb;
}

.file-language {
  font-size: 0.75rem;
  color: #9ca3af;
}

.copy-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background-color: #4b5563;
  color: #e5e7eb;
}

.copy-button:hover {
  background-color: #6b7280;
  color: #ffffff;
  transform: translateY(-1px);
}

.copy-button:active {
  transform: scale(0.95);
}

.copy-button.copied {
  background-color: #059669;
  color: #ffffff;
}

.copy-button svg {
  flex-shrink: 0;
}

.code-container {
  position: relative;
  max-height: 500px;
  overflow: auto;
}

.gradient-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(96, 165, 250, 0.3), transparent);
}

.code-content {
  padding: 20px;
  margin: 0;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #e5e7eb;
  white-space: pre-wrap;
  word-break: break-word;
}

code {
  display: block;
}

/* Custom Scrollbar */
.code-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.code-container::-webkit-scrollbar-track {
  background: #1f2937;
  border-radius: 4px;
}

.code-container::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #4b5563, #374151);
  border-radius: 4px;
}

.code-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #6b7280, #4b5563);
}

/* Firefox Scrollbar */
.code-container {
  scrollbar-width: thin;
  scrollbar-color: #4b5563 #1f2937;
}
</style>