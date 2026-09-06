import requests
import os

URL = (
    "https://esa-worldcover.s3.eu-central-1.amazonaws.com/"
    "v200/2021/map/"
    "ESA_WorldCover_10m_2021_v200_N24E090_Map.tif"
)

OUTPUT_DIR = "data/raw/landcover"
OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "ESA_WorldCover_10m_2021_v200_N24E090_Map.tif"
)

os.makedirs(OUTPUT_DIR, exist_ok=True)

print("===== DOWNLOADING ESA WORLDCOVER =====")
print("Tile: N24E090")
print("Source: ESA WorldCover 2021 v200")

response = requests.get(URL, stream=True, timeout=60)

print("HTTP status:", response.status_code)

if response.status_code != 200:
    print("Download failed.")
    print(response.text[:500])
    raise SystemExit

total_size = int(response.headers.get("content-length", 0))
downloaded = 0

with open(OUTPUT_FILE, "wb") as f:

    for chunk in response.iter_content(chunk_size=1024 * 1024):

        if chunk:
            f.write(chunk)
            downloaded += len(chunk)

            if total_size:
                percent = downloaded / total_size * 100
                print(
                    f"\rDownloaded: {percent:.1f}%",
                    end=""
                )

print()

print("===== DOWNLOAD COMPLETE =====")
print("Saved to:")
print(OUTPUT_FILE)
