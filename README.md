<div align="center">

  <h1>
    Input-Envelope-Output: Auditable Generative Music Rewards in Sensory-Sensitive Contexts
  </h1>
  <div>
    <img src="assets/CHIicon.png" alt="CHI 2026 logo" style="height: 80px;">
    <h2 style="margin-top: 10px;">CHI 2026 Poster Track, Barcelona</h2>
  </div>

  <p><em>Generative feedback in sensory-sensitive contexts poses a core design challenge: large individual differences in sensory tolerance make it difficult to sustain engagement without compromising safety.</em></p>

  <p>If you find this project useful, please give us a star 🌟.</p>

 <p>
  <a href="https://arxiv.org/abs/2602.22813">
    <img src="https://img.shields.io/badge/Arxiv-Paper-red?logo=arxiv">
  </a>
  <a href="https://doi.org/10.48550/arXiv.2602.22813">
    <img src="https://img.shields.io/badge/DOI-View-blue?logo=doi">
  </a>
  <a href="https://doi.org/10.1145/3772363.3798580">
    <img src="https://img.shields.io/badge/Related-DOI-green">
  </a>
  <a href="https://musi-bubble-tokyo2020-media-pipe-pi.vercel.app/">
    <img src="https://img.shields.io/badge/Prototype-Demo-orange?logo=googlechrome&logoColor=FFCD00">
  </a>
  <a href="https://srpo.pages.dev/">
    <img src="https://img.shields.io/badge/Project-Page-orange?logo=googlechrome&logoColor=FFCD00">
  </a>
</p>

  <p>
    Cong Ye<sup>1†*</sup>,
    Songlin Shang<sup>1†</sup>,
    Xiaoxu Ma<sup>2</sup>,
    Xiangbo Zhang<sup>3</sup>
  </p>

  <p>
    <sup>1</sup>
    <img src="assets/wkuicon.png" height="25px" style="vertical-align: middle; margin-right: 24px;">
    <sup>1</sup>
    <img src="assets/umnicon.png" height="25px" style="vertical-align: middle;">
    <sup>2</sup>
    <img src="assets/GTicon.png" height="25px" style="vertical-align: middle;">
    <sup>3</sup>
    <img src="assets/GTicon.png" height="25px" style="vertical-align: middle;">
  </p>

  <p>
    <sup>1</sup>Wenzhou-Kean University,
    <sup>1</sup>University of Minnesota,
    <sup>2</sup>Georgia Institute of Technology (ECE),
    <sup>3</sup>Georgia Institute of Technology (Math)
  </p>

  <p><sup>†</sup>Equal Contribution, <sup>*</sup>Corresponding Author (<a href="mailto:1306248@wku.edu.cn">1306248@wku.edu.cn</a>)</p>
</div>

## Abstract
Generative feedback in sensory-sensitive contexts poses a core design challenge: large individual differences in sensory tolerance make it difficult to sustain engagement without compromising safety. This tension is exemplified in autism spectrum disorder (ASD), where auditory sensitivities are common yet highly heterogeneous. Existing interactive music systems typically encode safety implicitly within direct input-output (I-O) mappings, which can preserve novelty but make system behavior hard to predict or audit. We instead propose a constraint-first Input-Envelope-Output (I-E-O) framework that makes safety explicit and verifiable while preserving action-output causality. I-E-O introduces a low-risk envelope layer between user input and audio output to specify safe bounds, enforce them deterministically, and log interventions for audit. From this architecture, we derive four verifiable design principles and instantiate them in MusiBubbles, a web-based prototype. Contributions include the I-E-O architecture, MusiBubbles as an exemplar implementation, and a reproducibility package to support adoption in ASD and other sensory-sensitive domains.

## MusiBubbles Prototype

MusiBubbles is an auditable music reward prototype designed for sensory-sensitive scenarios (e.g., ASD). It employs the Input–Envelope–Output (I–E–O) constraint-first framework.

### Design Principles

- **Predictability First**: Output variations are bounded by declared constraints; identical inputs yield stable results.
- **Pattern-Level Mapping**: Rewards correlate with behavioral patterns (rhythm density, sequentiality) rather than per-hit sonification that amplifies noise.
- **Low-Risk Envelope**: Overload dimensions (BPM, gain, contrast) are bounded and all interventions are audited.
- **Auditable & Configurable**: Conservative defaults with expert-mode adjustments within bounds; all requested and effective values are logged.

### System Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Input     │────▶│  Safety Envelope │────▶│   Output    │
│  (Actions)  │     │  (Constraints)   │     │  (Rewards)  │
└─────────────┘     └──────────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Audit Log   │
                    └──────────────┘
```

### Features

- **Expert Debug Drawer**: Toggle via `Ctrl+Shift+E`; provides parameter preview and override controls.
- **Envelope Mapping**: `tempo → rewardBpm`, `volume → gain level`, `density → bubble/rhythm density`.
- **Preview & Override**: Expert mode allows parameter adjustment (BPM, dynamic contrast, segment range, volume level) within safety bounds.
- **Generator Branch Control**: Priority order: `expertOverride > expertMode > default derivation`.
- **Result View**: Behavior analysis, click trail visualization, spectrogram comparison, and export functionality.
- **Audit Dashboard**: Session metadata, constraint execution logs, and replay entry points.

## Quick Start

```bash
# Install dependencies
npm ci

# Development server
npx serve src/frontend -l 3000

# Build for deployment
node scripts/build-vercel.js
```

Build output is placed in `public/`.

## Deployment

### Vercel

Configuration in `vercel.json`:
- `installCommand`: `npm ci`
- `buildCommand`: `node scripts/build-vercel.js`
- `outputDirectory`: `public`

### Local Network / iPad Access

See scripts:
- `scripts/start_for_ipad.py`
- `scripts/start_https_server.py`

## Project Structure

```
.
├── src/
│   └── frontend/
│       ├── index.html
│       ├── css/
│       └── js/
│           ├── game-engine.js
│           ├── game-integration.js
│           ├── game-result-manager.js
│           ├── expert-drawer.js
│           ├── music-param-controller.js
│           ├── advanced-music-generator.js
│           ├── safety-envelope.js
│           └── spectrogram-comparison.js
├── public/              # Build output
├── envelope-diagnostic/ # Envelope diagnostic & analysis tools
├── scripts/
│   └── build-vercel.js
└── vercel.json
```

## Envelope Diagnostic

The `envelope-diagnostic/` directory contains diagnostic and analysis tools for the safety envelope, used to verify and visualize constraint effects under different envelope configurations.

### Directory Structure

| Directory | Description |
|-----------|-------------|
| `configs/` | Experiment condition configs (baseline, default, tight, relaxed, ultra_tight) |
| `data/` | Experiment data and statistical summaries (paired analysis, clamp rate) |
| `figures/` | Generated visualizations (SVG format) |
| `scripts/` | Data processing and chart generation scripts |

### Envelope Configuration Comparison

| Parameter | Relaxed | Default | Tight |
|-----------|---------|---------|-------|
| Tempo (BPM) | 60–180 | 120–130 | 124–126 |
| Gain | 0.0–1.0 | 0.3–0.8 | 0.45–0.55 |
| Accent ratio | 0.0–1.0 | 0.0–0.5 | 0.0–0.1 | 
### Usage

```bash
python envelope-diagnostic/scripts/compose_hexad_kde.py --condition constrained_default --out figures/hexad_default.svg

python envelope-diagnostic/scripts/summarize_runs.py
```

## Citation
If you use this work, please cite our paper:

```bibtex
@inproceedings{ye2026input,
  title={Input-Envelope-Output: Auditable Generative Music Rewards in Sensory-Sensitive Contexts},
  author={Ye, Cong and Shang, Songlin and Ma, Xiaoxu and Zhang, Xiangbo},
  booktitle={Extended Abstracts of the 2026 CHI Conference on Human Factors in Computing Systems},
  year={2026},
  series = {CHI EA '26},
  publisher = {ACM},
  address = {Barcelona, Spain},
  note = {Poster Track},
  doi = {10.48550/arXiv.2602.22813},
  url = {https://arxiv.org/abs/2602.22813}
}
```
