import rasterio
from rasterio.merge import merge

dem1 = "data/raw/dem/N25E091.tif"
dem2 = "data/raw/dem/N25E092.tif"

with rasterio.open(dem1) as src1:
    with rasterio.open(dem2) as src2:

        mosaic, transform = merge([src1, src2])

        profile = src1.profile.copy()
        profile.update(
            {
                "height": mosaic.shape[1],
                "width": mosaic.shape[2],
                "transform": transform
            }
        )

        output = "data/raw/dem/east_khasi_hills_dem.tif"

        with rasterio.open(output, "w", **profile) as dst:
            dst.write(mosaic)

print("===== DEM MERGED SUCCESSFULLY =====")
print("Saved to:", output)