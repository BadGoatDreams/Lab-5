/* Example from Leaflet Quick Start Guide */

var map; // Declare map globally to avoid redeclaring in multiple places
var minValue; // This will store the minimum value of population for the proportional radius calculation
var geojson

// Step 1: Create map
var County_path = "data/Oregon_County_Population.geojson";
var Spidey_path = "data/Spidey_data.geojson";
//var County_path = "data/Urban_pop_by_state.geojson";



function createMapCounty() {
    // Create the map centered at coordinates [38.598, -98.63] with zoom level 5.5
    map = L.map('map').setView([44.567, -122.126], 7);

    // Add OSM base tile layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Call the getData function to fetch and process the GeoJSON data
    getData(County_path);
    addTitle("Spider sightings per person");

    var legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0.01, 0.005, 0.001, 0.0005, 0.0001, 0.00001],
        labels = ["More than 1 per 100", "1 per 200", "1 per 1,000", "1 per 2,000", "1 per 10,000", "1 per 100,000"];

    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getNormalizedColor(grades[i]) + '"></i> ' +
            labels[i] + '<br>';
    }
    return div;
};

legend.addTo(map);

// Update info control
info.update = function (props) {
    this._div.innerHTML = '<h4>Spider Sightings per Person</h4>' + (props ?
        '<b>' + props.NAME + '</b><br />' + 
        props.spidersPerPerson.toFixed(6) + ' sightings per person' :
        'Hover over a county');
};
};

// Step 2: Import GeoJSON data
function getData(data_path) {
    // Load the GeoJSON data (replace this with the correct path to your GeoJSON file)
    fetch(data_path)
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
           
                geojson = L.geoJson(json, { style: style, onEachFeature:onEachFeature }).addTo(map);
                info.addTo(map);
            
        
})
    };


function style(feature) {
    return {
        fillColor: getColor(feature.properties.Population),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

function getColor(pop) {
    return pop > 1000000 ? '#800026' :
           pop > 500000  ? '#BD0026' :
           pop > 100000  ? '#E31A1C' :
           pop > 20000  ? '#FC4E2A' :
           pop > 10000   ? '#FD8D3C' :
           pop > 5000   ? '#FEB24C' :
           pop > 1000   ? '#FED976' :
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
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
    this._div.innerHTML = '<h4>Oregon County Population</h4>' +  (props ?
        '<b>' + props.NAME + '</b><br />' + props.Population + ' Population per county'
        : 'Hover over a state');
};
function addTitle(title_input) {
    // Create a custom control
    var title = L.control({ position: 'topleft' });

    // This method will be called when the control is added to the map
    title.onAdd = function (map) {
        // Create a div element to hold the title
        this._div = L.DomUtil.create('div', 'map-title');
        
        // Set the inner HTML of the div to your title
        this._div.innerHTML = '<p class="ex2">' + title_input + '</p>';
        
        // Return the div element
        return this._div;
    };

    // Add the control to the map
    title.addTo(map);
}


console.log("added info!")
function getNormalizedColor(ratio) {
    return ratio > 0.01 ? '#800026' :
           ratio > 0.005 ? '#BD0026' :
           ratio > 0.001 ? '#E31A1C' :
           ratio > 0.0005 ? '#FC4E2A' :
           ratio > 0.0001 ? '#FD8D3C' :
           ratio > 0.00001 ? '#FEB24C' :
                             '#FED976';
}


function getSpiderColor(count) {
    return count > 100 ? '#800026' :
           count > 50  ? '#BD0026' :
           count > 20  ? '#E31A1C' :
           count > 10  ? '#FC4E2A' :
           count > 5   ? '#FD8D3C' :
           count > 1   ? '#FEB24C' :
                         '#FED976';
}


function summarize_points() {
    Promise.all([
        fetch(County_path).then(response => response.json()),
        fetch(Spidey_path).then(response => response.json())
    ])
    .then(([countyData, spideyData]) => {
        // Extract polygons and points
        const County_polygons = countyData.features.filter(f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon');
        const Spidey_points = spideyData.features.filter(f => f.geometry.type === 'Point');

        console.log("County Polys:", County_polygons);
        console.log("Spidey Points:", Spidey_points);

        // Process each county
        County_polygons.forEach(poly => {
            // Count spiders in the county
            const SpoodersInCounty = turf.pointsWithinPolygon({
                type: "FeatureCollection",
                features: Spidey_points
            }, poly);

            const spiderCount = SpoodersInCounty.features.length;
            const population = poly.properties.Population || 1; // Avoid division by zero

            // Normalize spider count by population
            poly.properties.spidersPerPerson = spiderCount / population;
        });

        console.log("Updated County Polys with Spiders Per Person:", County_polygons);

        // ✅ Update the map with county polygons, colored based on normalized spider count
        L.geoJSON(countyData, {
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
            onEachFeature: function(feature, layer) {
                layer.bindPopup(`<b>${feature.properties.NAME}</b><br>
                    Spider Count: ${feature.properties.spidersPerPerson.toFixed(6)} per person`);
            }
        }).addTo(map);
    })
    .catch(error => console.error("Error loading data:", error));
}





summarize_points();


// Listen for the DOMContentLoaded event to initialize the map
document.addEventListener('DOMContentLoaded', createMapCounty);