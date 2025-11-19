<template>
  <div class="file-item">
    <div
      :class="['item-header', { 'is-dir': item.type === 'dir' }]"
      :style="{ paddingLeft: `${depth * 12 + 8}px` }"
      @click="handleClick"
    >
      <!-- Expand/Collapse Arrow for directories -->
      <span v-if="item.type === 'dir'" class="icon arrow-icon">
        <svg v-if="item.expanded" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </span>
      <span v-else class="icon-spacer"></span>

      <!-- Folder/File Icon -->
      <span class="icon file-icon">
        <!-- Open Folder -->
        <svg v-if="item.type === 'dir' && item.expanded" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <!-- Closed Folder -->
        <svg v-else-if="item.type === 'dir'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
        </svg>
        <!-- Code File Icon -->
        <svg v-else-if="isCodeFile(item.name)" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
        <!-- Text File Icon -->
        <svg v-else-if="isTextFile(item.name)" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <line x1="10" y1="9" x2="8" y2="9"></line>
        </svg>
        <!-- Generic File Icon -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
      </span>

      <!-- File/Folder Name -->
      <span :class="['item-name', { 'is-dir': item.type === 'dir' }]">
        {{ item.name }}
      </span>
    </div>

    <!-- Children (recursive) -->
    <div v-if="item.type === 'dir' && item.expanded && item.children" class="children">
      <div 
        class="guide-line" 
        :style="{ left: `${depth * 12 + 16}px` }"
      ></div>
      <FileItem
        v-for="child in item.children"
        :key="child.path"
        :item="child"
        :depth="depth + 1"
        @toggle="$emit('toggle', $event)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

interface FileStructureItem {
  name: string;
  path: string;
  type: 'dir' | 'file';
  children?: FileStructureItem[];
  expanded?: boolean;
}

const props = defineProps({
  item: {
    type: Object as PropType<FileStructureItem>,
    required: true
  },
  depth: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['toggle']);

const handleClick = () => {
  if (props.item.type === 'dir') {
    emit('toggle', props.item);
  }
};

const isCodeFile = (filename: string): boolean => {
  const codeExtensions = ['vue', 'js', 'ts', 'jsx', 'tsx', 'css', 'scss', 'sass', 'html', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php'];
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? codeExtensions.includes(ext) : false;
};

const isTextFile = (filename: string): boolean => {
  const textExtensions = ['txt', 'md', 'json', 'xml', 'yaml', 'yml', 'toml'];
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? textExtensions.includes(ext) : false;
};
</script>

<style scoped>
.file-item {
  user-select: none;
  position: relative;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  transition: all 0.15s ease-in-out;
}

.item-header.is-dir {
  cursor: pointer;
}

.item-header.is-dir:hover {
  background-color: rgba(55, 65, 81, 0.6);
}

.item-header:not(.is-dir):hover {
  background-color: rgba(55, 65, 81, 0.4);
}

.icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.arrow-icon {
  color: #9ca3af;
  transition: transform 0.2s ease-in-out;
  width: 16px;
}

.icon-spacer {
  width: 16px;
}

.file-icon {
  color: #60a5fa;
  width: 16px;
}

.item-header:not(.is-dir) .file-icon {
  color: #9ca3af;
}

.item-header:hover .file-icon {
  color: #d1d5db;
}

.item-name {
  font-size: 0.875rem;
  color: #d1d5db;
  transition: color 0.15s ease-in-out;
}

.item-name.is-dir {
  font-weight: 600;
  color: #e5e7eb;
}

.item-header:hover .item-name {
  color: #ffffff;
}

.children {
  position: relative;
}

.guide-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(to bottom, #4b5563, transparent);
}
</style>