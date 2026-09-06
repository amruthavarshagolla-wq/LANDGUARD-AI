import requests

url = "http://127.0.0.1:5000/predict"

data = {
    "zone_id": "EKH_00000_00019",
    "elevation_m": 850,
    "slope_deg": 25,
    "aspect_deg": 180,
    "rainfall_mm": 3000,
    "soil_clay_percent": 30,
    "soil_sand_percent": 40,
    "land_cover": 10,
    "distance_to_road_m": 120
}

response = requests.post(url, json=data)

print("Status code:", response.status_code)
print("Response:")
print(response.json())