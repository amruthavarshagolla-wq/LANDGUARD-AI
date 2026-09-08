import requests

url = "http://127.0.0.1:5000/predict"

data = {
    "zone_id": "EKH_00019",
    "elevation_m": 1500,
    "slope_deg": 35,
    "aspect_deg": 180,
    "rainfall_mm": 3000,
    "soil_clay_percent": 30,
    "soil_sand_percent": 40,
    "land_cover": "Tree cover",
    "distance_to_road_m": 100,
    "built_up_percent": 5,
    "forest_loss_percent": 10,
    "distance_to_stream_m": 80,
    "drainage_density": 2.5,
    "earthquake_distance_km": 8.5
}

response = requests.post(url, json=data)

print("Status code:", response.status_code)
print("Response:", response.json())