const attribution = `<a href="https://www.cavesofqud.com/">Caves of Qud</a>`;

/* Map element */
const mapEl = document.getElementById("map");

/* Zoom level at which we should transition away from the world map
 * overlay and switch to tiles. */
const tileZoomThreshold_L1 = 3;
const tileZoomThreshold_L0 = tileZoomThreshold_L1 + 2;

/* Zoom level at which we should apply pixelated image rendering
 * for tiles. */
const pixelatedZoomThreshold = 6;

const worldMapPixelWidth = 80 * 16;
const worldMapPixelHeight = 25 * 24;

const tiledMapWidth_L1 = 128;
const tiledMapHeight_L1 = 19;

const tiledMapWidth_L0 = 512;
const tiledMapHeight_L0 = 75;

// const tiledMapPixelWidth = tiledMapWidth_L0 * 16;
// const tiledMapPixelHeight = tiledMapHeight_L0 * 16;
const tiledMapPixelWidth_L1 = tiledMapWidth_L1 * 32;
const tiledMapPixelHeight_L1 = tiledMapHeight_L1 * 32;

function clamp(num, min, max) {
    if (max !== null && num > max)
        return max;
    if (min !== null && num < min)
        return min;
    return num;
}

var bounds = [[0, 0], [worldMapPixelHeight, worldMapPixelWidth]];

var map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: 0,
    maxZoom: 10,
    zoomSnap: 1,
    zoomDelta: 0.5,
    center: [worldMapPixelHeight / 2, worldMapPixelWidth / 2]
});
map.fitBounds(bounds);

var startCoords = map.getCenter();
var startZoom = map.getZoom();

map.on("zoomstart", function() {
    startCoords = map.getCenter();
    startZoom = map.getZoom();
});

map.on("zoomend", function()  {
    if (map.getZoom() >= tileZoomThreshold_L1 && map.hasLayer(worldMapOverlay)) {
        // Based on the previous coordinates, pan to the corresponding location
        // in the tiled map.
        let coords = map.getCenter();
        let fracX = coords.lng / worldMapPixelWidth;
        let fracY = coords.lat / worldMapPixelHeight;

        let tiledMapX = fracX * tiledMapPixelWidth_L1;
        let tiledMapY = fracY * tiledMapPixelHeight_L1;

        map.panTo([tiledMapY, tiledMapX], {
            animate: false
        });

        map.removeLayer(worldMapOverlay);
    }
    if (map.getZoom() < tileZoomThreshold_L1 && !map.hasLayer(worldMapOverlay)) {
        // Based on the previous coordinates, pan to the corresponding location
        // in the world map.
        let coords = map.getCenter();
        let fracX = coords.lng / tiledMapPixelWidth_L1;
        let fracY = coords.lat / tiledMapPixelHeight_L1;

        let worldMapX = fracX * worldMapPixelWidth;
        let worldMapY = fracY * worldMapPixelHeight;

        map.panTo([worldMapY, worldMapX], {
            animate: false
        });

        map.addLayer(worldMapOverlay);
    }

    // When transitioning from L1 to L0 there's a small shift that we need to correct for
    if (map.getZoom() >= tileZoomThreshold_L0 && startZoom < tileZoomThreshold_L0) {
        let panRatio = 1 / 75;
        let coords = map.getCenter();
        let yDelta = tiledMapPixelHeight_L1 * panRatio;
        map.panTo([coords.lat - yDelta, coords.lng], {
            animate: false
        });
    }
    if (map.getZoom() < tileZoomThreshold_L0 && startZoom >= tileZoomThreshold_L0) {
        let panRatio = 1 / 76;
        let coords = map.getCenter();
        let yDelta = tiledMapPixelHeight_L1 * panRatio;
        map.panTo([coords.lat + yDelta, coords.lng], {
            animate: false
        });
    }

    // When we get close enough to the individual tiles, use nearest-neighbor image scaling
    // to make the tiles look the same way they look in-game.
    //
    // We also add nearest-neighbor scaling to the world map for the same resaon.
    if (map.getZoom() >= pixelatedZoomThreshold || map.getZoom() < tileZoomThreshold_L1) {
        mapEl.classList.add("pixel-perfect");
    }
    if (map.getZoom() < pixelatedZoomThreshold && map.getZoom() >= tileZoomThreshold_L1) {
        mapEl.classList.remove("pixel-perfect");
    }
});

/********************* Tile layers ***********************/

var worldMapOverlay = L.imageOverlay("worldmap/world.webp", bounds);
worldMapOverlay.addTo(map);

L.TileLayer.Qud1 = L.TileLayer.extend({
    options: {
        minNativeZoom: tileZoomThreshold_L1,
        maxNativeZoom: tileZoomThreshold_L1,
        minZoom: tileZoomThreshold_L1,
        maxZoom: tileZoomThreshold_L0
    },

    initialize: function (options) {
        L.Util.setOptions(this, options);
    },

    getTileUrl: function(coords) {
        let x = coords.x;
        let y = coords.y;
        let z = clamp(coords.z - tileZoomThreshold_L1, 0, null);

        let normalization = 2**z;
        x = Math.floor(x / normalization);
        y = tiledMapHeight_L1 + Math.floor(y / normalization);

        return `/tiles/tile_1_${x}_${y}.webp`;
    },
    getAttribution: function() {
        return attribution;
    }
});

L.tileLayer.qud1 = function() {
    return new L.TileLayer.Qud1();
}

L.tileLayer.qud1().addTo(map);

L.TileLayer.Qud0 = L.TileLayer.extend({
    options: {
        minNativeZoom: tileZoomThreshold_L0,
        maxNativeZoom: tileZoomThreshold_L0,
        minZoom: tileZoomThreshold_L0,
    },

    initialize: function (options) {
        L.Util.setOptions(this, options);
    },

    getTileUrl: function(coords) {
        let x = coords.x;
        let y = coords.y;
        let z = clamp(coords.z - tileZoomThreshold_L0, 0, null);

        let normalization = 2**z;
        x = Math.floor(x / normalization);
        y = tiledMapHeight_L0 + Math.floor(y / normalization);

        const url = `/tiles/tile_0_${x}_${y}.webp`;
        return url;
    },
    getAttribution: function() {
        return attribution;
    }
});

L.tileLayer.qud0 = function() {
    return new L.TileLayer.Qud0();
}

L.tileLayer.qud0().addTo(map);

/*
L.GridLayer.DebugCoords = L.GridLayer.extend({
    createTile: function (coords) {
        let tile = document.createElement('div');

        tile.innerHTML = [coords.x, coords.y, coords.z].join(', ');
        tile.style.outline = '1px solid red';
        return tile;
    }
});

L.gridLayer.debugCoords = function(opts) {
    return new L.GridLayer.DebugCoords(opts);
};

map.addLayer( L.gridLayer.debugCoords() );
*/
