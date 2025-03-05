/* Example from Leaflet Quick Start Guide */

let map; // Declare map globally
let geojson;

// Paths to your GeoJSON data
const Spidey_path = "data/Spidey_data.geojson";
const County_path = "data/Oregon_County_Population.geojson";

function createMapCounty() {
    map = L.map('map').setView([44.567, -122.126], 7);

    L.tileLayer('https://api.mapbox.com/styles/v4/badgoatdreams/cm6iw4j8i00ag01rf3l668k6q/tiles/256/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYmFkZ29hdGRyZWFtcyIsImEiOiJjbTZpdzJlZzQwZDdxMmpvbzMzYm5zZHpwIn0.FS149B5ltQdbRgLL7ctZkQ', {
        maxZoom: 19,
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    addTitle("Spider sightings per person");

    info.addTo(map);

    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend');
        const grades = [0.02, 0.01, 0.005, 0.001, 0.0005, 0.0001];
        const labels = ["More than 1 per 50", "1 per 100", "1 per 200", "1 per 1,000", "1 per 2,000", "1 per 10,000"];

        for (let i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<span style="background:' + getNormalizedColor(grades[i]) + '; display: inline-block; width: 18px; height: 18px; margin-right: 5px;"></span> ' +
                labels[i] + '<br>';
        }
        return div;
    };
    legend.addTo(map);

    summarize_points(); // Call summarize_points AFTER map is initialized
}

function getNormalizedColor(ratio) {
    return ratio > 0.02 ? '#800026' :
        ratio > 0.01 ? '#BD0026' :
        ratio > 0.005 ? '#E31A1C' :
        ratio > 0.001 ? '#FC4E2A' :
        ratio > 0.0005 ? '#FD8D3C' :
        ratio > 0.0001 ? '#FEB24C' :
        '#FED976';
}

function highlightFeature(e) {
    const layer = e.target;
    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });
    layer.bringToFront();
    info.update(layer.feature.properties);
}

function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });

    if (feature.geometry.type === "Point") {
        const latlng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
        addGifMarker(latlng, 'data/spider.gif', 50, 50); // Correct GIF path
    }
}

const info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
};

info.update = function (props) {
    this._div.innerHTML = '<h4>Spider Sightings per Person <br> (based on Inaturalist data) </h4>' + (props ?
        '<b>' + props.NAME + '</b><br />' + props.spidersPerPerson.toFixed(6) + ' sightings per person' :
        'Hover over a county');
};

function addTitle(title_input) {
    const title = L.control({ position: 'topleft' });
    title.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'map-title');
        this._div.innerHTML = '<p class="ex2">' + title_input + '</p>';
        return this._div;
    };
    title.addTo(map);
}

function summarize_points() {
    Promise.all([
        fetch(County_path).then(response => response.json()),
        fetch(Spidey_path).then(response => response.json())
    ])
        .then(([countyData, spideyData]) => {
            const County_polygons = countyData.features.filter(f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon');
            const Spidey_points = spideyData.features.filter(f => f.geometry.type === 'Point');

            County_polygons.forEach(poly => {
                const SpoodersInCounty = turf.pointsWithinPolygon({
                    type: "FeatureCollection",
                    features: Spidey_points
                }, poly);

                const spiderCount = SpoodersInCounty.features.length;
                const population = poly.properties.Population || 1;
                poly.properties.spidersPerPerson = spiderCount / population;
            });

            geojson = L.geoJSON(countyData, {
                style: function (feature) {
                    return {
                        fillColor: getNormalizedColor(feature.properties.spidersPerPerson),
                        weight: 2,
                        opacity: 1,
                        color: 'white',
                        dashArray: '3',
                        fillOpacity: 0.7
                    };
                },
                onEachFeature: onEachFeature
            }).addTo(map);
        })
        .catch(error => console.error("Error loading data:", error));
}

function addGifMarker(latlng, gifUrl, width, height) {
    const gifIcon = L.icon({
        iconUrl: gifUrl,
        iconSize: [width, height],
        html: `<img src="${gifUrl}" width="${width}" height="${height}" style="pointer-events: none;">`,
        className: 'gif-marker'
    });

    L.marker(latlng, { icon: gifIcon }).addTo(map);
}


document.addEventListener('DOMContentLoaded', createMapCounty);