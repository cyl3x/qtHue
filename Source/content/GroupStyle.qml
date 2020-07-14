import QtQuick 2.0
import QtQuick.Controls 2.4
import QtGraphicalEffects 1.0
import "functions.js" as Functions



Item {
    id: groupsDelegate
    width: parent.width
    height: parent.height

    Rectangle {
        width: 450
        height: 80
        //color: "white"
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.topMargin: 5
        anchors.leftMargin: 5
        radius: 5
        gradient: Gradient {
            GradientStop {
                position: 0.0
                color: "#fcfcfc"
            }
            GradientStop {
                position: 1.0
                color: "#c6c6c6"
            }
        }
        Image {
            id: bulb
            anchors.top: parent.top
            anchors.left: parent.left
            anchors.leftMargin: 10
            anchors.topMargin: 7
            source: "/content/images/bulb.png"
            Canvas {
                id: bulb_light
                anchors.left: parent.left
                anchors.right: parent.right
                anchors.top: parent.top
                height: 21
                opacity: 0.7
                visible: false
                onPaint: {
                    var ctx = getContext("2d");
                    ctx.reset();
                    ctx.rect(0, 0, width, height);
                    var gradient = ctx.createLinearGradient(0, 21, 40, 0);
                    var step_level = 0, current_level= 0;
                    if (config["groups"][groupId]["lights"].length > 1) {
                        step_level = 1.0 / (config["groups"][groupId]["lights"].length - 1);
                    } else {
                        step_level = 1
                    }
                    for (var i = 0; i < config["groups"][groupId]["lights"].length; i++) {
                        if (config["lights"][config["groups"][groupId]["lights"][i]]["state"]["on"]) {
                            if ("colormode" in config["lights"][config["groups"][groupId]["lights"][i]]["state"]) {
                                if (config["lights"][config["groups"][groupId]["lights"][i]]["state"]["colormode"] === "xy") {

                                    gradient.addColorStop(current_level, Functions.cieToRGB(config["lights"][config["groups"][groupId]["lights"][i]]["state"]["xy"][0], config["lights"][config["groups"][groupId]["lights"][i]]["state"]["xy"][1], 250))
                                } else if (config["lights"][config["groups"][groupId]["lights"][i]]["state"]["colormode"] === "ct") {
                                    gradient.addColorStop(current_level, Functions.colorTemperatureToRGB(config["lights"][config["groups"][groupId]["lights"][i]]["state"]["ct"]))
                                }
                            } else {
                                gradient.addColorStop(current_level, "#fff9aa")
                            }
                        } else {
                            gradient.addColorStop(current_level, "#333333")
                        }

                        current_level += step_level
                    }
                    ctx.fillStyle = gradient;
                    ctx.fill();
                    ctx.restore();
                }
            }

            Image {
                id: bulb_mask
                anchors.top: parent.top
                anchors.left: parent.left
                source: "/content/images/bulb_head.png"
                visible: false

            }
            OpacityMask {
                anchors.fill: bulb_light
                source: bulb_light
                maskSource: bulb_mask
            }
            MouseArea{
                anchors.fill: parent
                onClicked: {
                    color.state = "OPEN"
                    scenesModel.clear();
                    for (var key in config["scenes"][groupId]) {
                        scenesModel.append({
                                               scene: key,
                                               name: config["scenes"][groupId][key]})
                        color.selected_id = groupId;
                    }
                }
            }
        }

        Text {
            id: text_nume
            text: name
            width: 200
            anchors.top: parent.top
            anchors.left: bulb.right
            anchors.leftMargin: 10
            anchors.topMargin: 5
            color: "#254757"
            font.pixelSize: 24
            font.family: "Tahoma"
            renderType: Text.NativeRendering
            wrapMode: Text.Wrap
        }

        Switch {
            id: switch_state
            anchors.bottom: parent.bottom
            anchors.bottomMargin: 12
            anchors.top: parent.top
            anchors.topMargin: 12
            anchors.right: parent.right
            anchors.rightMargin: 15
            checked: on
            indicator: Rectangle {
                implicitWidth: 100
                implicitHeight: 55
                x: switch_state.leftPadding
                y: parent.height / 2 - height / 2
                radius: 5
                color: switch_state.checked ? "#468bb7" : "#222"
                border.color: switch_state.checked ? "#468bb7" : "#cccccc"
                Text {
                    font.pixelSize: 18
                    color: "white"
                    width: parent.width / 2
                    height: parent.height
                    anchors.left: parent.left
                    verticalAlignment: Text.AlignVCenter
                    horizontalAlignment: Text.AlignHCenter
                    text: "ON"
                }
                Text {
                    font.pixelSize: 18
                    color: "white"
                    width: parent.width / 2
                    height: parent.height
                    anchors.right: parent.right
                    verticalAlignment: Text.AlignVCenter
                    horizontalAlignment: Text.AlignHCenter
                    text: "OFF"
                }
                Rectangle {
                    x: switch_state.checked ? parent.width - width : 0
                    width: 50
                    height: 55
                    radius: 5
                    color: switch_state.down ? "#cccccc" : "#ffffff"
                    border.color: switch_state.checked ? (switch_state.down ? "#468bb7" : "#248DB7") : "#999999"
                }
            }

            onClicked: {
                for (var i = 0; i < config["groups"][groupId]["lights"].length; i++) {
                    config["lights"][config["groups"][groupId]["lights"][i]]["state"]["on"] = on
                    bulb_light.requestPaint();
                }

                pyconn('PUT', '/groups/' + groupId + '/action', {
                           on: switch_state.checked
                       }, Functions.noCallback)
            }
        }
        Slider {
            id: slider_bri
            anchors.bottom: parent.bottom
            anchors.left: bulb.right
            anchors.leftMargin: 10
            anchors.bottomMargin: -3
            handle: Rectangle {
                x: slider_bri.leftPadding + slider_bri.visualPosition * (slider_bri.availableWidth - width)
                y: slider_bri.topPadding + slider_bri.availableHeight / 2 - height / 2
                implicitWidth: 30
                implicitHeight: 30
                radius: height
                color: Qt.lighter(switch_state.checked ? "#468bb7" : "#444", 1.2)
                border.color: "#bdbebf"
                antialiasing: true
            }
            background: Rectangle {
                x: slider_bri.leftPadding
                y: slider_bri.topPadding + slider_bri.availableHeight / 2 - height / 2
                implicitHeight: 5
                implicitWidth: 240
                width: slider_bri.availableWidth
                height: implicitHeight
                radius: 2
                color: "#444"

                Rectangle {
                    width: slider_bri.visualPosition * parent.width
                    height: parent.height
                    color: switch_state.checked ? "#468bb7" : "#444"
                    radius: 2
                }
            }
            value: bri
            from: 1
            to: 255
            enabled: switch_state.checked
//            updateValueWhileDragging: false
            onValueChanged: {
                if (value !== bri) {
                    pyconn('PUT', '/groups/' + groupId + '/action', {
                                         bri: parseInt(value, 10)
                                     }, Functions.noCallback)
                }
            }
        }
    }
}

