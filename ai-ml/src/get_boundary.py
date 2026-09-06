import requests
import json

url = "https://meghalayacmdashboard.in/gishosting/rest/services/Hosted/District_Boundary_2021/FeatureServer/4/query"

params = {
    "where": "1=1",
    "outFields": "*",
    "returnGeometry": "true",
    "f": "geojson"
}

response = requests.get(url, params=params)

print("Status:", response.status_code)

data = response.json()

with open("data/raw/east_khasi_hills_boundary.geojson", "w", encoding="utf-8") as f:
    json.dump(data, f)

print("East Khasi Hills boundary saved successfully!")
