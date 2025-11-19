<template>
  <div class="min-h-screen bg-gray-950">
    <header class="bg-gradient-to-r from-gray-800 to-gray-900 p-6 shadow-xl border-b border-gray-700">
      <h1 class="text-3xl font-bold text-center bg-white bg-clip-text text-transparent">
        gitPA 2.0
      </h1>
    </header>

    <main class="container mx-auto p-6">
      <!-- Repository Input Section -->
      <div class="mb-8 max-w-3xl mx-auto">
        <div class="flex gap-3">
          <input
            v-model="repositoryUrl"
            type="text"
            placeholder="Enter GitHub repository URL (e.g., https://github.com/username/repo)"
            class="flex-1 px-5 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 transition-all placeholder-gray-500"
          />
          <button
            @click="scanRepository"
            :disabled="scanning"
            class="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            {{ scanning ? 'Scanning...' : 'Scan Repository' }}
          </button>
        </div>
        <p v-if="scanError" class="mt-3 text-red-400 text-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {{ scanError }}
        </p>
      </div>

      <!-- Main Content Area -->
      <div v-if="fileStructure.length > 0" class="flex gap-6 h-[calc(100vh-220px)]">
        <!-- File Structure Panel - Fixed Width -->
        <div class="flex-shrink-0 w-80 h-full overflow-hidden">
          <FileStructure :file-structure="fileStructure" />
        </div>
        
        <!-- Chat Interface Panel - Flexible Width -->
        <div class="flex-1 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gray-700 flex flex-col overflow-hidden">
          <!-- Chat Messages Container -->
          <div class="flex-1 p-6 overflow-y-auto custom-scrollbar" ref="messagesContainer">
            <!-- Repository Info Card -->
            <div v-if="repoStore.repoInfo" class="mb-6 animate-fade-in">
              <div class="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-6 border border-gray-600 shadow-xl">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
                      <path d="M9 18c-4.51 2-5-2-7-2"/>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-xl font-bold mb-2 text-white">{{ repoStore.repoInfo.name }}</h3>
                    <p class="text-gray-300 mb-2 text-sm leading-relaxed">{{ repoStore.repoInfo.description }}</p>
                    <p class="text-gray-400 mb-3 text-sm leading-relaxed">{{ repoStore.repoInfo.summary }}</p>
                    <a 
                      :href="repositoryUrl" 
                      target="_blank" 
                      class="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      <span>View on GitHub</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </a>
                  </div>
                </div>
                
                <!-- AI-Powered Actions -->
                <div class="mt-4 pt-4 border-t border-gray-600">
                  <p class="text-sm text-gray-400 mb-3 font-medium">🤖 AI-Powered Analysis:</p>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      @click="repoStore.runSecurityScan()"
                      :disabled="chatLoading"
                      class="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 rounded-lg text-sm text-red-300 transition-all disabled:opacity-50"
                    >
                      🔒 Security Scan
                    </button>
                    <button
                      @click="repoStore.runCodeReview()"
                      :disabled="chatLoading"
                      class="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-lg text-sm text-blue-300 transition-all disabled:opacity-50"
                    >
                      📊 Code Review
                    </button>
                    <button
                      @click="repoStore.generateTests()"
                      :disabled="chatLoading"
                      class="px-3 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 rounded-lg text-sm text-green-300 transition-all disabled:opacity-50"
                    >
                      🧪 Generate Tests
                    </button>
                    <button
                      @click="repoStore.suggestRefactoring()"
                      :disabled="chatLoading"
                      class="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded-lg text-sm text-purple-300 transition-all disabled:opacity-50"
                    >
                      🔧 Refactor Tips
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Chat Messages -->
            <div v-for="message in messages" :key="message.id" 
                 class="mb-4 animate-fade-in"
                 :class="message.role === 'user' ? 'flex justify-end' : 'flex justify-start'"
            >
              <div
                :class="[
                  'max-w-[85%] rounded-xl p-4 shadow-lg',
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                    : 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-100 border border-gray-600'
                ]"
              >
                <MarkdownRenderer v-if="message.role === 'assistant'" :content="message.content" />
                <div v-else class="whitespace-pre-wrap break-words">{{ message.content }}</div>
                <CodeBlock 
                  v-if="message.fileContent"
                  :content="message.fileContent.content"
                  :fileName="message.fileContent.fileName"
                  class="mt-4"
                />
              </div>
            </div>
            
            <!-- Loading Indicator -->
            <div v-if="chatLoading && messages.length > 0" class="flex justify-start mb-4 animate-fade-in">
              <div class="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-4 border border-gray-600 shadow-lg">
                <div class="flex space-x-2">
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce" style="animation-delay: 0.2s"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce" style="animation-delay: 0.4s"></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Query Input Area -->
          <div class="p-5 border-t border-gray-700 bg-gray-800/50 backdrop-blur">
            <form @submit.prevent="sendQuery" class="flex gap-3">
              <input
                v-model="query"
                type="text"
                placeholder="Ask a question about the repository..."
                class="flex-1 px-5 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 transition-all placeholder-gray-400"
                :disabled="chatLoading"
              />
              <button
                type="submit"
                class="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center gap-2"
                :disabled="chatLoading || !query.trim()"
              >
                <span>Send</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!scanning" class="flex flex-col items-center justify-center py-20 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-4 opacity-50">
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
          <path d="M9 18c-4.51 2-5-2-7-2"/>
        </svg>
        <p class="text-lg">Enter a GitHub repository URL to get started</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryStore } from './stores/repository';
import { useRepoStore } from './stores/repo';
import FileStructure from './components/FileStructure.vue';
import MarkdownRenderer from './components/MarkdownRenderer.vue';
import CodeBlock from './components/CodeBlock.vue';

// Repository store for file structure
const repositoryStore = useRepositoryStore();
const repositoryUrl = ref('');
const { fileStructure, loading: scanning, error: scanError } = storeToRefs(repositoryStore);

// Repo store for chat functionality
const repoStore = useRepoStore();
const query = ref('');
// removed `chatError` because it was declared but never read (TS6133)
const { messages, isLoading: chatLoading } = storeToRefs(repoStore);

const messagesContainer = ref<HTMLElement | null>(null);

// Scroll to bottom of messages when new messages are added
watch(messages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}, { deep: true });

// Scan repository
const scanRepository = async () => {
  if (repositoryUrl.value) {
    await repositoryStore.scanRepository(repositoryUrl.value);
    if (fileStructure.value.length > 0) {
      await repoStore.scanRepository(repositoryUrl.value);
    }
  }
};

// Send query to backend
const sendQuery = async () => {
  if (!query.value.trim() || chatLoading.value || !repoStore.url) return;
  
  const currentQuery = query.value;
  query.value = '';
  
  try {
    await repoStore.sendQuery(currentQuery);
  } catch (error) {
    console.error('Error sending query:', error);
  }
};
</script>

<style scoped>
/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 10px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #1f2937;
  border-radius: 5px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #4b5563, #374151);
  border-radius: 5px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #6b7280, #4b5563);
}

/* Fade-in animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

/* Bounce animation for loading dots */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}
</style>