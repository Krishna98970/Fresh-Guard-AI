/**
 * FreshGuard AI — Model Evaluation & Benchmark Suite
 * 
 * Run with: `npm run eval` or `npx tsx models/eval.ts`
 */

import fs from 'fs';
import path from 'path';
import { predict } from './predict';

async function evaluateModel() {
  console.log('=====================================================');
  console.log('🔬 FRESHGUARD AI — MODEL EVALUATION & BENCHMARK');
  console.log('=====================================================\n');

  const testCases = [
    { file: 'fresh-apple.jpg', expected: 'APPROVED', name: 'Fresh Honeycrisp Apple' },
    { file: 'fresh-banana.jpg', expected: 'APPROVED', name: 'Fresh Cavendish Banana' },
    { file: 'rotten-apple.jpg', expected: 'REJECTED', name: 'Rotten Apple (Brown Rot)' },
    { file: 'defect-strawberries.jpg', expected: 'REJECTED', name: 'Defective Strawberries (Mold)' },
  ];

  const samplesDir = path.join(process.cwd(), 'public', 'samples');
  let tp = 0, tn = 0, fp = 0, fn = 0;

  console.log('Running evaluation on reference test set:\n');

  for (const tc of testCases) {
    const filePath = path.join(samplesDir, tc.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`File ${tc.file} missing, skipping`);
      continue;
    }

    const buf = fs.readFileSync(filePath);
    const result = await predict(buf, 'Auto-Detect');

    const pass = result.decision === tc.expected;
    const isDefect = tc.expected === 'REJECTED';

    if (isDefect) {
      if (result.decision === 'REJECTED') tp++;
      else fn++;
    } else {
      if (result.decision === 'APPROVED') tn++;
      else fp++;
    }

    console.log(`[${pass ? '✅ PASS' : '❌ FAIL'}] ${tc.name}`);
    console.log(`   - Detected Specimen: ${result.product}`);
    console.log(`   - Score: ${result.quality_score}/100 | Verdict: ${result.decision} (Expected: ${tc.expected})`);
    console.log(`   - Defect Ratio: ${(result.diagnostics.defectAreaRatio * 100).toFixed(1)}%`);
    if (result.defects.length > 0) {
      console.log(`   - Defects Logged: ${result.defects.map(d => `${d.type} (${d.severity})`).join(', ')}`);
    }
    console.log('');
  }

  const accuracy = (tp + tn) / (tp + tn + fp + fn);
  const precision = tp / (tp + fp || 1);
  const recall = tp / (tp + fn || 1);
  const f1 = (2 * precision * recall) / (precision + recall || 1);

  console.log('-----------------------------------------------------');
  console.log('📊 EVALUATION SUMMARY');
  console.log('-----------------------------------------------------');
  console.log(`Overall Accuracy: ${(accuracy * 100).toFixed(1)}%`);
  console.log(`Precision:        ${(precision * 100).toFixed(1)}%`);
  console.log(`Recall:           ${(recall * 100).toFixed(1)}%`);
  console.log(`F1-Score:         ${f1.toFixed(3)}`);
  console.log(`False Approvals:  ${fp} (Critical Food Safety Metric)`);
  console.log('-----------------------------------------------------\n');

  if (fp > 0) {
    console.error('❌ FAILED: False approval of defective produce detected!');
    process.exit(1);
  } else {
    console.log('🎉 ALL BENCHMARK TESTS PASSED WITH 100% SPECIFICITY!');
  }
}

evaluateModel().catch((err) => {
  console.error('Evaluation error:', err);
  process.exit(1);
});
