'use strict';

var placesData = [{
        name: 'Bracher Park',
        lat: 37.370,
        long: -122.002
    }, {
        name: 'Hacker Dojo (old)',
        lat: 37.402,
        long: -122.052
    }
];
var map;
// Foursquare API key
var FOUR_SQUARE_CLIENT_ID = "N32GTWX5LEQ3PTOVSNDUXBYWNFTZ0XU1JZVO0PH4S1N2I1J2";
var FOUR_SQUARE_CLIENT_SECRET = "KHYOMOGTGTRVMA1ZIRYBAC1XM5CON3NGZVAXRKR4USQMFDQ3";

var Place = function(placeData) {
    var self = this;

    self.name = placeData.name;
    self.lat = placeData.lat;
    self.long = placeData.long;
    self.address = "";
    self.country = "";
    self.visible = ko.observable(true);

    var foursquareURL = 'https://api.foursquare.com/v2/venues/search?ll=' + self.lat + ',' + self.long + '&client_id=' + FOUR_SQUARE_CLIENT_ID + '&client_secret=' + FOUR_SQUARE_CLIENT_SECRET + '&v=20170901' + '&query=' + self.name;

    $.getJSON(foursquareURL).done(function(data) {
        var results = data.response.venues[0];
        self.address = results.location.formattedAddress[0];
        self.country = results.location.formattedAddress[1];
    }).fail(function() {
        alert("Error while calling foursquare API...");
    });

    self.marker = new google.maps.Marker({
        position: new google.maps.LatLng(placeData.lat, placeData.long),
        map: map,
        title: placeData.name
    });

    self.marker.addListener('click', function() {
        var infoHtml =
            '<div class="info-window">' +
            '<div class="name"><b>' + self.name + '</b></div>' +
            '<div class="address">' + self.address + '</div>' +
            '<div class="country">' + self.country + '</div>' +
            '</div>';

        var infoWindow = new google.maps.InfoWindow({
            content: infoHtml
        });
        infoWindow.open(map, this);

        self.marker.setAnimation(google.maps.Animation.BOUNCE);

        setTimeout(function() {
            self.marker.setAnimation(null);
        }, 2000);
    });

    self.showMarker = ko.computed(function() {
        if (this.visible()) {
            this.marker.setMap(map);
        } else {
            this.marker.setMap(null);
        }
        return true;
    }, this);
};

function AppViewModel() {
    var self = this;

    self.keyword = ko.observable("");
    self.places = ko.observableArray([]);
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: {
            lat: 37.370,
            lng: -122.002
        }
    });

    placesData.forEach(function(placeData) {
        self.places.push(new Place(placeData));
    });

    self.filteredPlaces = ko.computed(function() {
        var filter = self.keyword().toLowerCase();
        if (!filter) {
            self.places().forEach(function(place) {
                place.visible(true);
            });
            return self.places();
        } else {
            return ko.utils.arrayFilter(self.places(), function(place) {
                var placeIsVisible = place.name.toLowerCase().indexOf(filter) !== -1;
                place.visible(placeIsVisible);
                return placeIsVisible;
            });
        }
    }, self);
}

function initMap() {
    ko.applyBindings(new AppViewModel());
}