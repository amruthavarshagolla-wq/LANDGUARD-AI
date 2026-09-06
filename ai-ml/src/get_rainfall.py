import requests
import pandas as pd
import time

INPUT_FILE = "data/processed/landslide_points_with_features.csv"
OUTPUT_FILE = "data/processed/landslide_points_with_features.csv"

df = pd.read_csv(INPUT_FILE)

print("===== GETTING RAINFALL DATA =====")
print("Points:", len(df))

rainfall_values = []

for i, row in df.iterrows():

    latitude = row["latitude"]
    longitude = row["longitude"]

    url = (
        "https://power.larc.nasa.gov/api/temporal/climatology/point"
        f"?parameters=PRECTOTCORR"
        f"&community=AG"
        f"&longitude={longitude}"
        f"&latitude={latitude}"
        f"&format=JSON"
    )

    try:
        response = requests.get(url, timeout=30)

        if response.status_code != 200:
            print(
                f"Point {i + 1}: HTTP error {response.status_code}"
            )
            rainfall_values.append(None)
            continue

        data = response.json()

        parameter_data = data["properties"]["parameter"]["PRECTOTCORR"]

        # Average the monthly climatological precipitation values
        values = [
            float(value)
            for key, value in parameter_data.items()
            if value is not None
        ]

        if len(values) > 0:
            annual_average = sum(values) / len(values)
        else:
            annual_average = None

        rainfall_values.append(annual_average)

        print(
            f"Point {i + 1}/{len(df)}: "
            f"{latitude:.5f}, {longitude:.5f} "
            f"-> {annual_average}"
        )

    except Exception as e:
        print(f"Point {i + 1}: Error - {e}")
        rainfall_values.append(None)

    time.sleep(0.2)

df["rainfall_mm"] = rainfall_values

df.to_csv(OUTPUT_FILE, index=False)

print()
print("===== RAINFALL EXTRACTION COMPLETE =====")
print("Rows:", len(df))
print("Missing rainfall values:", df["rainfall_mm"].isna().sum())

print(
    "Rainfall range:",
    df["rainfall_mm"].min(),
    "to",
    df["rainfall_mm"].max()
)

print("Saved to:", OUTPUT_FILE)
