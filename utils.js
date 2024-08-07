const shift = 365; // Changed from 52*7: 52*7days - to keep comparing mondays with mondays, tuesdays with tuesdays, etc

var downloadSymbol = function(x, y, w, h) {
    const path = [
        // Arrow stem
        'M', x + w * 0.5, y,
        'L', x + w * 0.5, y + h * 0.7,
        // Arrow head
        'M', x + w * 0.3, y + h * 0.5,
        'L', x + w * 0.5, y + h * 0.7,
        'L', x + w * 0.7, y + h * 0.5,
        // Box
        'M', x, y + h * 0.9,
        'L', x, y + h,
        'L', x + w, y + h,
        'L', x + w, y + h * 0.9
    ];
    return path;
};

var movingAvg = function(array, countBefore, countAfter) {
    if (countAfter == undefined) countAfter = 0;
    const result = [];
    for (let i = 0; i < array.length; i++) {
      const subArr = array.slice(Math.max(i - countBefore + 1, 0), Math.min(i + countAfter + 1, array.length));
      const avg = subArr.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0) / subArr.length;
      result.push(avg);
    }
    return result;
};

var growthRate = function(array, countBefore, countAfter) {
    if (countAfter == undefined) countAfter = 0;
    const result = [];
    for (let i = 0; i < array.length; i++) {
      const subArr = array.slice(Math.max(i - countBefore + 1, 0), Math.min(i + countAfter + 1, array.length));
      const growth = (subArr[subArr.length-1]/subArr[0]-1)*100;
      result.push(growth);
    }
    return result;
};

var generateData = function(features, ma=7, gr=365) {

    var series = features.map((feature) => {
        datapoint = {
          portid: feature.attributes.portid,
          portname: feature.attributes.portname,
          country: feature.attributes.country,
          ISO3: feature.attributes.ISO3,
          date: feature.attributes.date, 
          portcalls_cargo: parseInt(feature.attributes.portcalls_cargo),
          portcalls_tanker: parseInt(feature.attributes.portcalls_tanker),
          portcalls_general_cargo: parseInt(feature.attributes.portcalls_cargo),
          portcalls_dry_bulk: parseInt(feature.attributes.portcalls_dry_bulk),
          portcalls_roro: parseInt(feature.attributes.portcalls_roro),
          portcalls_container: parseInt(feature.attributes.portcalls_container),
          portcalls: parseInt(feature.attributes.portcalls),
          import_cargo: parseFloat(feature.attributes.import_cargo),
          import_tanker: parseFloat(feature.attributes.import_tanker),
          import_general_cargo: parseFloat(feature.attributes.import_general_cargo),
          import_dry_bulk: parseFloat(feature.attributes.import_dry_bulk),
          import_roro: parseFloat(feature.attributes.import_roro),
          import_container: parseFloat(feature.attributes.import_container),
          import: parseFloat(feature.attributes.import),
          export_cargo: parseFloat(feature.attributes.export_cargo),
          export_tanker: parseFloat(feature.attributes.export_tanker),
          export_general_cargo: parseFloat(feature.attributes.export_general_cargo),
          export_dry_bulk: parseFloat(feature.attributes.export_dry_bulk),
          export_roro: parseFloat(feature.attributes.export_roro),
          export_container: parseFloat(feature.attributes.export_container),
          export: parseFloat(feature.attributes.export)
        }
        return datapoint;
    });
  
    series.sort((a, b) => a.date - b.date);

    var import7MA = movingAvg(series.map(x => x.import), ma, 0);
    var export7MA = movingAvg(series.map(x => x.export), ma, 0);
    var portcalls7MA = movingAvg(series.map(x => x.portcalls), ma, 0);
  
    var importGR = growthRate(series.map(x => x.import), gr, 0);
    var exportGR = growthRate(series.map(x => x.export), gr, 0);
    var portcallsGR = growthRate(series.map(x => x.portcalls), gr, 0);

    series = series.map(function(feature, i) {
      feature['import7MA'] = import7MA[i];
      feature['export7MA'] = export7MA[i];
      feature['portcalls7MA'] = portcalls7MA[i];
      if (i > gr) {
        feature['import7MAshifted'] = import7MA[i-gr];
        feature['export7MAshifted'] = export7MA[i-gr];
        feature['portcalls7MAshifted'] = portcalls7MA[i-gr];
        feature['importGR'] = importGR[i];
        feature['exportGR'] = exportGR[i];
        feature['portcallsGR'] = portcallsGR[i];
      }
      return feature;
    });

    console.log(series);
    return series;

};

var labels = {
    portcalls: {
      yAxis: "Number of Ships",
      title: "Daily Arrivals of Ships",
      name: "Number of Ships"
    },
    import: {
      yAxis: "Metric Tons",
      title: "Daily Import Volume",
      name: 'Import Volume'
    },
    export: {
      yAxis: "Metric Tons",
      title: "Daily Export Volume",
      name: 'Export Volume'
    }
};



var createChart = function(data, chartType="portcalls", freq="Daily") {

    var options = {
    
        chart: {
          backgroundColor: '#fff',
        },
    
        credits: {
            enabled: false
        },
    
        legend: {
          enabled: true
    
        },
    
        plotOptions: {
          series: {
              dataGrouping: {
                enabled: false
              },
              showInNavigator: true
          },
          column: {
            stacking: 'normal'
          }
        },
    
        rangeSelector: {
            selected: 1 // By default 3 months is selected
        },
    
        xAxis: {
            plotBands: []
        },
    
        exporting: {
            enabled: true,
            buttons: {
                contextButton: {
                    symbol: 'download',
                    text: 'Export Data'
                }
            }
        },
        series: []
    };
    
    const portname = data[0].portname;      
    
    options['title'] = {
      text: portname + ": " + labels[chartType].title
    };
    
    options['yAxis'] = {
      title: {
        text: labels[chartType].yAxis
      },
      opposite: false
    }
  
    if (chartType == "portcalls") {
  
      options.series = [
        { name: "Number of Cargo Ships",
          data: data.map(x => [x.date, x['portcalls_cargo']]),
          type: 'column',
          stack: 1,
          tooltip: {
            valueDecimals: 0,
          },
          color: '#afc5dc',
          showInLegend: true},
      { name: "Number of Tanker Ships",
        data: data.map(x => [x.date, x['portcalls_tanker']]),
        type: 'column',
        stack: 1,
        tooltip: {
          valueDecimals: 0,
        },
        color: '#004c97',
        showInLegend: true}];
  
    } else {
      options.series = [{ name: labels[chartType].name,
                          data: data.map(x => [x.date, x[chartType]]),
                          type: 'column',
                          tooltip: {
                            valueDecimals: 0,
                          },
                          color: '#004c97',
                          showInLegend: true}];
    }
  
  
    options.series = options.series.concat([
    { name: '7-day Moving Average',
      data: data.map(x => [x.date, x[chartType+"7MA"]]),
      type: 'line',
      marker: {
        enabled: false, // auto
        lineWidth: 1,
      },
      color: '#f3ab0a',
      tooltip: {
            valueDecimals: 0,
        },
      showInLegend: true          
    },
    { name: 'Prior Year: 7-day Moving Average',
      data: data.slice(shift+1).map(x => [x.date, x[chartType+"7MAshifted"]]),
      type: 'line',
      marker: {
        enabled: false, // auto
        lineWidth: 1,
      },
      dashStyle: 'Dash',
      color: '#474747',
      tooltip: {
            valueDecimals: 0,
        },
      showInLegend: true          
    }]);
    
  
    console.log(options);
  
    return options;
  
};






/// TESTS

console.log(labels);

console.log(movingAvg([1,2,3,1,1,1], 2));

console.log(growthRate([1,1,1.5,1.5,2,2], 2));