/*
    Variable "placesData" is an array of placeData items, each placeData is a dictionary which contains 3 properties: name, latitude and longitude.
    How to get these places' information:
    1. Search "Los Angels" in Google Map
    2. Click "NearyBy" in the search result and choose "Restaurants", which will show nearby restaurants in the map
    3. Right click the restaurant shown in the map and go to the "What's here?" to get the latitude and longitude in the popup information window
    4. Repteat steps 1,2,3 to get 7 placeData items listed below
*/
var placesData = [{
        name: 'Grinder',
        lat: 34.026559,
        lng: -118.276675
    }, {
        name: 'Joan And Sisters Belizean Restaurant',
        lat: 34.020780,
        lng: -118.308982
    }, {
        name: 'Moreton Fig',
        lat: 34.020227,
        lng: -118.285859
    }, {
        name: 'El Parian Restaurant',
        lat: 34.043843,
        lng: -118.275902
    }, {
        name: 'Figueroa Philly Cheese Steak',
        lat: 34.014465,
        lng: -118.282339
    }, {
        name: "Jesse's Camarones Restaurant",
        lat: 34.032818,
        lng: -118.293755
    }, {
        name: 'Salad Farm',
        lat: 34.031467,
        lng: -118.273928
    }
];

/*
    Variable "map" is used to create google map instance.
    Google's developer's site provides how to use Google Map API.
    Here is link I used to initialize google map, "https://developers.google.com/maps/documentation/javascript/adding-a-google-map".
*/
var map;
/*
    Client id and client secret are used to call four square API.
    Four square's developer page guides to generate above values.
    Here is the link I used "https://developer.foursquare.com/", click "Create New App" and follow the instructions to create the client id and client secret.
*/
var FOUR_SQUARE_CLIENT_ID = "N32GTWX5LEQ3PTOVSNDUXBYWNFTZ0XU1JZVO0PH4S1N2I1J2";
var FOUR_SQUARE_CLIENT_SECRET = "KHYOMOGTGTRVMA1ZIRYBAC1XM5CON3NGZVAXRKR4USQMFDQ3";

/*
    Class "Place" is kind of a wrapper to encapsulate place information.
    It will read the latitude and longitude of the 'placeData' and query details of that place using four square API.
    It also adds google map marker to the place, and binds a click event to the marker.
*/
var Place = function(placeData) {
    /*
        It's good to assign "this" to "self" here, it will make sure anywhere you use "self" in future, it means the scope of current function.
        Otherwise, it's a little bit easier to make mistake when you use "this" in another function which is inside current function,
        as "this" in the inner function means the inner scope of that function instead of the scope of the outer function.
    */
    var self = this;

    // Just asign the "name", "latitude" and "longitude" of "placeData" to the instance of class "Place"
    self.name = placeData.name;
    self.lat = placeData.lat;
    self.lng = placeData.lng;
    // Keep the "address" and "country" empty here, as they will be given values when calling four square API.
    self.address = "";
    self.country = "";
    /*
        Variable "visible" is used to decide whether the place should be shown in this neighborhood map application.
        Make it observale here so that anywhere it's being used can be notified when it's value is changed.
    */
    self.visible = ko.observable(true);

    /*
        Call four square API parsing latitude and longitude to get "address" and "country" of the place.
        Here is the four square's developer documentation "https://developer.foursquare.com/docs/venues/search" to demo how to use this API.
    */
    var foursquareURL = 'https://api.foursquare.com/v2/venues/search?ll=' + self.lat + ',' + self.lng + '&client_id=' + FOUR_SQUARE_CLIENT_ID + '&client_secret=' + FOUR_SQUARE_CLIENT_SECRET + '&v=20170901' + '&query=' + self.name;

    /*
        Use JQuery's getJSON method to call four square API.
        Here is the official documentation about how to use JQuery's getJSON method "http://api.jquery.com/jquery.getjson/".
    */
    $.getJSON(foursquareURL).done(function(data) {
        var results = data.response.venues[0];
        self.address = results.location.formattedAddress[0];
        self.country = results.location.formattedAddress[1];
    }).fail(function() {
        alert("Error while calling foursquare API...");
    });

    /*
        Use Google Map API to add a marker to the place.
        Google Map developer's documentation demos how to create a marker for a place, "https://developers.google.com/maps/documentation/javascript/markers#add".
    */
    self.marker = new google.maps.Marker({
        position: new google.maps.LatLng(placeData.lat, placeData.lng),
        map: map,
        title: placeData.name
    });

    /*
        Add a InfoWindow to the maker.
        Google Map developer's documentation demos how to add a information window to the maker, "https://developers.google.com/maps/documentation/javascript/infowindows#open".
    */
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

        // See the official documentation here to add an animation to the marker, "https://developers.google.com/maps/documentation/javascript/markers#animate".
        self.marker.setAnimation(google.maps.Animation.BOUNCE);

        // Stop the animation after 2 seconds. Documentation for setTimeOut "https://www.w3schools.com/jsref/met_win_settimeout.asp".
        setTimeout(function() {
            self.marker.setAnimation(null);
        }, 2000);
    });

    /*
        Variable "showMarker" is used to switch the marker between visible or invisible.
        Use computed observable here as observable variable 'visible' is used to decide whether to show the marker.
    */
    self.showMarker = ko.computed(function() {
        if (this.visible()) {
            this.marker.setMap(map);
        } else {
            this.marker.setMap(null);
        }
        return true;
    }, this);
};

/*
    This contains the main functionality of the neighborhood map application.
    Knockout Documentation "http://learn.knockoutjs.com/#/?tutorial=intro" demos how to setup the basic code to run the application.
*/
function AppViewModel() {
    var self = this;

    /*
        Variable "keyword" is what user inputs in the search box.
        The default value is set to empty string so that the neighborhood application will show all palces defined in "placesData".
        Make 'keyword' observable as the application needs to be notified (to filter places based on keyword) when it's changed.
    */
    self.keyword = ko.observable("");
    // Variable "places" should be observable array, as the application needs to be notified when a place is added to or removed from this array.
    self.places = ko.observableArray([]);
    /*
        Just follow the instruction provided by Google Map documentation to initialize the map.
        Here is the official link "https://developers.google.com/maps/documentation/javascript/adding-a-google-map".
    */
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: {
            lat: 34.026559,
            lng: -118.276675
        }
    });

    /*
        Manipulate all places from 'placesData' and added them to knockout's observale array 'places' one by one.
        For each of the palce, call the initializer of class 'Place' to retrive the details and add click listener to the marker created for that place.
    */
    placesData.forEach(function(placeData) {
        self.places.push(new Place(placeData));
    });

    /*
        Get the visible places that will be shown in the map.
        If the 'keyword' it uses to search places is empty, all places should be shown.
        Otherwise, filter places by name using the "keyword".
    */
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

/*
    This is the call back function of google map API as documented here "https://developers.google.com/maps/documentation/javascript/adding-a-google-map".
    It's a good place for knock out framwork to launch the whole application.
*/
function initMap() {
    ko.applyBindings(new AppViewModel());
}