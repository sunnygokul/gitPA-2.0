<template>
  <div class="min-h-screen bg-[#0d1117]">
    <!-- Top Navigation Bar -->
    <nav class="bg-[#161b22] border-b border-[#30363d] shadow-sm sticky top-0 z-50">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-[#238636] rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold text-[#c9d1d9]">GitPA 2.0</h1>
              <p class="text-xs text-[#8b949e]">AI-Powered Repository Analysis</p>
            </div>
          </div>
          
          <!-- Stats Display (when repo is scanned) -->
          <div v-if="fileStructure.length > 0" class="hidden md:flex items-center space-x-6 text-sm">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 rounded-full bg-[#3fb950]"></div>
              <span class="text-[#8b949e]">Connected</span>
            </div>
            <div class="text-[#30363d]">|</div>
            <div class="text-[#8b949e]">
              <span class="font-semibold text-[#c9d1d9]">{{ fileStructure.length }}</span> items scanned
            </div>
          </div>
        </div>
      </div>
    </nav>

    <main class="container mx-auto px-6 py-8">
      <!-- Repository Input Section -->
      <div class="mb-8 max-w-4xl mx-auto">
        <div class="bg-[#161b22] rounded-xl shadow-sm border border-[#30363d] p-6">
          <label class="block text-sm font-semibold text-[#c9d1d9] mb-3">Repository URL</label>
          <div class="flex gap-3">
            <div class="flex-1 relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#8b949e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <input
                v-model="repositoryUrl"
                type="text"
                placeholder="https://github.com/username/repository"
                class="w-full pl-12 pr-4 py-3 bg-[#0d1117] text-[#c9d1d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f6feb] border border-[#30363d] transition-all placeholder-[#8b949e]"
              />
            </div>
            <button
              @click="scanRepository"
              :disabled="scanning"
              class="px-6 py-3 bg-[#238636] text-white rounded-lg hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-sm hover:shadow-md flex items-center space-x-2"
            >
              <svg v-if="!scanning" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{{ scanning ? 'Analyzing...' : 'Analyze' }}</span>
            </button>
          </div>
          <p v-if="scanError" class="mt-3 text-[#f85149] text-sm flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ scanError }}</span>
          </p>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div v-if="fileStructure.length > 0" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left Sidebar - File Structure -->
        <div class="lg:col-span-3">
          <div class="bg-[#161b22] rounded-xl shadow-sm border border-[#30363d] overflow-hidden sticky top-24">
            <div class="bg-[#0d1117] px-5 py-4 border-b border-[#30363d]">
              <h2 class="font-semibold text-[#c9d1d9] flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#8b949e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span>File Structure</span>
              </h2>
            </div>
            <div class="max-h-[calc(100vh-200px)] overflow-y-auto">
              <FileStructure :file-structure="fileStructure" />
            </div>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="lg:col-span-9 space-y-6">
          <!-- Repository Info Card -->
          <div v-if="repoStore.repoInfo" class="bg-[#161b22] rounded-xl shadow-sm border border-[#30363d] overflow-hidden">
            <div class="p-6">
              <div class="flex items-start space-x-4">
                <div class="flex-shrink-0">
                  <div class="w-16 h-16 bg-[#21262d] rounded-xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-[#58a6ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <h2 class="text-2xl font-bold text-[#c9d1d9] mb-2">{{ repoStore.repoInfo.name }}</h2>
                  <p class="text-[#8b949e] mb-3 leading-relaxed">{{ repoStore.repoInfo.description }}</p>
                  <p class="text-sm text-[#8b949e] mb-4">{{ repoStore.repoInfo.summary }}</p>
                  <a 
                    :href="repositoryUrl" 
                    target="_blank" 
                    class="inline-flex items-center space-x-2 text-[#58a6ff] hover:text-[#79c0ff] text-sm font-medium transition-colors"
                  >
                    <span>View Repository</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            
            <!-- AI Actions Grid -->
            <div class="bg-[#0d1117] px-6 py-5 border-t border-[#30363d]">
              <h3 class="text-sm font-semibold text-[#c9d1d9] mb-4 flex items-center space-x-2">
                <span class="text-[#58a6ff]">⚡</span>
                <span>AI-Powered Analysis Tools</span>
              </h3>
              <div class="grid grid-cols-2 gap-3">
                <button
                  @click="repoStore.runSecurityScan()"
                  :disabled="chatLoading"
                  class="group px-4 py-3 bg-[#21262d] hover:bg-[#30363d] border-2 border-[#30363d] hover:border-[#f85149] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-[#1c2128] rounded-lg flex items-center justify-center group-hover:bg-[#2d1517] transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#f85149]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div class="text-left flex-1">
                      <div class="font-semibold text-[#c9d1d9] text-sm">Security Scan</div>
                      <div class="text-xs text-[#8b949e]">Find vulnerabilities</div>
                    </div>
                  </div>
                </button>

                <button
                  @click="repoStore.runCodeReview()"
                  :disabled="chatLoading"
                  class="group px-4 py-3 bg-[#21262d] hover:bg-[#30363d] border-2 border-[#30363d] hover:border-[#58a6ff] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-[#1c2128] rounded-lg flex items-center justify-center group-hover:bg-[#0c2d6b] transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#58a6ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div class="text-left flex-1">
                      <div class="font-semibold text-[#c9d1d9] text-sm">Code Review</div>
                      <div class="text-xs text-[#8b949e]">Quality analysis</div>
                    </div>
                  </div>
                </button>

                <button
                  @click="repoStore.generateTests()"
                  :disabled="chatLoading"
                  class="group px-4 py-3 bg-[#21262d] hover:bg-[#30363d] border-2 border-[#30363d] hover:border-[#3fb950] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-[#1c2128] rounded-lg flex items-center justify-center group-hover:bg-[#0f2e1c] transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#3fb950]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div class="text-left flex-1">
                      <div class="font-semibold text-[#c9d1d9] text-sm">Generate Tests</div>
                      <div class="text-xs text-[#8b949e]">Auto test creation</div>
                    </div>
                  </div>
                </button>

                <button
                  @click="repoStore.suggestRefactoring()"
                  :disabled="chatLoading"
                  class="group px-4 py-3 bg-[#21262d] hover:bg-[#30363d] border-2 border-[#30363d] hover:border-[#a371f7] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-[#1c2128] rounded-lg flex items-center justify-center group-hover:bg-[#271741] transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#a371f7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                      </svg>
                    </div>
                    <div class="text-left flex-1">
                      <div class="font-semibold text-[#c9d1d9] text-sm">Refactor Tips</div>
                      <div class="text-xs text-[#8b949e]">Code improvements</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Chat Interface Card -->
          <div class="bg-[#161b22] rounded-xl shadow-sm border border-[#30363d] overflow-hidden">
            <div class="bg-[#0d1117] px-5 py-4 border-b border-[#30363d]">
              <h2 class="font-semibold text-[#c9d1d9] flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#8b949e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>AI Assistant</span>
              </h2>
            </div>

            <!-- Messages Container -->
            <div class="h-[500px] overflow-y-auto p-6 space-y-4 bg-[#0d1117]" ref="messagesContainer">
              <!-- Welcome Message -->
              <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full text-center">
                <div class="w-16 h-16 bg-[#21262d] rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-[#58a6ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 class="text-lg font-semibold text-[#c9d1d9] mb-2">Ask me anything</h3>
                <p class="text-sm text-[#8b949e] max-w-md">I can help you understand the code, explain functions, find bugs, and suggest improvements.</p>
              </div>

              <!-- Chat Messages -->
              <div v-for="message in messages" :key="message.id" 
                   :class="message.role === 'user' ? 'flex justify-end' : 'flex justify-start'"
              >
                <div
                  :class="[
                    'max-w-[85%] rounded-xl shadow-sm',
                    message.role === 'user'
                      ? 'bg-[#1f6feb] text-white px-5 py-3'
                      : ''
                  ]"
                >
                  <EnhancedAIResponse v-if="message.role === 'assistant'" :content="message.content" />
                  <div v-else class="whitespace-pre-wrap break-words font-medium">{{ message.content }}</div>
                  <CodeBlock 
                    v-if="message.fileContent"
                    :content="message.fileContent.content"
                    :fileName="message.fileContent.fileName"
                    class="mt-4"
                  />
                </div>
              </div>
              
              <!-- Loading Indicator -->
              <div v-if="chatLoading && messages.length > 0" class="flex justify-start">
                <div class="bg-[#161b22] border border-[#30363d] rounded-xl px-5 py-4 shadow-sm">
                  <div class="flex space-x-2">
                    <div class="w-2 h-2 rounded-full bg-[#58a6ff] animate-bounce"></div>
                    <div class="w-2 h-2 rounded-full bg-[#58a6ff] animate-bounce" style="animation-delay: 0.2s"></div>
                    <div class="w-2 h-2 rounded-full bg-[#58a6ff] animate-bounce" style="animation-delay: 0.4s"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Input Area -->
            <div class="p-5 bg-[#161b22] border-t border-[#30363d]">
              <form @submit.prevent="sendQuery" class="flex space-x-3">
                <input
                  v-model="query"
                  type="text"
                  placeholder="Type your question here..."
                  class="flex-1 px-4 py-3 bg-[#0d1117] text-[#c9d1d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f6feb] border border-[#30363d] transition-all placeholder-[#8b949e]"
                  :disabled="chatLoading"
                />
                <button
                  type="submit"
                  class="px-6 py-3 bg-[#238636] text-white rounded-lg hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-sm hover:shadow-md flex items-center space-x-2"
                  :disabled="chatLoading || !query.trim()"
                >
                  <span>Send</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!scanning" class="flex flex-col items-center justify-center py-20">
        <div class="w-24 h-24 bg-[#21262d] rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-[#8b949e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-[#c9d1d9] mb-2">Start Analyzing</h2>
        <p class="text-[#8b949e] text-center max-w-md">Enter a GitHub repository URL above to begin AI-powered code analysis</p>
      </div>
    </main>

    <!-- Footer -->
    <footer class="mt-16 py-8 border-t border-[#30363d] bg-[#161b22]">
      <div class="container mx-auto px-6 text-center">
        <p class="text-sm text-[#8b949e]">Powered by AI • Built with Vue 3 & Tailwind CSS</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryStore } from './stores/repository';
import { useRepoStore } from './stores/repo';
import FileStructure from './components/FileStructure.vue';
import MarkdownRenderer from './components/MarkdownRenderer.vue';
import EnhancedAIResponse from './components/EnhancedAIResponse.vue';
import CodeBlock from './components/CodeBlock.vue';

// Repository store for file structure
const repositoryStore = useRepositoryStore();
const repositoryUrl = ref('');
const { fileStructure, loading: scanning, error: scanError } = storeToRefs(repositoryStore);

// Repo store for chat functionality
const repoStore = useRepoStore();
const query = ref('');
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
/* Smooth scrolling */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #30363d #0d1117;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #0d1117;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #30363d;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #484f58;
}

/* Loading animation */
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

/* Spin animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
