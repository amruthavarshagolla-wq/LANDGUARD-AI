import requests
import pandas as pd
import time

INPUT_FILE = "data/processed/landslide_points_with_features.csv"
OUTPUT_FILE = "data/processed/landslide_points_with_features.csv"

df = pd.read_csv(INPUT_FILE)

print("===== GETTING SOIL DATA =====")
print("Points:", len(df))

clay_values = []
sand_values = []

for i, row in df.iterrows():

    latitude = row["latitude"]
    longitude = row["longitude"]

    url = (
        "https://rest.isric.org/soilgrids/v2.0/properties/query"
        f"?lon={longitude}"
        f"&lat={latitude}"
        f"&property=clay"
        f"&property=sand"
        f"&depth=0-5cm"
        f"&value=mean"
    )

    clay = None
    sand = None

    # Try up to 3 times
    for attempt in range(3):

        try:

            response = requests.get(
                url,
                timeout=30
            )

            if response.status_code == 200:

                data = response.json()

                layers = data["properties"]["layers"]

                for layer in layers:

                    name = layer["name"]

                    for depth in layer["depths"]:

                        if depth["label"] != "0-5cm":
                            continue

                        values = depth["values"]

                        mean_value = values.get("mean")

                        if mean_value is None:
                            continue

                        # SoilGrids values are g/kg.
                        # Convert g/kg to percentage.
                        percentage = float(mean_value) / 10

                        if name == "clay":
                            clay = percentage

                        elif name == "sand":
                            sand = percentage

                break

            else:

                print(
                    f"Point {i + 1}: "
                    f"HTTP {response.status_code} "
                    f"(attempt {attempt + 1}/3)"
                )

        except Exception as e:

            print(
                f"Point {i + 1}: "
                f"Error: {e} "
                f"(attempt {attempt + 1}/3)"
            )

        time.sleep(2)

    clay_values.append(clay)
    sand_values.append(sand)

    # NOW the terminal prints percentages
    if clay is not None and sand is not None:

        print(
            f"Point {i + 1}/{len(df)}: "
            f"Clay={clay:.1f}%, "
            f"Sand={sand:.1f}%"
        )

    elif clay is not None:

        print(
            f"Point {i + 1}/{len(df)}: "
            f"Clay={clay:.1f}%, "
            f"Sand=Missing"
        )

    elif sand is not None:

        print(
            f"Point {i + 1}/{len(df)}: "
            f"Clay=Missing, "
            f"Sand={sand:.1f}%"
        )

    else:

        print(
            f"Point {i + 1}/{len(df)}: "
            f"Clay=Missing, "
            f"Sand=Missing"
        )

    time.sleep(0.5)


# Add final soil columns
df["soil_clay_percent"] = clay_values
df["soil_sand_percent"] = sand_values


# Save the updated dataset
df.to_csv(
    OUTPUT_FILE,
    index=False
)


# Final results
print()
print("===== SOIL EXTRACTION COMPLETE =====")

print("Rows:", len(df))

print(
    "Missing clay:",
    df["soil_clay_percent"].isna().sum()
)

print(
    "Missing sand:",
    df["soil_sand_percent"].isna().sum()
)

if df["soil_clay_percent"].notna().any():

    print(
        "Clay range:",
        f"{df['soil_clay_percent'].min():.1f}%",
        "to",
        f"{df['soil_clay_percent'].max():.1f}%"
    )

if df["soil_sand_percent"].notna().any():

    print(
        "Sand range:",
        f"{df['soil_sand_percent'].min():.1f}%",
        "to",
        f"{df['soil_sand_percent'].max():.1f}%"
    )

print()
print("Saved to:")
print(OUTPUT_FILE)
