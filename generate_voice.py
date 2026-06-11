# ============================================================
# VIBE CODING BOOTCAMP - 神クオリティ音声ジェネレーター
#
# data.js から全ナレーション台本を抽出し、Microsoftニューラル音声
# （edge-tts・無料）でMP3を一括生成する。
# サイトは audio/manifest.json があれば自動でこちらを再生し、
# 無いテキストはブラウザTTSにフォールバックする。
#
# 使い方:
#   pip install edge-tts json5
#   python generate_voice.py
#
# 声の調整は下の VOICES を編集して再実行（生成済みは差分のみ）。
# 全部作り直したいときは audio/ フォルダを削除してから実行。
# ============================================================
import asyncio
import hashlib
import json
import re
import sys
from pathlib import Path

try:
    # 社内プロキシ（SSLインスペクション）環境向け：Windows証明書ストアを使う
    import truststore
    truststore.inject_into_ssl()
except ImportError:
    pass

import edge_tts
import json5

# ---- 声の設定（ここを調整して「神クオリティ」を追い込む）-------------
# ナレーター：低音男性・少し速め・重厚 ＝ LIAR GAME風
# クライアント：別人の声・軽い調子 ＝ つぶやきと一聴で分かる
VOICES = {
    "narrator": {"voice": "ja-JP-KeitaNeural",  "rate": "+12%", "pitch": "-25Hz"},
    "client":   {"voice": "ja-JP-NanamiNeural", "rate": "+10%", "pitch": "+5Hz"},
}

ROOT = Path(__file__).parent
OUT = ROOT / "audio"


# ---- data.js を読む（json5でパース）---------------------------------
def load_data():
    src = (ROOT / "data.js").read_text(encoding="utf-8")
    parts = re.split(r"^const\s+(\w+)\s*=\s*", src, flags=re.M)
    data = {}
    for name, val in zip(parts[1::2], parts[2::2]):
        lines = val.splitlines()
        while lines and (not lines[-1].strip() or lines[-1].strip().startswith("//")):
            lines.pop()
        body = "\n".join(lines).rstrip()
        if body.endswith(";"):
            body = body[:-1]
        data[name] = json5.loads(body)
    return data


# ---- app.js の自動生成スライドと同じ文面を組み立てる -----------------
# ※app.js側のテンプレートを変えたらここも合わせること。
#   一致しないテキストはブラウザTTSにフォールバックするだけなので壊れはしない。
def collect_texts(data):
    sessions, hats = data["SESSIONS"], data["HATS"]
    narrator, client = [], []

    def add(lst, t):
        if t and t not in lst:
            lst.append(t)

    for s in sessions:
        total = sum(a["dur"] for a in s["agenda"])
        # 概要ブリーフィング（buildMissionSlides 相当）
        add(narrator, f"{s['code'].replace('EP.', 'エピソード')}。{s['theme']}。{s['title']}")
        add(narrator, f"今日のゴール。{s['goal']}。持ち帰るものは、こうだ。{s['outcome']}")
        timeline = "".join(f"{a['title']}、{a['dur']}分。" for a in s["agenda"])
        add(narrator, f"本日の作戦行動は全{len(s['agenda'])}項目、{total}分だ。{timeline}")
        add(narrator, "以上、ブリーフィング終了。作戦を開始する。")

        for a in s["agenda"]:
            hat = hats[a["hat"]]
            # 表紙（buildActivitySlides 相当）
            add(narrator, f"ミッション。{a['title']}。所要時間、{a['dur']}分。私のハットは、{hat['name']}だ。")
            for sl in a.get("slides", []):
                add(narrator, sl.get("say"))
            # GOスライド
            if a["type"] == "lecture":
                add(narrator, "講義は以上だ。")
            else:
                add(narrator, f"準備はいいか。ボタンを押して、{a['dur']}分のタイマーを開始しろ。")
            # クライアントのつぶやき
            for ev in a.get("clientEvents", []):
                add(client, ev.get("say") or ev.get("text"))

        # MISSION CLEAR（missionComplete 相当）
        add(narrator, f"ミッション、クリア。{s['theme']}、全行程完了。よくやった。……解散！")

    return {"narrator": narrator, "client": client}


# ---- 生成 ------------------------------------------------------------
async def main():
    data = load_data()
    texts = collect_texts(data)
    OUT.mkdir(exist_ok=True)
    manifest = {}
    made = skipped = 0

    for kind, lst in texts.items():
        cfg = VOICES[kind]
        manifest[kind] = {}
        for t in lst:
            name = f"{kind[0]}_{hashlib.md5((cfg['voice'] + cfg['rate'] + cfg['pitch'] + t).encode()).hexdigest()[:12]}.mp3"
            f = OUT / name
            # 0バイト＝過去の失敗の残骸なので作り直す
            if not f.exists() or f.stat().st_size == 0:
                try:
                    await edge_tts.Communicate(t, cfg["voice"], rate=cfg["rate"], pitch=cfg["pitch"]).save(str(f))
                except Exception:
                    f.unlink(missing_ok=True)  # 失敗時は残骸を残さない
                    raise
                if f.stat().st_size == 0:
                    f.unlink(missing_ok=True)
                    raise RuntimeError(f"empty audio generated: {t[:30]}")
                made += 1
                print(f"  [{kind}] {name}  {t[:28]}…")
            else:
                skipped += 1
            manifest[kind][t] = name

    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n完了: 新規 {made} 件 / スキップ {skipped} 件")
    print(f"manifest: {OUT / 'manifest.json'}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(1)
