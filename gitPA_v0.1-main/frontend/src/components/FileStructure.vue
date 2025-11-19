<template>
  <div class="file-structure">
    <div v-for="item in fileStructure" :key="item.path" class="item-wrapper">
      <FileItem :item="item" :depth="0" @toggle="toggleExpand" />
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
  padding: 8px;
}

.item-wrapper {
  margin-bottom: 1px;
}
</style>