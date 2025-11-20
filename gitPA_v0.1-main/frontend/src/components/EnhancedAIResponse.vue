<template>
  <div>
    <!-- Structured Content Display -->
    <div v-if="parsed.hasStructuredContent" class="space-y-6">
      <MultiFileContextPanel 
        v-if="parsed.multiFileContext" 
        :context="parsed.multiFileContext" 
      />
      
      <SecurityIssuesPanel 
        v-if="parsed.securityIssues && parsed.securityIssues.length > 0" 
        :issues="parsed.securityIssues" 
      />
      
      <RefactorSuggestionsPanel 
        v-if="parsed.refactorSuggestions && parsed.refactorSuggestions.length > 0" 
        :suggestions="parsed.refactorSuggestions" 
      />
      
      <TestSuitePanel 
        v-if="parsed.testCases && parsed.testCases.length > 0" 
        :testCases="parsed.testCases" 
        :zipSpec="parsed.zipSpecification"
      />
      
      <MaintainabilityScorePanel 
        v-if="parsed.maintainabilityScore" 
        :score="parsed.maintainabilityScore" 
      />
      
      <AnalysisPanel 
        v-if="parsed.architectureAssessment || parsed.dependencyRiskAnalysis || parsed.performanceConcerns"
        :architecture="parsed.architectureAssessment"
        :dependencies="parsed.dependencyRiskAnalysis"
        :performance="parsed.performanceConcerns"
      />
      
      <!-- Additional unstructured content -->
      <div v-if="parsed.additionalContent" class="bg-[#161b22] rounded-lg border border-[#30363d] p-6">
        <MarkdownRenderer :content="parsed.additionalContent" />
      </div>
    </div>

    <!-- Fallback to raw markdown -->
    <div v-else class="bg-[#161b22] rounded-lg border border-[#30363d] p-6">
      <MarkdownRenderer :content="parsed.rawContent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { parseAIResponse } from '../utils/aiResponseParser';
import MultiFileContextPanel from './MultiFileContextPanel.vue';
import SecurityIssuesPanel from './SecurityIssuesPanel.vue';
import RefactorSuggestionsPanel from './RefactorSuggestionsPanel.vue';
import TestSuitePanel from './TestSuitePanel.vue';
import MaintainabilityScorePanel from './MaintainabilityScorePanel.vue';
import AnalysisPanel from './AnalysisPanel.vue';
import MarkdownRenderer from './MarkdownRenderer.vue';

const props = defineProps<{
  content: string;
}>();

const parsed = computed(() => parseAIResponse(props.content));
</script>
