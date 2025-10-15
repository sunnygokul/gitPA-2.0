<template>
  <div class="file-structure">
    <div class="header">
      <svg class="folder-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
      </svg>
      <h3>File Explorer</h3>
    </div>
    <div class="content">
      <div v-for="item in fileStructure" :key="item.path" class="item-wrapper">
        <FileItem :item="item" :depth="0" @toggle="toggleExpand" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import FileItem from './FileItem.vue';

interface FileStructureItem {
  name: string;
  path: string;
  type: 'dir' | 'file';
  children?: FileStructureItem[];
  expanded?: boolean;
}

defineProps({
  fileStructure: {
    type: Array as PropType<FileStructureItem[]>,
    required: true,
    default: () => []
  }
});

const toggleExpand = (item: FileStructureItem) => {
  if (item.type === 'dir') {
    item.expanded = !item.expanded;
  }
};
</script>

<style scoped>
.file-structure {
  background: linear-gradient(to bottom right, #1f2937, #111827);
  border: 1px solid rgba(75, 85, 99, 0.5);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(75, 85, 99, 0.5);
  flex-shrink: 0;
}

.folder-icon {
  color: #60a5fa;
  flex-shrink: 0;
}

.header h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #e5e7eb;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 8px;
}

.content::-webkit-scrollbar {
  width: 8px;
}

.content::-webkit-scrollbar-track {
  background: #1f2937;
  border-radius: 4px;
}

.content::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #4b5563, #374151);
  border-radius: 4px;
}

.content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #6b7280, #4b5563);
}

.item-wrapper {
  margin-bottom: 2px;
}
</style>