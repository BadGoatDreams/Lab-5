/* Example from Leaflet Quick Start Guide */

var map; // Declare map globally
var geojson;

// Paths to your GeoJSON data
var Spidey_path = "data/Spidey_data.geojson";
var County_path = "data/Oregon_County_Population.geojson"; // Keep this for county boundaries

function createMapCounty() {
    map = L.map('map').setView([44.567, -122.126], 7);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    addTitle("Spider sightings per person");

    info.addTo(map); // Add info control

    // Legend
    var legend = L.control({ position: 'bottomright' });
    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend');
        var grades = [0.02, 0.01, 0.005, 0.001, 0.0005, 0.0001];
        var labels = ["More than 1 per 50", "1 per 100", "1 per 200", "1 per 1,000", "1 per 2,000", "1 per 10,000"];

        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
    '<i style="background:' + getNormalizedColor(grades[i]) + '; display: inline-block; width: 18px; height: 18px; margin-right: 5px;"></i> ' +  // Added styles
    labels[i] + '<br>';
        }
        return div;
    };
    legend.addTo(map);
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
    var layer = e.target;
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
}

var info = L.control();

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
    var title = L.control({ position: 'topleft' });
    title.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'map-title');
        this._div.innerHTML = '<p class="ex2">' + title_input + '</p>';
        return this._div;
    };
    title.addTo(map);
}


function summarize_points() {
    Promise.all([
        fetch(County_path).then(response => response.json()), // Fetch county boundaries
        fetch(Spidey_path).then(response => response.json())  // Fetch spider data
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

        geojson = L.geoJSON(countyData, { // Assign to geojson for resetHighlight
            style: function(feature) {
                return {
                    fillColor: getNormalizedColor(feature.properties.spidersPerPerson),
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.7
                };
            },
            onEachFeature: onEachFeature // Use the existing onEachFeature function
        }).addTo(map);
    })
    .catch(error => console.error("Error loading data:", error));
}


summarize_points();
document.addEventListener('DOMContentLoaded', createMapCounty);