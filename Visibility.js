//Orbital Slot definition
var os = new Array()
os['11'] = 'B05';
os['12'] = 'B06';
os['19'] = 'C04';
os['20'] = 'C14';
os['26'] = 'B08';
os['22'] = 'B14';
os['24'] = 'A08';
os['30'] = 'A05';
os['8'] = 'C07';
os['9'] = 'C02';
os['1'] = 'A02';
os['2'] = 'A06';
os['7'] = 'C06';
os['3'] = 'C08';
os['4'] = 'C03';
os['5'] = 'C01';
os['21'] = 'A03';
os['25'] = 'A07';
os['27'] = 'A04';
os['31'] = 'A01';
os['36'] = 'B04';
os['13'] = 'B01';
os['15'] = 'B02';
os['33'] = 'B07';
os['18'] = 'Ext01';
os['14'] = 'Ext02';

var addLoading = function () {
    jQuery(".view-filters").after('<div class="wrapGraph"><img src="/modules/custom/galileo_satellites/images/ajax-loader.gif" alt="loading" /></div>');
    jQuery(".wrapGraph").attr("style", "margin: auto; width: 50%;");
}
addLoading();
// Declaration
var latitudeForm = null;
var longitudeForm = null;
var elevationForm = null;
var latitudeFormLastCalled = null;
var longitudeFormLastCalled = null;
var elevationFormLastCalled = null;
var dateFormLastCalled = null;
var latitudeFormDefault = 50;
var longitudeFormDefault = 14;
var elevationFormDefault = 5;
var frequencySelected = null;
var clickedTimeGantt = "12:00:00";

var frequencyColor = {
    "Healthy": "#00ff00",
    "Marginal": "#0000ff",
    "Unhealthy": "#ff0000",
    "SiSOff": "#000000",
};

var signalTypePolarPosition = {
    "Healthy": 0,
    "Marginal": 1,
    "Unhealthy": 2,
    "SiSOff": 3
};

//15min
var durationGanttInstant = 900;
var dateForm = null;
var timeForm = null;
var candidateObjectSignal = [];
var dataProviderGantt = null;
var globalDataAjax = null;
am5.addLicense("AM5C135962216");

// Select frequency
var selectOptionsSignalFrequency = "";
signalTypeFrequency.forEach(function (element) {
    selectOptionsSignalFrequency += '<option value = ' + element + '>' + element + '</option>';
});
jQuery("#frequencyVisibility").append(selectOptionsSignalFrequency);
frequencySelected = jQuery("#frequencyVisibility").val();
var dateInit = getDate();
dateForm = dateInit[0];
dateForm = getDate()[0];

timeForm = "12:00";
timeJsonInit = "120000"
dateJsonInit = dateForm.replace(/-/g, '');

dateCompleteRounded = dateJsonInit.concat(timeJsonInit);

latitudeForm = (localStorage.getItem("gscLatitudeForm") ? localStorage.getItem("gscLatitudeForm") : 50);
longitudeForm = (localStorage.getItem("gscLongitudeForm") ? localStorage.getItem("gscLongitudeForm") : 14);
elevationForm = (localStorage.getItem("gscElevationForm") ? localStorage.getItem("gscElevationForm") : 5);

jQuery('#idDate').val(dateForm);
jQuery('#idTime').val(timeForm);
jQuery('#elevation').val(elevationForm);
jQuery('#latitude').val(latitudeForm);
jQuery('#longitude').val(longitudeForm);

jQuery(document).ready(function () {
    jQuery("#apply").on("click", function () {
        document.getElementById("apply").style.pointerEvents = "none";
        getFormValues();

        if (validateValues()) {
            jQuery("#chartdivGantt").empty();
            jQuery("#chartdivPolar").empty();
            jQuery(".wrapGraph").remove();
            jQuery(".divLegendFrequency").empty();
            jQuery.when(addLoading()).then(function () {
                var startDateForm = new Date(dateForm).getTime().toString().slice(0, -3);
                var startDate = new Date(startDateForm * 1000);
                if (getCompareActualWithLastValues()) {
                    parseJsonToDataProviderAndCallGraph();
                    setLegendStyle(startDate);
                    jQuery(".wrapGraph").remove();
                } else {
                    getGantt();
                }
                saveFormValuesToLocalStorage();
                jQuery("#apply").css({ "pointer-events": "all" });
            });

        }
    });

    jQuery("#edit-reset").on("click", function () {
        resetFormValues();
    });

});

// Calls to main functions
if (validateValues()) {
    getGantt();
}


function getFormValues() {
    latitudeForm = jQuery("#latitude").val();
    longitudeForm = jQuery("#longitude").val();

    elevationForm = jQuery("#elevation").val();
    dateForm = jQuery("#idDate").val();
    frequencySelected = jQuery("#frequencyVisibility").val();

    dateJsonInit = dateForm.replace(/-/g, '');
    dateCompleteRounded = dateJsonInit.concat(timeJsonInit);
}

function validateValues() {

    var currentDate = new Date();
    var formDate = new Date(dateForm);
    var diff = formDate - currentDate;
    var maxDiff = 2*24*60*60*1000; // 2 days

    if (diff > maxDiff) {
        alert('The date cannot exceed 2 days from current date.');
        return false;
    }

    if (latitudeForm > 90 || latitudeForm < -90) {
        return false;
    }

    if (longitudeForm > 180 || longitudeForm < -180) {
        return false;
    }
    return true;
}

function resetFormValues() {
    latitudeForm = jQuery("#latitude").val(latitudeFormDefault);
    latitudeForm = latitudeFormDefault;
    longitudeForm = jQuery("#longitude").val(longitudeFormDefault);
    longitudeForm = longitudeFormDefault;
    elevationForm = jQuery("#elevation").val(elevationFormDefault);
    elevationForm = elevationFormDefault;

    saveFormValuesToLocalStorage();
}

// =====================
// ======= GANTT ========
// =====================

function getGantt() {
    var startDateForm = new Date(dateForm).getTime().toString().slice(0, -3);
    var startDate = new Date(startDateForm * 1000);

    jQuery.ajax({
        method: "GET",
        url: host + "/visibility?date=" + startDateForm + "&longitude=" +
            latitudeForm + "&latitude=" + longitudeForm + "&elevation=" +
            elevationForm + "&frequency=" + frequencySelected,

        contentType: 'text/plain',
        success: function (data) {
            if (data) {
                jQuery("#apply").css({ "pointer-events": "all" });
                globalDataAjax = data.body.localPerf.data;
                parseJsonToDataProviderAndCallGraph();
                jQuery(".legend-title-gantt").text("Data from Satellites");
                setLegendStyle(startDate);
                jQuery("#apply").css({ "pointer-events": "all" });
                jQuery(".wrapGraph").remove();
            } else {
                jQuery("#apply").css({ "pointer-events": "all" });
                jQuery(".wrapGraph").remove();
                jQuery(".view-filters").after(getNoDataMessage());
            }
        },
        error: function () {
            jQuery("#apply").css({ "pointer-events": "all" });
	    jQuery(".wrapGraph").remove();
            jQuery(".view-filters").after(getErrorMessage());


        }
    });
}

function parseJsonToDataProviderAndCallGraph() {
    let objGantt = {};
    dataProviderGantt = [];
    let timeInstant;
    let timeIncrement;
    let colorValue;
    for (let i = 0; i < globalDataAjax.Instant.length - 1; i++) {
        timeInstant = getTimestampFromInstantTime(globalDataAjax.Instant[i].timeStamp);
        timeIncrement = timeInstant + durationGanttInstant * 1000;

        globalDataAjax.Instant[i].constellation.Satellite.forEach(function (value, index) {
            colorValue = frequencyColor[value.osStatuses[frequencySelected]];
            colorValue = colorValue ? colorValue : frequencyColor["SiSOff"];

            objGantt = {
                category: value.svid,
                start: timeInstant,
                end: timeIncrement,
                columnSettings: {
                    fill: am5.color(colorValue)
                }
            };

            dataProviderGantt.push(objGantt);
        });
    }
    candidateObjectSignal = globalDataAjax.Instant.filter(function (a) {
        return a.timeStamp == dateCompleteRounded;
    });

    if (candidateObjectSignal.length) {
        candidateObjectSignal = candidateObjectSignal[0].constellation.Satellite;
    }

    dataProviderGantt.sort(function (a, b) {
        return b.category - a.category;
    });

    createGantt();
    getPolar();
    setLastValues();
}

function getTimestampFromInstantTime(ti) {
    // date
    let timeInstant = ti.slice(0, 4) + '/' + ti.slice(4, 6) + '/' + ti.slice(6, 8) + ' ';
    // time
    timeInstant = timeInstant + ti.slice(8, 10) + ':' + ti.slice(10, 12) + ':' + ti.slice(12, 14);
    // dateTime to timestamp
    return Date.parse(timeInstant);
}


function createGantt() {
    am5.ready(function () {

        function maybeDisposeRoot(divId) {
            am5.array.each(am5.registry.rootElements, function (root) {

                if (root && root.dom && root.dom.id == divId) {
                    root.dispose();
                }
            });
        }

        maybeDisposeRoot("chartdivGantt");

        // Create root element
        var root = am5.Root.new("chartdivGantt");

        root.dateFormatter.setAll({
            dateFormat: "yyyy-MM-dd HH:mm",
            dateFields: ["valueX", "openValueX"]
        });

        // Set themes
        root.setThemes([
            am5themes_Animated.new(root)
        ]);

        // Create chart
        var chart = root.container.children.push(am5xy.XYChart.new(root, {
            panX: false,
            panY: false,
            wheelX: "panX",
            wheelY: "zoomX",
            layout: root.verticalLayout
        }));

        // Add chart title
        chart.children.unshift(am5.Label.new(root, {
            text: "Satellite visibility schedule",
            fontSize: 18,
            fontWeight: "bolder",
            textAlign: "center",
            x: am5.percent(50),
            centerX: am5.percent(50),
            paddingTop: 0,
            paddingBottom: 0
        }));

        // Add cursor
        var cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
        cursor.lineY.set("visible", false);

        // Create axes
        var yRenderer = am5xy.AxisRendererY.new(root, {
            inversed: true,
        }
        );

        yRenderer.grid.template.set("location", 1);

        var yAxis = chart.yAxes.push(
            am5xy.CategoryAxis.new(root, {
                categoryField: "category",
                renderer: yRenderer,
            })
        );

        // yAxis title
        yAxis.children.unshift(am5.Label.new(root, {
            text: 'Satellites (SVID)',
            textAlign: 'center',
            y: am5.p50,
            rotation: -90,
            fontWeight: 'bold',
            fontSize: 14
        }));

        var resArr = [];
        dataProviderGantt.filter(function (item) {
            var i = resArr.findIndex(x => (x.category == item.category));
            if (i <= -1) {
                resArr.push(item);
            }
            return null;
        });

        yAxis.data.setAll(resArr.map((x => ({ "category": x.category }))));

        var xAxis = chart.xAxes.push(
            am5xy.DateAxis.new(root, {
                baseInterval: { timeUnit: "minute", count: 1 },
                renderer: am5xy.AxisRendererX.new(root, { strokeOpacity: 0.1 })
            })
        );

        // xAxis title
        xAxis.children.unshift(am5.Label.new(root, {
            text: 'Hours',
            textAlign: 'center',
            x: am5.p50,
            centerX: am5.percent(45),
            fontWeight: 'bold',
            fontSize: 14
        }));

        // Legend
        var legend = chart.children.push(am5.Legend.new(root, {
            nameField: "name",
            fillField: "color",
            strokeField: "color",
            paddingLeft: 120,
            layout: root.horizontalLayout
        }));

        legend.data.setAll([
            { name: "Healthy", color: "#00ff00" },
            { name: "Marginal", color: "#0000ff" },
            { name: "Unhealthy", color: "#ff0000" },
            { name: "Off", color: "#000000" }
        ]);

        // series
        var series = chart.series.push(am5xy.ColumnSeries.new(root, {
            xAxis: xAxis,
            yAxis: yAxis,
            openValueXField: "start",
            valueXField: "end",
            categoryYField: "category",
            sequencedInterpolation: true
        }));

        series.columns.template.setAll({
            templateField: "columnSettings",
            strokeOpacity: 0,
            tooltipText: "[bold]SVID {category}:\n[bold]{openValueX}[/] - [bold]{valueX}[/]"
        });

        series.data.setAll(dataProviderGantt);

        series.appear();
        chart.appear(1000, 100);

        // Add scrollbars
        chart.set("scrollbarX", am5.Scrollbar.new(root, {
            orientation: "horizontal"
        }));

        // Add event listener
        series.columns.template.events.on("click", function (ev) {
            addLegendLabelGantt(ev);
        });
    });

}

function addLegendLabelGantt(ev) {
    var startDate = new Date(ev.target.dataItem.dataContext.start);

    relationLineGanttWithPolar(startDate);
    setLegendStyle(startDate);
}

jQuery(".cesium-viewer-toolbar").ready(function () {
    jQuery(".selectSignalTypeFrequency").change(function () {
        getDataSource();
    });

    jQuery(".selectSignalTypeMap").change(function () {
        getDataSource();
    });

    jQuery("#latitude").on('change', function () {
        jQuery("#apply").css({ "pointer-events": "all" });
    });

    jQuery("#longitude").on('change', function () {
        jQuery("#apply").css({ "pointer-events": "all" });
    });

    jQuery("#elevation").on('change', function () {
        jQuery("#apply").css({ "pointer-events": "all" });
    });
    jQuery("#idDate").on('change', function () {
        jQuery("#apply").css({ "pointer-events": "all" });
    });

});


function setLegendStyle(startDate) {
    var endDate = new Date(startDate.getTime() + durationGanttInstant * 1000);
    startDate = startDate.toLocaleTimeString('en-US', { hour12: false }).slice(0,-3);
    endDate = endDate.toLocaleTimeString('en-US', { hour12: false }).slice(0,-3);

    var signal = globalDataAjax.Instant.filter(function (a) {
        return a.timeStamp == dateCompleteRounded;
    });

    if (signal.length) {
        signal = signal[0].performance.Signal.filter(function (a) {
            return a.sc == frequencySelected.charAt(0).toUpperCase() + frequencySelected.slice(1).replace('-', '');
        })[0];
    }

    var head = ["Time interval", "Satellites in view", "GDOP", "PDOP", "HDOP", "VDOP", "TDOP"];
    var row = [];
    row.push(startDate + " - " + endDate);    // time interval
    row.push(candidateObjectSignal.length);   // sats in view
    row.push(signal["gdop"]);
    row.push(signal["pdop"]);
    row.push(signal["hdop"]);
    row.push(signal["vdop"]);
    row.push(signal["tdop"]);

    jQuery(".divLegendFrequency").html(getSatelliteDataTable(head, row));
    jQuery(".divLegendFrequency").attr("style", "position: relative; text-align: center;");
}


function getSatelliteDataTable(head, row) {
    // start table
    var htmlTable = "<table class='table table-striped'>";
    // table header
    htmlTable += "<tr>";
    for (let i = 0; i < head.length; i++) {
        htmlTable += "<th>" + head[i] + "</th>";
    }
    htmlTable += "</tr>";
    // table body
    htmlTable += "<tr>";
    for (let i = 0; i < row.length; i++) {
        htmlTable += "<th>" + row[i] + "</th>";
    }
    htmlTable += "</tr>";
    // end table
    htmlTable += "</table>";

    return htmlTable;
}

// =====================
// ======= POLAR ========
// =====================

function getPolar() {
    dataProviderPolarAux = [];
    dataProviderPolarAux = [[], [], [], [], []];

    for (var i = 0; i < candidateObjectSignal.length; i++) {
        let candidateSignal = [];
        candidateSignal.push(candidateObjectSignal[i].svid);
        candidateSignal.push(os[candidateObjectSignal[i].svid]);
        candidateSignal.push(candidateObjectSignal[i].skyPos.elevation);
        candidateSignal.push(candidateObjectSignal[i].skyPos.azimuth);

        var affectedByNagus = "";
        for (var j = 0; j < globalDataAjax.SignalData.body.activeNAGUList.NAGU.length; j++) {
            if (isInArray(candidateObjectSignal[i].svid, globalDataAjax.SignalData.body.activeNAGUList.NAGU[j].event.svList.svid)) {
                affectedByNagus += globalDataAjax.SignalData.body.activeNAGUList.NAGU[j].number + ", ";
            }
        }

if (frequencySelected == "E1b" || frequencySelected == "E5a" || frequencySelected == "E5b") {
if (affectedByNagus) {
         var nagusArray = affectedByNagus.slice(0, -2).split(',');
         var line = "Affected by NAGUs: ";

         for (var k = 0; k < nagusArray.length; k++) {
             if (k % 7 === 0) {
                     line += "\n";
             }
                 line += nagusArray[k]+ ", ";

             }

	  candidateSignal.push(candidateObjectSignal[i].ure.ossf + "\n" + line.slice(0,-2));



        } else {
        candidateSignal.push(candidateObjectSignal[i].ure.ossf);
	}
} else {

    	 if (affectedByNagus) {
         var nagusArray = affectedByNagus.slice(0, -2).split(',');
         var line = "Affected by NAGUs: ";

         for (var k = 0; k < nagusArray.length; k++) {
             if (k % 7 === 0) {
                     line += "\n";
             }
                 line += nagusArray[k]+ ", ";

             }



	    candidateSignal.push(candidateObjectSignal[i].ure.osdf + "\n" + line.slice(0,-2));

    } else {
        candidateSignal.push(candidateObjectSignal[i].ure.osdf);
    }
}








        var index = signalTypePolarPosition[candidateObjectSignal[i].osStatuses[frequencySelected]];
        var auxItem = [Math.round(candidateObjectSignal[i].skyPos.azimuth), candidateObjectSignal[i].skyPos.elevation,
            candidateSignal];

        index = (index != undefined) ? index : 3;
        dataProviderPolarAux[index].push(auxItem);
    }

    createPolar();
}

function createPolar() {

    am5.ready(function () {

        function maybeDisposeRoot(divId) {
            am5.array.each(am5.registry.rootElements, function (root) {

                if (root && root.dom && root.dom.id == divId) {
                    root.dispose();
                }
            });
        }

        maybeDisposeRoot("chartdivPolar");

        var root = am5.Root.new("chartdivPolar");

        // Set themes
        root.setThemes([
            am5themes_Animated.new(root)
        ]);

        // Create chart
        var chart = root.container.children.push(am5radar.RadarChart.new(root, {
            panX: false,
            panY: false,
            layout: root.verticalLayout,
            maxTooltipDistance: 0
        }));

        // Add chart title
        chart.children.unshift(am5.Label.new(root, {
            text: "Skyplot",
            fontSize: 18,
            fontWeight: "bolder",
            textAlign: "center",
            x: am5.percent(50),
            centerX: am5.percent(50),
            paddingTop: 0,
            paddingBottom: 0
        }));

        // Add cursor
        var cursor = chart.set("cursor", am5radar.RadarCursor.new(root, {
          behavior: "zoomX"
        }));

        cursor.lineY.set("visible", false);

        // Create axes
        var xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, {
            min: 0,
            max: 330,
            strictMinMax: true,
            extraMax: 0.1,
            renderer: am5radar.AxisRendererCircular.new(root, {
                minGridDistance: 30,
                maxLabelPosition: 0.99
            })
        }));

        var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
            min: 0,
            max: 90,
            strictMinMax: true,
            renderer: am5radar.AxisRendererRadial.new(root, {
                inversed: true,
                minGridDistance: 20,
                maxPosition: 0.95
            })
        }));


        // Create series
        var seriesNameMap = {
            "Healthy": "Healthy",
            "Marginal": "Marginal",
            "Unhealthy": "Unhealthy",
            "Off": "SiSOff"
        };


        function createSeries(name, data) {
            var series = chart.series.push(am5radar.RadarLineSeries.new(root, {
                name: name,
                xAxis: xAxis,
                yAxis: yAxis,
                valueXField: "angle",
                valueYField: "radius",
                tooltip:am5.Tooltip.new(root, {
                    labelText:"{valueY}"
                }),
                sequencedInterpolation: true
            }));

            series.set("stroke", root.interfaceColors.get("background"));
            series.strokes.template.setAll({
                forceHidden: true
            });


            series.set("fill", frequencyColor[seriesNameMap[name]]);

            series.bullets.push(function () {
                return am5.Bullet.new(root, {
                    sprite: am5.Circle.new(root, {
                        radius: 5,
                        fill: series.get("fill")
                    })
                });
            });

            /* Use this code for Test 10054
            series.bullets.push(function () {
                return am5.Bullet.new(root, {
                    sprite: am5.Circle.new(root, {
                        radius: 5,
                        fill: series.get("fill"),
                        tooltipText: "{info.svid}",
                        showTooltipOn: "always",
                        tooltip: am5.Tooltip.new(root, {
                            keepTargetHover: true,
                        })
                    })
                });
            });
            */

            // Add element tooltip
            var tooltipText = "[bold]SVID: {info.svid}\n";
            tooltipText += "Orbital Slot: {info.orbital}\n";
            tooltipText += "Elev: {info.elev}º\n";
            tooltipText += "Azim: {info.azim}\n";
            tooltipText += "URE: {info.ure}\n"; // and NAGU

            var tooltip = series.set("tooltip", am5.Tooltip.new(root, {
                labelText: tooltipText
            }));

            for (var i = 0; i < data.length; i++) {
                var dataItem = data[i];
                var dataObject = {
                    "angle": parseFloat(dataItem[0]),
                    "radius": parseFloat(dataItem[1]),
                    "info": {
                        "svid": dataItem[2][0],
                        "orbital": dataItem[2][1],
                        "elev": dataItem[2][2],
                        "azim": dataItem[2][3],
                        "ure": dataItem[2][4]
                    }
                };

                series.data.push(dataObject);
            }

            series.appear(1000);
        }

        // create polar scatter plot series
        createSeries("Healthy", dataProviderPolarAux[0]);
        createSeries("Marginal", dataProviderPolarAux[1]);
        createSeries("Unhealthy", dataProviderPolarAux[2]);
        createSeries("Off", dataProviderPolarAux[3]);

        chart.appear(1000);
    });
}

function relationLineGanttWithPolar(startDate) {
    clickedTimeGantt = startDate.toLocaleTimeString('en-US', { hour12: false });
    dateCompleteRounded = dateForm.replace(/-/g, '').concat(clickedTimeGantt.replaceAll(':', ''));

    candidateObjectSignal = globalDataAjax.Instant.filter(function (a) {
        return a.timeStamp == dateCompleteRounded;
    })[0].constellation.Satellite;
    getPolar();
}

function saveFormValuesToLocalStorage() {
    localStorage.setItem("gscLatitudeForm", latitudeForm);
    localStorage.setItem("gscLongitudeForm", longitudeForm);
    localStorage.setItem("gscElevationForm", elevationForm);
    localStorage.setItem("gscDateForm",dateForm);
}

function setLastValues() {
    latitudeFormLastCalled = latitudeForm;
    longitudeFormLastCalled = longitudeForm;
    elevationFormLastCalled = elevationForm;
    dateFormLastCalled = dateForm;
}

function getCompareActualWithLastValues() {
    if (latitudeForm + longitudeForm + elevationForm + dateForm == latitudeFormLastCalled +
        longitudeFormLastCalled + elevationFormLastCalled + dateFormLastCalled) {
        return true;
    }
    return false;
}
