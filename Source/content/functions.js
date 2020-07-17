function getWeather() {
    if (apikey != "") {
        var xhr = new XMLHttpRequest
        var xhr2 = new XMLHttpRequest
        var unit, cityRequest

        if(tempUnit == "°C") unit = "metric"
        else if(tempUnit == "°F") unit = "imperial"
        if(city.replace(/^[0-9]+$/, '') == "")  cityRequest = "id=" + city
        else cityRequest = "q=" + city

        xhr.open('GET', 'http://api.openweathermap.org/data/2.5/weather?' + cityRequest + '&units=' + unit + '&APPID=' + apikey + '&lang=' + local.replace(/[\_].*$/, ''), true);
        xhr.setRequestHeader("Content-type", "application/json")
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) { 
                var response = JSON.parse(xhr.responseText);
                weatherResponse = response;

                xhr2.open('GET', 'http://api.openweathermap.org/data/2.5/onecall?lat=' + response["coord"]["lat"] + '&lon=' + response["coord"]["lon"] + '&units=' + unit + '&APPID=' + apikey + '&lang=' + local.replace(/[\_].*$/, ''), true);
                xhr2.setRequestHeader("Content-type", "application/json")
                xhr2.onreadystatechange = function () {
                    if (xhr2.readyState === 4 && xhr2.status === 200) weatherResponseOnecall = JSON.parse(xhr2.responseText);
                }
                xhr2.send()
            }
        }
        xhr.send()
    }
}

function updateLightsStatus(data) {
    any_on = false
    config["groups"] = data["groups"];
    config["lights"] = data["lights"];
    if (data["groups"] && data["groups"].length !== 0) {
        groupsModel.clear()
        for (var group in data["groups"]) {
            if (data["groups"][group]["name"].substring(0, 18) !== "Entertainment area") {
                groupsModel.append({
                                       groupId: group,
                                       name: data["groups"][group]["name"],
                                       on: data["groups"][group]["state"]["any_on"],
                                       bri: data["groups"][group]["action"]["bri"],
                                       colormode: data["groups"][group]["action"]["colormode"],
                                       ct: data["groups"][group]["action"]["ct"],
                                       xy: data["groups"][group]["action"]["xy"]
                                   })
                if (data["groups"][group]["state"]["any_on"]) any_on = true;
            }
        }
    }
    if (data["scenes"] && data["scenes"].length !== 0) {
        for (var scene in data["scenes"]) {
            for (var i in data["groups"]) {
                if (data["groups"][i]["lights"].indexOf(data["scenes"][scene]["lights"][0]) > -1) {
                    if (config["scenes"][i] == null) config["scenes"][i] = {}; //@disable-check M126
                    config["scenes"][i][scene] = data["scenes"][scene]["name"];
                }
            }
        }
    }
}

function noCallback() {}

function cieToRGB(x, y, brightness)
{
    //Set to maximum brightness if no custom value was given (Not the slick ECMAScript 6 way for compatibility reasons)
    if (brightness === undefined) {
        brightness = 254;
    }

    var z = 1.0 - x - y;
    var Y = (brightness / 254).toFixed(2);
    var X = (Y / y) * x;
    var Z = (Y / y) * z;

    //Convert to RGB using Wide RGB D65 conversion
    var red 	=  X * 1.656492 - Y * 0.354851 - Z * 0.255038;
    var green 	= -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
    var blue 	=  X * 0.051713 - Y * 0.121364 + Z * 1.011530;

    //If red, green or blue is larger than 1.0 set it back to the maximum of 1.0
    if (red > blue && red > green && red > 1.0) {

        green = green / red;
        blue = blue / red;
        red = 1.0;
    }
    else if (green > blue && green > red && green > 1.0) {

        red = red / green;
        blue = blue / green;
        green = 1.0;
    }
    else if (blue > red && blue > green && blue > 1.0) {

        red = red / blue;
        green = green / blue;
        blue = 1.0;
    }

    //Reverse gamma correction
    red 	= red <= 0.0031308 ? 12.92 * red : (1.0 + 0.055) * Math.pow(red, (1.0 / 2.4)) - 0.055;
    green 	= green <= 0.0031308 ? 12.92 * green : (1.0 + 0.055) * Math.pow(green, (1.0 / 2.4)) - 0.055;
    blue 	= blue <= 0.0031308 ? 12.92 * blue : (1.0 + 0.055) * Math.pow(blue, (1.0 / 2.4)) - 0.055;


    //Convert normalized decimal to decimal
    red 	= Math.round(red * 255);
    green 	= Math.round(green * 255);
    blue 	= Math.round(blue * 255);

    if (isNaN(red))
        red = 0;

    if (isNaN(green))
        green = 0;

    if (isNaN(blue))
        blue = 0;

    var decColor =0x1000000+ blue + 0x100 * green + 0x10000 *red ;
    return '#'+decColor.toString(16).substr(1);
}



function colorTemperatureToRGB(mireds){

    var hectemp = 20000.0 / mireds;

    var red, green, blue;

    if( hectemp <= 66 ){

        red = 255;
        green = 99.4708025861 * Math.log(hectemp) - 161.1195681661;
        blue = hectemp <= 19 ? 0 : (138.5177312231 * Math.log(hectemp - 10) - 305.0447927307);


    } else {

        red = 329.698727446 * Math.pow(hectemp - 60, -0.1332047592);
        green = 288.1221695283 * Math.pow(hectemp - 60, -0.0755148492);
        blue = 255;

    }

    red = red > 255 ? 255 : red;
    green = green > 255 ? 255 : green;
    blue = blue > 255 ? 255 : blue;


    var decColor =0x1000000+ parseInt(blue, 10) + 0x100 * parseInt(green, 10) + 0x10000 * parseInt(red, 10) ;
    return '#'+decColor.toString(16).substr(1);


}

function rgb_to_cie(red, green, blue)
{
    //Apply a gamma correction to the RGB values, which makes the color more vivid and more the like the color displayed on the screen of your device
    var red 	= (red > 0.04045) ? Math.pow((red + 0.055) / (1.0 + 0.055), 2.4) : (red / 12.92); //@disable-check M103
    var green 	= (green > 0.04045) ? Math.pow((green + 0.055) / (1.0 + 0.055), 2.4) : (green / 12.92); //@disable-check M103
    var blue 	= (blue > 0.04045) ? Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4) : (blue / 12.92); //@disable-check M103

    //RGB values to XYZ using the Wide RGB D65 conversion formula
    var X 		= red * 0.664511 + green * 0.154324 + blue * 0.162028;
    var Y 		= red * 0.283881 + green * 0.668433 + blue * 0.047685;
    var Z 		= red * 0.000088 + green * 0.072310 + blue * 0.986039;

    //Calculate the xy values from the XYZ values
    var x 		= (X / (X + Y + Z)).toFixed(4);
    var y 		= (Y / (X + Y + Z)).toFixed(4);

    if (isNaN(x))
        x = 0;

    if (isNaN(y))
        y = 0;


    return [parseFloat(x), parseFloat(y)];
}
