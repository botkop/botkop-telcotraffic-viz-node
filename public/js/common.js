var PolygonOptions = {
    editable: true,
    draggable: true,
    fillColor: 'white',
    fillOpacity: 0.10,
    strokeColor: "#33FFFF",
    strokeWeight: 1
}

var MapOptions = {
    zoom: 3,
    styles:  [ {
        "stylers": [ { "invert_lightness": true } ]
    } ],
    backgroundColor: "black",
    center: new google.maps.LatLng(40.69847032728747, -73.9514422416687) // NYC
}

$( "#select_gf_page" ).on("click", function(){
    window.location.replace("gf.html")
});

$( "#select_hm_page" ).on("click", function(){
    window.location.replace("hm.html")
});
