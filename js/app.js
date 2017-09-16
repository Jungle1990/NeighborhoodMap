// Global variables.
var map;
var FOUR_SQUARE_CLIENT_ID = "N32GTWX5LEQ3PTOVSNDUXBYWNFTZ0XU1JZVO0PH4S1N2I1J2";
var FOUR_SQUARE_CLIENT_SECRET = "KHYOMOGTGTRVMA1ZIRYBAC1XM5CON3NGZVAXRKR4USQMFDQ3";

// Place model.
var PlaceModel = function(name, lat, lng) {
    var self = this;

    self.name = name;
    self.lat = lat;
    self.lng = lng;
    self.address = ko.observable("");
    self.country = ko.observable("");
    self.visible = ko.observable(true);
    self.marker = ko.observable(null);
};

// Initialize google map.
var GetMap = function() {
    return new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: {
            lat: 34.026559,
            lng: -118.276675
        }
    });
};

// Set up name, lat, lng for all places.
var GetPlacesData = function() {
    return ko.observableArray([
        new PlaceModel("Grinder", 34.026559, -118.276675),
        new PlaceModel("Joan And Sisters Belizean Restaurant", 34.020780, -118.308982),
        new PlaceModel("Moreton Fig", 34.020227, -118.285859),
        new PlaceModel("El Parian Restaurant", 34.043843, -118.275902),
        new PlaceModel("Figueroa Philly Cheese Steak", 34.014465, -118.282339),
        new PlaceModel("Jesse's Camarones Restaurant", 34.032818, -118.293755),
        new PlaceModel("Salad Farm", 34.031467, -118.273928)
    ]);
};

// Set up address and country for all places.
var SetPlaceDesc = function(places) {
    ko.utils.arrayForEach(places(), function(place) {
        // Call four square API parsing lat and lng to get "address" and "country" of the place.
        var foursquareURL = 'https://api.foursquare.com/v2/venues/search?ll=' + place.lat + ',' + place.lng + '&client_id=' + FOUR_SQUARE_CLIENT_ID + '&client_secret=' + FOUR_SQUARE_CLIENT_SECRET + '&v=20170901' + '&query=' + place.name;

        $.getJSON(foursquareURL).done(function(data) {
            var address = data.response.venues[0].location.formattedAddress[0];
            var country = data.response.venues[0].location.formattedAddress[1];
            address = address ? address : "";
            country = country ? country : "";
            place.address(address);
            place.country(country);
        }).fail(function() {
            alert("Error while calling foursquare API for place \"" + place.name + "\"...");
        });
    });
};

// Click event handler.
var ClickMarkerHandler = function(place) {
    var infoHtml =
        '<div class="info-window">' +
        '<div class="name"><b>' + place.name + '</b></div>' +
        '<div class="address">' + place.address() + '</div>' +
        '<div class="country">' + place.country() + '</div>' +
        '</div>';

    var infoWindow = new google.maps.InfoWindow({
        content: infoHtml
    });
    infoWindow.open(map, place.marker());

    place.marker().setAnimation(google.maps.Animation.BOUNCE);

    setTimeout(function() {
        place.marker().setAnimation(null);
    }, 2000);
};

// Set up markers for all places.
var SetPlaceMarker = function(places) {
    ko.utils.arrayForEach(places(), function(place) {
        // Add marker.
        place.marker(new google.maps.Marker({
            position: new google.maps.LatLng(place.lat, place.lng),
            map: map,
            title: place.name
        }));

        // Add click listener to show pop up window.
        place.marker().addListener('click', function() {
            ClickMarkerHandler(place);
        });

        // Use the 'visible' protery to decide whether to show the marker.
        ko.computed(function() {
            if (place.visible()) {
                place.marker().setMap(map);
            } else {
                place.marker().setMap(null);
            }
        }, this);
    });
};

// Get all visible places.
var GetVisiblePlaces = function(places) {
    return ko.computed(function() {
        return ko.utils.arrayFilter(places(), function(place) {
            return place.visible();
        });
    }, this);
};

/*
    Change visible status of place by filter.
    If name of palce matches the filter, set the place visible, else set it invisible.
*/
var EnableFilter = function(filter, places) {
    ko.computed(function() {
        var filterStr = filter().toLowerCase();
        if (!filterStr) {
            // If "filterStr" is null or emtpy, set all places visible.
            ko.utils.arrayForEach(places(), function(place) {
                place.visible(true);
            });
        } else {
            ko.utils.arrayForEach(places(), function(place) {
                place.visible(place.name.toLowerCase().indexOf(filterStr) !== -1);
            });
        }
    }, this);
};

// Get click place handler.
var GetClickPlaceHandler = function() {
    return function(place) {
        ClickMarkerHandler(place);
    };
};

// Handle error if google map script fails to load.
var initMapError = function() {
    alert("Error while loading Google Map...");
};

// This contains the main functionality of the neighborhood map application.
function AppViewModel() {
    var self = this;

    // 1. Initialize google map.
    map = GetMap();

    // 2.1. Set up initial places' data, including name, lat and lng.
    self.allPlaces = GetPlacesData();
    // 2.2. Query places' description (address, country) using four square API.
    SetPlaceDesc(self.allPlaces);
    // 3.3. Add markers to places, and bind a click event to it to show information window.
    SetPlaceMarker(self.allPlaces);

    // 3.1. Define search string to filter places.
    self.filter = ko.observable("");
    // 3.2. Enable to filter places by name.
    EnableFilter(self.filter, self.allPlaces);

    // 4. Bind click event to the list of places.
    self.clickPlaceHandler = GetClickPlaceHandler();

    // 5. Get all visible places.
    self.filteredPlaces = GetVisiblePlaces(self.allPlaces);
}

/*
    This is the call back function of google map API.
    It's a good place for knock out framwork to launch the whole application.
*/
function initMap() {
    ko.applyBindings(new AppViewModel());
}
