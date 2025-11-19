import express from 'express';
import { z } from 'zod';
import { fileStore } from '../services/fileStore';
import { buildRepositoryGraph, detectCircularDependencies } from '../services/graph';
import { analyzeFile } from '../services/ast';
import { detectSmells } from '../services/refactorEngine';
import { scanFileContent, crossFileTaintAnalysis } from '../services/security';
import { generateJestTests } from '../services/tests';

const router = express.Router();

const repoSchema = z.object({
  // Assumes repository has been scanned and files are in fileStore
});

router.get('/graph', (_req, res) => {
  const files = fileStore.getAllFiles().map(f => ({ path: f.path, content: f.content }));
  const graph = buildRepositoryGraph(files);
  const circular = detectCircularDependencies(graph);
  res.json({ status: 'success', nodes: graph.nodes.length, edges: graph.edges.length, cycles: circular, graph });
});

router.get('/analysis', (_req, res) => {
  const files = fileStore.getAllFiles().map(f => ({ path: f.path, content: f.content }));
  const analyses = files.map(f => analyzeFile(f.path, f.content));
  const smells = detectSmells(analyses);
  res.json({ status: 'success', filesAnalyzed: files.length, smells });
});

router.get('/security', (_req, res) => {
  const files = fileStore.getAllFiles().map(f => ({ path: f.path, content: f.content }));
  const perFile = files.flatMap(f => scanFileContent(f.path, f.content));
  const analyses = files.map(f => analyzeFile(f.path, f.content));
  const cross = crossFileTaintAnalysis(analyses, files);
  const issues = [...perFile, ...cross];
  const stats = {
    total: issues.length,
    critical: issues.filter(i => i.severity === 'CRITICAL').length,
    high: issues.filter(i => i.severity === 'HIGH').length,
    medium: issues.filter(i => i.severity === 'MEDIUM').length,
    low: issues.filter(i => i.severity === 'LOW').length,
  };
  res.json({ status: 'success', stats, issues });
});

router.get('/refactor', (_req, res) => {
  const files = fileStore.getAllFiles().map(f => ({ path: f.path, content: f.content }));
  const analyses = files.map(f => analyzeFile(f.path, f.content));
  const smells = detectSmells(analyses);
  res.json({ status: 'success', suggestions: smells, filesAnalyzed: files.length });
});

router.get('/tests', (_req, res) => {
  const files = fileStore.getAllFiles().map(f => ({ path: f.path, content: f.content }));
  const analyses = files.map(f => analyzeFile(f.path, f.content));
  const tests = generateJestTests(analyses);
  res.json({ status: 'success', total: tests.length, tests });
});

export const advancedRoutes = router;
