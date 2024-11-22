const attribution = `<a href="https://www.cavesofqud.com/">Caves of Qud</a>`;

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
    let z = clamp(coords.z - 5, 0, null);

    let normalization = 2**z;
    x = Math.floor(x / normalization);
    y = 75 + Math.floor(y / normalization);

    return {
        x: x,
        y: y
    }
}

// var maxX = 80 * 3 * 80 * 16;
// var maxY = 25 * 3 * 25 * 24;
var maxX = 80 * 16;
var maxY = 25 * 24;
var bounds = [[0, 0], [maxY, maxX]];

var map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: 0,
    maxZoom: 10,
    zoomSnap: 0.5,
    zoomDelta: 0.5,
    center: [maxX / 2, maxY / 2]
});
map.fitBounds(bounds);

var worldMapOverlay = L.imageOverlay("worldmap/world.webp", bounds);
worldMapOverlay.addTo(map);

map.on("zoomend", function()  {
    console.log(map.getZoom());
    if (map.getZoom() >= 5 && map.hasLayer(worldMapOverlay)) {
        map.removeLayer(worldMapOverlay);
    }
    if (map.getZoom() < 5 && !map.hasLayer(worldMapOverlay)) {
        map.addLayer(worldMapOverlay);
    }
});

L.TileLayer.Qud = L.TileLayer.extend({
    options: {
        minNativeZoom: 5,
        maxNativeZoom: 5,
        minZoom: 5,
    },

    initialize: function (options) {
        L.Util.setOptions(this, options);
    },

    getTileUrl: function(coords) {
        let tileCoords = getTileCoords(coords);

        return `/tiles/tile_${tileCoords.x}_${tileCoords.y}.webp`;
    },
    getAttribution: function() {
        return attribution;
    }
});

L.tileLayer.qud = function() {
    return new L.TileLayer.Qud();
}

L.tileLayer.qud().addTo(map);

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
