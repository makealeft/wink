$(function () {
    var extractCode = function (hash) {
        var match = hash.match(/code=([\w-]+)/);
        return !!match && match[1];
    };

    var CLIENT_ID = "czQaHiLqoM8UYb_NNuHI_bMkSFrSpqiH";
    var CLIENT_SECRET = "bv6ogRs8IbejwcFgiCy-l3CWBxO3rIfP";    
    var API_ENDPOINT = "https://api.wink.com/";
    var AUTHORIZATION_ENDPOINT = API_ENDPOINT + "oauth2/authorize";
    var TOKEN_ENDPOINT = API_ENDPOINT + "oauth2/token";
    var DEVICES_ENDPOINT = API_ENDPOINT+ "users/me/wink_devices";
    
    var HOMEPAGE = "http://www.micallef.ca/Wink/";    


    var getCookie = function (name) {
        var match = document.cookie.match(new RegExp(name + '=([^;]+)'));
        if (match) return match[1];
        return null;
    };

    var accessToken = getCookie("accessToken");
    var code = extractCode(document.location.href);
    if (code || accessToken) {
        $('div.authenticated').show();

        $('span.code').text(code);

        var getToken = function () {

            return $.ajax({
                type: "POST",
                url: TOKEN_ENDPOINT,
                data: {
                    "client_secret": CLIENT_SECRET,
                    "grant_type": "authorization_code",
                    "code": code
                },
                success: function (response) {
                    var container = $('span.token');
                    if (response) {
                        document.cookie = "accessToken=" + response.access_token + "; expires=" + new Date(Date.now() + 24 * 60 * 60 * 1000) + ";";
                        document.cookie = "refreshToken=" + response.refresh_token + "; expires=" + new Date(Date.now() + 24 * 60 * 60 * 1000) + ";";
                        container.text(response.access_token);
                    } else {
                        container.text("An error occurred.");
                    }
                }
            }).fail(function (response) {

            });
        };

        var getDevices = function (accessToken) {
            $.ajax({
                type: "GET",
                url: DEVICES_ENDPOINT,
                headers: {
                    'Authorization': 'bearer ' + accessToken
                },
                success: function (response) {
                    var devices = response.data.sort(function (a, b) {
                        if (a.device_manufacturer < b.device_manufacturer) {
                            return -1;
                        } else if (a.device_manufacturer > b.device_manufacturer) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });
                    ko.applyBindings({ devices: devices }, $("#devices")[0]);

                    $(".powered").click(function (eventData) {
                        var device = ko.contextFor(eventData.currentTarget).$parent;
                        if (device.light_bulb_id || device.binary_switch_id) {

                            var deviceType = device.light_bulb_id ? "light_bulbs" : "binary_switches";
                            var id = device.light_bulb_id | device.binary_switch_id;

                            $.ajax({
                                type: "PUT",
                                url: API_ENDPOINT + deviceType + "/" + id + "/desired_state",
                                headers: {
                                    'Authorization': 'bearer ' + accessToken
                                },
                                data: {
                                    desired_state: {
                                        powered: !device.last_reading.powered
                                    }
                                },
                                success: function () {
                                    device.last_reading.powered = !device.last_reading.powered;
                                    $(eventData.currentTarget).text(device.last_reading.powered);
                                }
                            });
                        }
                    });
                }
            });
        };
        
        
        if (accessToken == null) {
            var tokenDef = getToken();
            tokenDef.done(function () {
                accessToken = getCookie("accessToken");
                getDevices(accessToken);
            });
        } else {
            var container = $('span.token');
            container.text(accessToken);
            getDevices(accessToken);
        }

    }

    if (!code) {
        $("#codeSection").hide();
    }

    $('div.authenticate').show();

    var authUrl = AUTHORIZATION_ENDPOINT +
        "?response_type=code" +
        "&client_id=" + CLIENT_ID +
        "&redirect_uri=" + HOMEPAGE +
        "&state=asdfasdfasjkljh234234234";

    $("a.connect").attr("href", authUrl);
    
});