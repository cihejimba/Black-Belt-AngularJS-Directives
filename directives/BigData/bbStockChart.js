angular.module('AngularBlackBelt.BigDataCharts', [])
.directive('bbStockChart', [ function(){
    
  function link(scope,element,attrs){
    
      var limit = 60 * 1,
          duration = 750,
          now = new Date(Date.now() - duration),
          color = d3.scale.category20(),
          padding = 50,
          max = 20,
          x, y, line, svg, xAxis, yAxis, paths;

      var width = element.width(),
          height = 500,
          groups = {};

      var tip = d3.tip()
        .attr('class', 'd3-tip')
        .html(function(d) { return '<span> ' + d[d.length-1].tic + ' <br> $' + d[d.length-1].value + '</span>' ;})
        .offset([0 ,-65]);

      function rangeFunc(){
        return 0;
      }
      
      function resetGroups(tickers){

        for(var i in tickers){

          if(!groups[tickers[i]]){
            groups[tickers[i]] = {
                value: 0,
                color: color(i),
                data: d3.range(limit).map(rangeFunc)
            }; 
          }
        }

        x = d3.time.scale()
          .domain([now - (limit - 2), now - duration])
          .range([padding+0.5, width]);

        y = d3.scale.linear()
            .domain([0, max])
            .range([height, 0]);

        line = d3.svg.line()
            .interpolate('basis')
            .x(function(d, i) {
                return x(now - (limit - 1 - i) * duration);
            })
            .y(function(d) {
                if(d.value){
                  return y(d.value);
                } else {
                  return y(d);
                }
            });

        svg = d3.select(element[0]).append('svg')
            .attr('class', 'chart')
            .attr('width', width)
            .attr('height', height + 50);

        svg.call(tip);

        xAxis = svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(x.axis = d3.svg.axis().scale(x).orient('bottom'));

        //Define Y axis
        yAxis = svg.append('g')
            .attr('class', 'y axis')
            .attr("transform", "translate(" + padding + ",0)")
            .call(y.axis = d3.svg.axis().scale(y).orient('left'));

        paths = svg.append('g');

        for (var name in groups) {
            var group = groups[name];
            group.path = paths.append('path')
                .data([group.data])
                .attr('class', name + ' group')
                .style({'stroke-width': '3px', 'stroke': group.color})
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide);
        }
      }

      function tick() {
         
          now = new Date();
          var group,
              name,
              tic;

          // Add new values
          for (tic in scope.data) {
            if(groups[tic]){
                var ticData = {tic: tic, value: scope.data[tic].price?parseFloat(scope.data[tic].price,10):0};
                group = groups[tic];
                group.data.push(ticData);
                group.path.attr('d', line);
                if(max < ticData.value){
                  max = ticData.value;
                  y.domain([0, max]);
                }
                if(group.data.length > 60){
                  group.data.shift();
                } 
             }
          }

          // Shift domain
          x.domain([now - (limit - 2) * duration, now - duration]);
          // Slide x-axis left
          xAxis.transition()
              .duration(duration)
              .ease('linear')
              .call(x.axis);
          // Slide y-axis if needed
          yAxis.transition()
              .call(y.axis);
          // Slide paths left
          paths.attr('transform', null)
              .transition()
              .duration(duration)
              .ease('linear')
              .attr('transform', 'translate(' + x(now - (limit - 1) * duration) + ')')
              .each('end', tick);
      }
      
      var killLengthWatcher = scope.$watch('tickers.length', function(newVal){
        element.html('');
        max = 20;
        resetGroups(scope.tickers);
      });

      var killWatcher = scope.$watchCollection('data', tick);

      scope.$on('$destroy', function(elem){
        killWatcher();
        killLengthWatcher();
        scope.data = null;
        scope.tickers = null;
      });

    }
    
    return {
        restrict: 'A',
        scope: {data: '=',tickers: '='},
        link: link
    };
    
}]);