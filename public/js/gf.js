!function() {

var polygonOptions = {
    editable: true,
    draggable: true,
    fillColor: 'white',
    fillOpacity: 0.10,
    strokeColor: "#33FFFF",
    strokeWeight: 1
}

var mapOptions = {
    zoom: 3,
    styles:  [ {
        "stylers": [ { "invert_lightness": true } ]
    } ],
    backgroundColor: "black",
    center: new google.maps.LatLng(40.69847032728747, -73.9514422416687) // NYC
}

var Socket = io.connect();
var Map;
var Geofences = [];
var GeofenceHits = [];
var GeofenceHitsOrder = [];
var ShowBreadcrumbs = false;

initMap();
initSideBar();
var drawingManager = initDrawingManager();
restoreGeofences();

function initSideBar() {
    // $( "#sidebar button" ).button();

    $( "#sidebar #gf_load_button" ).click(function(){
        clearGeofences();
        restoreGeofences();
    });

    $( "#sidebar #gf_clear_button" ).click(function(){
        clearGeofences();
    });

    $( "#sidebar #gf_save_button" ).click(function(){
        saveGeofences();
    });

    $( "#sidebar #hits_clear_button" ).click(function(){
        clearHitsComplete();
    });

    $( "#hits_breadcrumbs" ).on("click", function(){
        ShowBreadcrumbs = ! ShowBreadcrumbs;
        if (! ShowBreadcrumbs) {
            clearHits();
        }
    })

}

function initMap(){
    Map = new google.maps.Map(document.getElementById('canvas'), mapOptions);
}

function initDrawingManager(){
    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT,
            drawingModes: [ google.maps.drawing.OverlayType.POLYGON ]
        },
        polygonOptions: polygonOptions
    });

    drawingManager.setMap(Map);
    google.maps.event.addListener(drawingManager, 'polygoncomplete', function(polygon) {
        Geofences.push(polygon);
        drawingManager.setDrawingMode(null);
    });

    return drawingManager;
}

function restoreGeofences() {
    $.getJSON("/geofences", function(gflist) {
        var bounds = new google.maps.LatLngBounds();
        gflist.forEach(function(gf){
            var path = [];
            gf.polygon.forEach(function(p){
                var latlng = new google.maps.LatLng(p.lat, p.lng);
                path.push(latlng);
                bounds.extend(latlng);
            });

            var geofence = new google.maps.Polygon(polygonOptions);
            geofence.setPaths(path);
            geofence.setMap(Map);
            Geofences.push(geofence);
        });
        Map.fitBounds(bounds);
    });
}

function clearGeofences() {
    Geofences.forEach(function(gf){
        gf.setMap(null);
    });
    Geofences.length = 0;
}

function saveGeofences() {
    var gfListPub = [];
    Geofences.forEach(function(gf, i){
        var path = google.maps.geometry.encoding.encodePath(gf.getPath());
        var gfPub = { name: "geofence-" + i, path: path, polygon: [] };
        gf.getPath().forEach(function(p){
            gfPub.polygon.push({ lat: p.lat(), lng: p.lng() });
        });
        gfListPub.push(gfPub);
    });
    Socket.emit('geofences-write', gfListPub);
}

Socket.on('geofence-topic', function(hit){
    var title = {};
    title.imsi = hit.subscriber.imsi;
    title.cell = hit.celltower.cell;
    title.geofence = hit.geofence.name;

    var location = new google.maps.LatLng(hit.celltower.location.lat, hit.celltower.location.lng);
    var imsi = hit.subscriber.imsi;

    if (! GeofenceHits[imsi]) {
        GeofenceHits[imsi] = [];
        GeofenceHitsOrder.unshift(imsi);
    }

    var marker = new google.maps.Marker({
        position: location,
        title: JSON.stringify(title),
        icon: "images/yellow_measle.png",
        map: Map
    });

    if (ShowBreadcrumbs) {
        GeofenceHits[imsi].push(marker);
    } else {
        GeofenceHits[imsi].forEach(function(marker){
            marker.setMap(null);
        });
        GeofenceHits[imsi][0] = marker;
    }

    printActiveHitsTable();
});

function printActiveHitsTable() {
    var table = "<tbody>";
    GeofenceHitsOrder.forEach(function(imsi, i){
        var l = GeofenceHits[imsi].length - 1;
        var last = GeofenceHits[imsi][l];
        var hit = JSON.parse(last.getTitle());
        table += "<tr><td>" + imsi + "</td><td>" + hit.geofence + "</td><td>" + hit.cell + "</td></tr>"
    });
    table += "</tbody>";

    $('#hits_table tbody').remove();
    $('#hits_table thead').after(table);
}

function clearHitsComplete() {
    clearHits();
    GeofenceHitsOrder = [];
    GeofenceHits = [];
    $('#hits_table tbody').remove();
}

function clearHits() {
    GeofenceHitsOrder.forEach(function(imsi, i){
        var hits = GeofenceHits[imsi];
        hits.forEach(function(marker){
            marker.setMap(null);
        });
    });
}

}();

