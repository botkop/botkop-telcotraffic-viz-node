!function() {

var Socket = io.connect();
var Map;
var SelectedMetric = 'rtt';
var SelectedStat = 'mean';

var HeatmapGradient = [
    'rgba(0, 255, 255, 0)',
    'rgba(0, 255, 255, 1)',
    'rgba(0, 191, 255, 1)',
    'rgba(0, 127, 255, 1)',
    'rgba(0, 63, 255, 1)',
    'rgba(0, 0, 255, 1)',
    'rgba(0, 0, 223, 1)',
    'rgba(0, 0, 191, 1)',
    'rgba(0, 0, 159, 1)',
    'rgba(0, 0, 127, 1)',
    'rgba(63, 0, 91, 1)',
    'rgba(127, 0, 63, 1)',
    'rgba(191, 0, 31, 1)',
    'rgba(255, 0, 0, 1)'
];
var HeatmapPointArray = new google.maps.MVCArray();
var HeatmapLayer = new google.maps.visualization.HeatmapLayer({
    data: HeatmapPointArray,
    gradient: HeatmapGradient,
    opacity: .7,
    radius: 15
});

initMap();
initSideBar();

function initSideBar() {
    $( "#clear_button" ).on("click", function(){
        clearHeatmap();
    });

    $( "#select_metric" ).change(function() {
        SelectedMetric = $( "#select_metric option:selected" ).text();
        console.log(SelectedMetric);
        clearHeatmap();
    });

    $( "#select_stat" ).change(function() {
        SelectedStat = $( "#select_stat option:selected" ).text();
        clearHeatmap();
    });

}

function initMap(){
    Map = new google.maps.Map(document.getElementById('canvas'), MapOptions);
    setBoundaries();
    HeatmapLayer.setMap(Map);
}

function setBoundaries(){
    $.getJSON("/geofences", function(gflist) {
        var bounds = new google.maps.LatLngBounds();
        gflist.forEach(function(gf){
            gf.polygon.forEach(function(p){
                var latlng = new google.maps.LatLng(p.lat, p.lng);
                bounds.extend(latlng);
            });
        });
        Map.fitBounds(bounds);
    });
}

Socket.on('celltower-stats-topic', function(cts){
    var weight = cts.stats[SelectedMetric][SelectedStat];
    var location = new google.maps.LatLng(cts.celltower.location.lat, cts.celltower.location.lng);
    HeatmapPointArray.insertAt(0, {location: location, weight: weight});
    heatmapCleaner();
});

function heatmapCleaner(){
    var l = HeatmapPointArray.getLength() - 1;
    for  (i=l; i >= 300; i--) {
        HeatmapPointArray.removeAt(i);
    }
}

function clearHeatmap() {
    HeatmapPointArray.clear();
}

}();

