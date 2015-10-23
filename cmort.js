/**
 * Created by Sherif on 9/16/15.
 */

var ref = {};                           // Holds indicators' names, long definition and source
var indicators = loadIndicators();      // Holds the indicators' values per country
var cor = [];                           // Holds correlations of each indicator with child mortality
var nullCor = [];                       // Holds the indicators with no data (consequently no correlations computed)
var mapObject;                          // The map object displaying child mortality as color fill, indicators as markers
var selectedIndex = "";                 // The selected indicator from the chart to be displayed on the map as markers

// Load the indicators from the dataInd JSON
function loadIndicators() {
    var ind = [];

    for (var i = 0; i < dataInd.length; i++) {
        ind[dataInd[i]['Indicator']] = {};
        for (var j = 0; j < dataCnt.length; j++) {
            var country_code = dataCnt[j]['2 Letter Code'];
            ind[dataInd[i]['Indicator']][country_code] = dataInd[i][country_code];
        }
    }

    ind['coords'] = {};
    ind['Country Name'] = {};
    for (var k = 0; k < dataCnt.length; k++) {
        var country_code = dataCnt[k]['2 Letter Code'];
        ind['coords'][country_code] = [dataCnt[k]['lat'], dataCnt[k]['long']];
        ind['Country Name'][country_code] = dataCnt[k]['Country Name'];
    }

    return ind;
}

// Load correlations from the dataCor JSON, also loads the indicator metadata from dataCode into ref
function loadCorrelations() {
    for (var i = 0; i < dataCor.length; i++) {
        if (dataCor[i]['Correlation'] == 'NULL') {
            nullCor.push(dataCor[i]['Indicator']);
        }
        else {
            cor[dataCor[i]['Indicator']] = dataCor[i]['Correlation'];
        }

        //Load indicator data
        ref[dataCor[i]['Indicator']] = {
            name: dataCode[0][dataCor[i]['Indicator']],
            definition: dataCode[1][dataCor[i]['Indicator']],
            source: dataCode[2][dataCor[i]['Indicator']]
        };
    }
}

// Populate the map, color filled with child mortality values
function displayMap() {

    $('#world-map').vectorMap({
        map: 'world_mill_en',
        backgroundColor: '#FFFFFF',
        //markers: indicators['coords'],
        series: {
            markers: [{
                attribute: 'fill',
                scale: ['#FEFFD6', '#FCFF51'],
            }, {
                attribute: 'r',
                scale: [1, 15]
            }],
            regions: [{
                scale: ['#C1C1E9', '#5959B7'],
                attribute: 'fill',
                values: indicators['Child Mortality'],
            }]
        },
        markerStyle: {
            initial: {
                stroke: '#505050',
                "fill-opacity": 0.7,
                "stroke-width": 1,
            },
            hover: {
                stroke: 'black',
                "stroke-width": 1,
                "fill-opacity": 1,
            }
        },
        onMarkerTipShow: function (event, label, code) {
            if (indicators['Country Name'][code]) {
                label.html('<b>' + indicators['Country Name'][code] + '</b></br>Child Mortality: ' + indicators['Child Mortality'][code] +
                    '</br>' + ref[selectedIndex]['name'] + ': ' + Number(indicators[selectedIndex][code]).toFixed(2)
                );
            }
        },
        onRegionTipShow: function (event, label, code) {
            if (indicators['Country Name'][code]) {
                label.html('<b>' + indicators['Country Name'][code] + '</b></br>Child Mortality: ' + indicators['Child Mortality'][code]);
            }
        }
    });

    mapObject = $('#world-map').vectorMap('get', 'mapObject');
}

// Populate the chart of correlations
function displayChart() {
// Get the context of the canvas element we want to select
    var ctx = document.getElementById("myChart").getContext("2d");

    loadCorrelations();

    var data = {
        labels: Object.keys(cor).map(function (k) {
            return k + '<br/>Indicator Name: ' + ref[k]['name']
        }),
        datasets: [
            {
                label: "Correlations with Child Mortality",
                fillColor: "rgba(89,89,183,0.4)",
                strokeColor: "rgba(89,89,183,0.1)",
                highlightFill: "rgba(89,89,183,0.4)",
                highlightStroke: "rgba(89,89,183,0.1)",
                data: Object.keys(cor).map(function (k) {
                    return cor[k]
                })
            }
        ]
    };


    var options = {

        //Boolean - Whether grid lines are shown across the chart
        scaleShowGridLines: false,

        //Boolean - Whether to show horizontal lines (except X axis)
        scaleShowHorizontalLines: false,

        //Boolean - Whether to show vertical lines (except Y axis)
        scaleShowVerticalLines: false,

        //Boolean - If there is a stroke on each bar
        barShowStroke: false,

        //Number - Pixel width of the bar stroke
        barStrokeWidth: 1,

        barValueSpacing: 0,

        //Number - Spacing between each of the X value sets
        barValueSpacing: 0,

        //Number - Spacing between data sets within X values
        barDatasetSpacing: 0,

        showXLabels: 0,
        yAxisMinimumInterval: 1,
        annotateDisplay: true,
        annotateLabel: 'Indicator Code: <%=v2%><br/>Correlation: <%=v3%>',
        mouseDownLeft: updateMap,
        annotateFontSize: 10,
    };

    var myBarChart = new Chart(ctx).Bar(data, options);

    /*
     //For OLD CHART:
     document.getElementById("myChart").onclick = function (evt) {
     var activeBars = myBarChart.getBarsAtEvent(evt);
     // => activeBars is an array of bars on the canvas that are at the same position as the click event.

     if (activeBars.length > 0) {
     updateMap(activeBars[0].label);
     }
     else {
     updateMap("");
     }
     };*/
}

// Update the map markers with the selected indicator. Called when an indicator is selected through mouse click on the chart
function updateMap(event, ctx, config, data, other) {
    //console.log(other);

    if (other == null) {
        mapObject.removeAllMarkers();
        mapObject.scale = mapObject.baseScale;
        mapObject.transX = mapObject.baseTransX;
        mapObject.transY = mapObject.baseTransY;
        mapObject.applyTransform();
        document.getElementById("indicatorText").innerHTML = "";

    } else {
        var ind = other.v2.substring(0, other.v2.indexOf('<br/>'));

        selectedIndex = ind;
        mapObject.removeAllMarkers();

        var markers = indicators['coords'];
        var seriesData = [indicators[ind], indicators[ind]];

        var arr = Object.keys(indicators[ind]).map(function (k) {
            return indicators[ind][k]
        });
        var min = Math.min.apply(Math, arr);
        var max = Math.max.apply(Math, arr);

        for (var i = 0; i < mapObject.series.markers.length; i++) {
            mapObject.series.markers[i].params.min = min;
            mapObject.series.markers[i].params.max = max;
        }

        mapObject.addMarkers(markers, seriesData);

        //Update Text describing the selected indicator (Above the map):
        document.getElementById("indicatorText").innerHTML = "<span class='indicatorTitle'>Selected Indicator Name:</span> <span class='indicatorData'>" + ref[ind]['name'] + "</span><br/>" +
            "<span class='indicatorTitle'>Indicator Code:</span> <span class='indicatorData'>" + ind + "</span> | <span class='indicatorTitle'>Correlation with Child Mortality:</span> <span class='indicatorData'>" + other.v3 + "</span><br/>" +
            "<span class='indicatorTitle'>Definition:</span> " + ref[ind]['definition'] + "<br/>" +
            "<span class='indicatorTitle'>Source:</span> " + ref[ind]['source']
        ;
    }
}

// Populate the top labels
function displayLabels() {
    var divs = ['topPve', 'topNve'];
    for (var i = 0; i < divs.length; i++) {
        var arr;
        if (i == 0) {
            arr = dataTopPve;
        } else {
            arr = dataTopNve;
        }
        var div = document.getElementById(divs[i]).innerHTML;

        for (var j = 0; j < dataTopPve.length; j++) {
            div += '<div class = "topLabel" onclick="' +
                'var other = {}; other[\'v2\']=\'' + arr[j] + '<br/>' + ref[arr[j]]['name'] + '\'; other[\'v3\']= ' + cor[arr[j]] + ' ; updateMap(null, null, null, null, other);"' +
                'onmouseover="showToolTip(\'' + arr[j] + '\', event);" ' +
                'onmouseout="hideToolTip();"' +
                '>' +
                '<div class="topText">' +
                (ref[arr[j]]['name']).substring(0, (ref[arr[j]]['name']).indexOf('(')) +
                '</div>' +
                /*'<div class="topValue">' +
                Number((cor[arr[j]]).toFixed(2)) +
                '</div>*/
                '</div>';
        }

        document.getElementById(divs[i]).innerHTML = div;
    }
}

// Populates and shows the tooltip for the top labels
function showToolTip(txt, evt) {
    var e = e || evt || window.event;
    document.getElementById('topToolTip').innerHTML = txt + ': ' + cor[txt] + '<br/>' + ref[txt]['name'];
    document.getElementById('topToolTip').style.top = e.pageY - 50 + 'px';
    document.getElementById('topToolTip').style.left = e.pageX + 'px';
    document.getElementById('topToolTip').style.display = 'block';
}

// Hides the tooltip for the top labels
function hideToolTip() {
    document.getElementById('topToolTip').style.display = 'none';
}