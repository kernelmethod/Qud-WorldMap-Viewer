const attribution = `<a href="https://www.cavesofqud.com/">Caves of Qud</a>`;

/* Map element */
const mapEl = document.getElementById("map");

/* Zoom level at which we should transition away from the world map
 * overlay and switch to tiles. */
const worldZoomThreshold = 4;

/* Zoom level at which we should apply pixelated image rendering
 * for tiles. */
const pixelatedZoomThreshold = 6;

const worldMapPixelWidth = 80 * 16;
const worldMapPixelHeight = 25 * 24;

// const tiledMapPixelWidth = 80 * 3 * 80 * 16;
// const tiledMapPixelHeight = 25 * 3 * 25 * 24;
const tiledMapPixelWidth = 8192;
const tiledMapPixelHeight = 1200;

function clamp(num, min, max) {
    if (max !== null && num > max)
        return max;
    if (min !== null && num < min)
        return min;
    return num;
}

function getTileCoords(coords) {
    let x = coords.x;
    let y = coords.y;
    let z = clamp(coords.z - worldZoomThreshold, 0, null);

    let normalization = 2**z;
    x = Math.floor(x / normalization);
    y = 75 + Math.floor(y / normalization);

    return {
        x: x,
        y: y
    }
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

    console.log("start zoom: " + map.getZoom());
});

map.on("zoomend", function()  {
    console.log("coords: " + startCoords.lng + " " + startCoords.lat);
    if (map.getZoom() >= worldZoomThreshold && map.hasLayer(worldMapOverlay)) {
        // Based on the previous coordinates, pan to the corresponding location
        // in the tiled map.
        let fracX = startCoords.lng / worldMapPixelWidth;
        let fracY = startCoords.lat / worldMapPixelHeight;
        console.log("transition frac: " + fracX + " " + fracY);

        let tiledMapX = fracX * tiledMapPixelWidth
        let tiledMapY = fracY * tiledMapPixelHeight

        map.panTo([tiledMapY, tiledMapX]);

        map.removeLayer(worldMapOverlay);
    }
    if (map.getZoom() < worldZoomThreshold && !map.hasLayer(worldMapOverlay)) {
        // Based on the previous coordinates, pan to the corresponding location
        // in the world map.
        let fracX = startCoords.lng / tiledMapPixelWidth;
        let fracY = startCoords.lat / tiledMapPixelHeight;
        console.log("transition frac: " + fracX + " " + fracY);

        let worldMapX = fracX * worldMapPixelWidth;
        let worldMapY = fracY * worldMapPixelHeight;

        map.panTo([worldMapY, worldMapX]);

        map.addLayer(worldMapOverlay);
    }

    if (map.getZoom() >= pixelatedZoomThreshold || map.getZoom() < worldZoomThreshold) {
        mapEl.classList.add("pixel-perfect");
    }
    if (map.getZoom() < pixelatedZoomThreshold && map.getZoom() >= worldZoomThreshold) {
        mapEl.classList.remove("pixel-perfect");
    }
});

/********************* Tile layers ***********************/

var worldMapOverlay = L.imageOverlay("worldmap/world.webp", bounds);
worldMapOverlay.addTo(map);

/*
L.TileLayer.Qud1 = L.TileLayer.extend({
    options: {
        minNativeZoom: worldZoomThreshold,
        maxNativeZoom: worldZoomThreshold,
        minZoom: worldZoomThreshold,
        maxZoom: worldZoomThreshold + 2,
    },

    initialize: function (options) {
        L.Util.setOptions(this, options);
    },

    getTileUrl: function(coords) {
        let tileCoords = getTileCoords(coords);

        return `/tiles/tile_1_${tileCoords.x}_${tileCoords.y}.webp`;
    },
    getAttribution: function() {
        return attribution;
    }
});

L.tileLayer.qud1 = function() {
    return new L.TileLayer.Qud1();
}

L.tileLayer.qud1().addTo(map);
*/

L.TileLayer.Qud0 = L.TileLayer.extend({
    options: {
        minNativeZoom: worldZoomThreshold,
        maxNativeZoom: worldZoomThreshold,
        minZoom: worldZoomThreshold,
    },

    initialize: function (options) {
        L.Util.setOptions(this, options);
    },

    getTileUrl: function(coords) {
        let tileCoords = getTileCoords(coords);

        return `/tiles/tile_0_${tileCoords.x}_${tileCoords.y}.webp`;
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
        let tileCoords = getTileCoords(coords);

        tile.innerHTML = [coords.x, coords.y, coords.z].join(', ') + " " + `${tileCoords.x}.${tileCoords.y}`;
        tile.style.outline = '1px solid red';
        return tile;
    }
});

L.gridLayer.debugCoords = function(opts) {
    return new L.GridLayer.DebugCoords(opts);
};

map.addLayer( L.gridLayer.debugCoords() );
*/
