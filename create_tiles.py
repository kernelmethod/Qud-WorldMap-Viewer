#!/usr/bin/env python3

"""
Create square tiles using zone images from the game.
"""

from PIL import Image
from pathlib import Path
from tqdm import tqdm

# Dimension for the height and width of each tile. Must divide the height and
# width of the entire map.
TILE_LENGTH = 600

ZONE_HEIGHT_PX = 25 * 24
ZONE_WIDTH_PX = 80 * 16
MAP_HEIGHT_PX = (25 * 3) * ZONE_HEIGHT_PX
MAP_WIDTH_PX = (80 * 3) * ZONE_WIDTH_PX

if MAP_HEIGHT_PX % TILE_LENGTH != 0:
    raise Exception("Tile length must divide height of world map in pixels")

if MAP_WIDTH_PX % TILE_LENGTH != 0:
    raise Exception("Tile width must divide width of world map in pixels")

tile_width = MAP_WIDTH_PX // TILE_LENGTH
tile_height = MAP_HEIGHT_PX // TILE_LENGTH

def clamp(x: int, min: int, max: int) -> int:
    if x < min:
        return min
    if x > max:
        return max
    return x

def get_zone_for_pixel(x: int, y: int):
    # Pixel is interpreted with (0, 0) in the top left of the world map
    wx = x // (ZONE_WIDTH_PX * 3)
    wy = y // (ZONE_HEIGHT_PX * 3)
    px = (x // ZONE_WIDTH_PX) % 3
    py = (y // ZONE_HEIGHT_PX) % 3

    return f"JoppaWorld.{wx}.{wy}.{px}.{py}.10"

def fetch_rectangle(bottom: tuple[int, int], top: tuple[int, int]) -> Image:
    """Fetch a rectangle of pixels using the bounding box defined by the
    provided coordinates."""

    assert bottom <= top

    tile = Image.new("RGB", (top[0] - bottom[0], top[1] - bottom[1]))

    # Stride over the pixels row-wise
    x = bottom[0]
    while x < top[0]:
        x_max = x + ZONE_WIDTH_PX
        x_max -= x % ZONE_WIDTH_PX
        x_max = clamp(x_max, bottom[0], top[0])

        y = bottom[1]

        while y < top[1]:
            # Get the zone containing this pixel
            zoneid = get_zone_for_pixel(x, y)
            zone_img = Image.open(Path("worldmap") / f"{zoneid}.webp")

            # Crop zone
            y_max = y + ZONE_HEIGHT_PX
            y_max -= y % ZONE_HEIGHT_PX
            y_max = clamp(y_max, bottom[1], top[1])
            assert x_max >= x
            assert y_max >= y

            x_zone = x % ZONE_WIDTH_PX
            y_zone = y % ZONE_HEIGHT_PX
            x_zone_max = clamp((x_max - x) + x_zone, 0, ZONE_WIDTH_PX)
            y_zone_max = clamp((y_max - y) + y_zone, 0, ZONE_HEIGHT_PX)
            assert x_zone < x_zone_max
            assert y_zone < y_zone_max

            zone_img_cropped = zone_img.crop((x_zone, y_zone, x_zone_max, y_zone_max))

            # Paste into tile
            x_tile = x - bottom[0]
            y_tile = y - bottom[1]

            tile.paste(zone_img_cropped, (x_tile, y_tile))

            y = y_max

        x = x_max

    # Return constructed tile
    return tile

num_tiles = MAP_HEIGHT_PX * MAP_WIDTH_PX // (TILE_LENGTH**2)
pbar_iterator = iter(pbar := tqdm(range(num_tiles)))

(outdir := Path.cwd() / "tiles").mkdir(exist_ok=True)

for x in range(0, MAP_WIDTH_PX // TILE_LENGTH):
    for y in range(0, MAP_HEIGHT_PX // TILE_LENGTH):
        pixel_x = x * TILE_LENGTH
        pixel_y = y * TILE_LENGTH

        upper_corner = (pixel_x, pixel_y)
        lower_corner = (pixel_x + TILE_LENGTH, pixel_y + TILE_LENGTH)

        tile = fetch_rectangle(upper_corner, lower_corner)
        tile.save(outdir / f"tile_{x}_{y}.webp", lossless=True)
        i = next(pbar_iterator)
