import json
import argparse
import numpy as np
import matplotlib.pyplot as plt

def hz_ticks(min_hz, max_hz, n=6):
    ks = np.linspace(min_hz, max_hz, n)
    labels = [f"{k/1000:.1f}" for k in ks]
    return ks/1000.0, labels

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def to_array(data):
    return np.array(data, dtype=float)

def main():
    parser = argparse.ArgumentParser(description="Plot spectrogram comparison with Matplotlib")
    parser.add_argument("json_path", help="Path to spectrum_full_data.json")
    parser.add_argument("--png", default="spectrogram_comparison_mpl_300dpi.png", help="Output PNG filename")
    parser.add_argument("--pdf", default="spectrogram_comparison_mpl.pdf", help="Output PDF filename")
    parser.add_argument("--dpi", type=int, default=300, help="DPI for PNG")
    args = parser.parse_args()

    data = load_json(args.json_path)
    env = data.get("envelopeBounds", {"loudnessMax": -14, "loudnessMin": -30})

    plt.rcParams['font.sans-serif'] = ['Arial', 'Helvetica', 'DejaVu Sans']
    plt.rcParams['axes.unicode_minus'] = False

    fig, axs = plt.subplots(2, 2, figsize=(12, 7),
                            gridspec_kw={'height_ratios': [1.5, 1], 'hspace': 0.30, 'wspace': 0.25})
    (ax_spec_a, ax_spec_b), (ax_loud_a, ax_loud_b) = axs
    plt.subplots_adjust(left=0.12, right=0.88, top=0.92, bottom=0.12)

    # Spectrograms
    spec_a = to_array(data["unconstrained"]["spectrogram"]["data"])
    spec_b = to_array(data["constrained"]["spectrogram"]["data"])
    # Limit to 10s horizontally using hopSize/sampleRate
    hop = float(data["unconstrained"]["spectrogram"]["hopSize"])
    sr = float(data["unconstrained"]["spectrogram"]["sampleRate"])
    num_frames_a = spec_a.shape[0]
    seconds_per_frame = hop / sr if sr > 0 else 0.1
    max_frames_10s = int(10 / seconds_per_frame) if seconds_per_frame > 0 else num_frames_a
    spec_a = spec_a[:min(num_frames_a, max_frames_10s), :]
    spec_b = spec_b[:min(spec_b.shape[0], max_frames_10s), :]

    # We show lower bins emphasized; but keep full height for symmetry
    im = ax_spec_a.imshow(spec_a.T, aspect='auto', extent=[0, 10, 0, spec_a.shape[1]], origin='lower', cmap='viridis')
    ax_spec_b.imshow(spec_b.T, aspect='auto', extent=[0, 10, 0, spec_b.shape[1]], origin='lower', cmap='viridis')
    ax_spec_a.set_title('(a) Unconstrained Baseline', pad=12, fontsize=12, fontweight='bold')
    ax_spec_b.set_title('(b) Constraint-First Output', pad=12, fontsize=12, fontweight='bold')
    ax_spec_a.set_ylabel('Frequency (kHz)', labelpad=10)
    ax_spec_a.set_xlabel('')
    ax_spec_b.set_xlabel('')
    ax_spec_a.set_xticks(np.linspace(0, 10, 11))
    ax_spec_b.set_xticks(np.linspace(0, 10, 11))
    ax_spec_a.set_yticks([])
    ax_spec_b.set_yticks([])

    # Common colorbar (right side)
    cbar_ax = fig.add_axes([0.90, 0.62, 0.015, 0.25])
    fig.colorbar(im, cax=cbar_ax, label='Magnitude (dB)')

    # Loudness curves
    loud_a = to_array(data["unconstrained"]["loudness"]["values"])
    time_a = to_array(data["unconstrained"]["loudness"]["times"])
    loud_b = to_array(data["constrained"]["loudness"]["values"])
    time_b = to_array(data["constrained"]["loudness"]["times"])

    # Clip times to 10s
    mask_a = time_a <= 10
    mask_b = time_b <= 10
    loud_a = loud_a[mask_a]
    time_a = time_a[mask_a]
    loud_b = loud_b[mask_b]
    time_b = time_b[mask_b]

    ax_loud_a.plot(time_a, loud_a, color='#111111', linewidth=2)
    ax_loud_b.plot(time_b, loud_b, color='#111111', linewidth=2)
    ax_loud_a.set_ylabel('Loudness (LUFS)', labelpad=10)
    ax_loud_a.set_xlabel('Time (s)')
    ax_loud_b.set_xlabel('Time (s)')
    ax_loud_a.set_xlim(0, 10)
    ax_loud_b.set_xlim(0, 10)
    ax_loud_a.set_ylim(-30, -10)
    ax_loud_b.set_ylim(-30, -10)
    ax_loud_a.set_yticks([-30, -20, -10])
    ax_loud_b.set_yticks([-30, -20, -10])
    # Constraint dashed lines on (b)
    ax_loud_b.axhline(env.get("loudnessMax", -14), color='red', linestyle='--', linewidth=1, alpha=0.7)
    ax_loud_b.axhline(env.get("loudnessMin", -30), color='red', linestyle='--', linewidth=1, alpha=0.7)
    ax_loud_b.text(9.6, env.get("loudnessMax", -14) + 0.8, f"{env.get('loudnessMax', -14)} LUFS", color='red', fontsize=8, ha='right')
    ax_loud_b.text(9.6, env.get("loudnessMin", -30) - 0.8, f"{env.get('loudnessMin', -30)} LUFS", color='red', fontsize=8, ha='right')

    # Footer metrics
    raw_bpm = data["unconstrained"].get("bpm")
    raw_contrast = data["unconstrained"].get("contrast")
    safe_bpm = data["constrained"].get("bpm")
    safe_contrast = data["constrained"].get("contrast")
    lra_raw = data["unconstrained"].get("lra")
    lra_safe = data["constrained"].get("lra")
    fig.text(0.10, 0.04, f"(a) LRA: {lra_raw:.1f} LU   BPM: {raw_bpm}   Contrast: {int(raw_contrast*100) if raw_contrast is not None else '--'}%", fontsize=10)
    fig.text(0.55, 0.04, f"(b) LRA: {lra_safe:.1f} LU   BPM: {safe_bpm}   Contrast: {int(safe_contrast*100) if safe_contrast is not None else '--'}%", fontsize=10)

    fig.savefig(args.png, dpi=args.dpi, bbox_inches='tight')
    fig.savefig(args.pdf, bbox_inches='tight')
    print(f"Saved PNG ({args.dpi} DPI): {args.png}")
    print(f"Saved PDF (vector): {args.pdf}")

if __name__ == "__main__":
    main()
