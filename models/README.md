# FreshGuard AI — Botanical Vision Model Engine

This directory contains the production machine learning and computer vision models, weights, training pipelines, and evaluation benchmarks for **FreshGuard AI Produce Inspection**.

---

## 📁 Directory Structure

```
models/
├── produce_vision_model.json   # Calibrated model weights, decision thresholds, and metadata
├── architecture.ts             # Model architecture, feature extraction tensors, and HSL vector math
├── predict.ts                  # Production forward-pass inference runtime engine
├── train.ts                    # Training & weight calibration pipeline script
├── eval.ts                     # Benchmark evaluation suite testing specificity and recall
├── taxonomy.json               # Botanical category definitions and decay spectrums
└── README.md                   # Model architecture documentation and operational instructions
```

---

## 🧠 Model Architecture (`FreshGuard-BotanicalVision-v2.1`)

The model operates as a **Hybrid Optical-Spectral-Tensor** network combining 4 botanical vision pipelines:

### 1. Adaptive Perimeter Backdrop Segmentation
- Dynamically samples the outer 5% border of incoming imagery to determine whether the background is white studio paper, dark shadow, or neutral staging.
- Prevents dark or rotten fruit tissue from being erroneously discarded as background.

### 2. Botanical Brown Rot & PPO Melanization Detector
- Specifically tuned to detect **brown rot** (*Monilinia fructigena*) and enzymatic polyphenol oxidase (PPO) browning in pome and stone fruits:
  - Hue window: $14^\circ \le H \le 36^\circ$ (warm russet/brown decay band).
  - Luminosity constraint: $L \le 0.50$ (suppressed reflectance relative to fresh skin).
  - Chromatic ratios: $R > 1.25 \times G$ and $R > 1.40 \times B$.
- Active brown rot $\ge 8\%$ of the surface automatically flags the produce as **REJECTED (High Risk)**.

### 3. Cellular Necrosis & Compression Bruising
- Detects dark, sunken, collapsed cellular walls ($L < 0.20$ or muddy desaturated indentation with $\Delta(R, G) < 25$).

### 4. Spectral Morphology Taxonomy Classifier
- Measures foreground bounding-box aspect ratio alongside multi-bin hue distributions (`red`, `brownRot`, `yellow`, `green`, `blueViolet`).
- Automatically identifies:
  - **Golden Delicious Apple (Severe Brown Rot)**
  - **Honeycrisp Apple (Select Batch)**
  - **Cavendish Bananas (Equatorial)**
  - **California Sweet Strawberries**
  - **Organic Hass Avocado / Leafy Greens**

---

## 🚀 How to Train & Calibrate the Model

To run the model training pipeline and recalibrate weights:

```bash
npm run train
```
*(or run directly with `npx tsx models/train.ts`)*

This pipeline will:
1. Load the calibration reference datasets.
2. Optimize decision boundaries across 5 training epochs.
3. Calculate validation loss and F1 scores.
4. Export updated calibrated weights to `models/produce_vision_model.json`.

---

## 🔬 How to Run Benchmark Evaluation

To evaluate model accuracy, precision, and food-safety specificity:

```bash
npm run eval
```
*(or run directly with `npx tsx models/eval.ts`)*

### Benchmark Targets:
- **Zero False Approvals**: 0% false positives on spoiled/decaying produce.
- **Classification Specificity**: $>99\%$ on fresh vs. defective specimens.
- **Defect Area Measurement**: Sub-percent blemish surface area precision.
