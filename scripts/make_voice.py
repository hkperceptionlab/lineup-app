"""Render the warm-up lines to MP3 with Kokoro (Apache-2.0), voice af_heart.

Reads the `say:` text for each STRETCH_MOVES entry straight from the app
source so the clips always match the on-screen script.

    pip install kokoro-onnx soundfile        (ffmpeg must be on PATH)
    # model files, next to this script:
    #   https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
    #   https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
    python scripts/make_voice.py src/TeamLineupApp.jsx public/voice
"""
import os
import re
import subprocess
import sys
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro
from kokoro_onnx.config import EspeakConfig

src = Path(sys.argv[1]).read_text(encoding="utf-8")
out = Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)

lines = dict(re.findall(r'\{ key: "(\w+)", label: "[^"]*", hold: \d+.*?\n\s*say: "([^"]+)"', src, re.S))
lines["switch"] = "Switch sides."
print(len(lines), "lines:", ", ".join(lines))

here = Path(__file__).parent
work = Path(os.environ.get("TEMP", here))
# espeak-ng can't open its data under a non-ASCII path (e.g. a Korean Windows
# user name). Set LINEUP_ESPEAK_DIR to an ASCII folder holding copies of
# espeak-ng.dll and espeak-ng-data from the espeakng_loader package.
espeak_dir = os.environ.get("LINEUP_ESPEAK_DIR")
espeak = EspeakConfig(lib_path=f"{espeak_dir}/espeak-ng.dll", data_path=f"{espeak_dir}/espeak-ng-data") if espeak_dir else None
tts = Kokoro(str(here / "kokoro-v1.0.onnx"), str(here / "voices-v1.0.bin"), espeak_config=espeak)
for key, text in lines.items():
    samples, rate = tts.create(text, voice="af_heart", speed=0.92, lang="en-us")
    wav = work / f"lineup-{key}.wav"
    sf.write(wav, samples, rate)
    mp3 = out / f"{key}.mp3"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "24000", "-ac", "1", "-b:a", "64k", str(mp3)],
        check=True,
    )
    wav.unlink()
    print(f"{key:10s} {len(samples) / rate:5.1f}s  {mp3.stat().st_size // 1024} KB")
