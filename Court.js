// Court.js

// --- globals so other files (Shot.js, Slider.js, HeatMap.js) can use them ---
let margin;
let chartDiv, court, heat_g, court_g, title;
let slider_axis, slider_rect, rect_entity;
let court_xScale, court_yScale, shot_xScale, shot_yScale, color;
let Basket, Backboard, Outterbox, Innerbox, CornerThreeLeft, CornerThreeRight, OuterLine;
let RestrictedArea, TopFreeThrow, BottomFreeThrow, ThreeLine, CenterOuter, CenterInner;

// -------------------------------------------------------------------
//   COURT OBJECT
// -------------------------------------------------------------------

class Court {
    constructor(options = {}) {
        // Allow some config if you ever want it
        this.containerSelector = options.containerSelector || "#court";
        this.width = options.width || 480;
        this.height = this.width / 50 * 47;

        this.init();
    }

    init() {
        margin = { left: 20, right: 20, top: 20, bottom: 20 };

        // container div for the court
        // (we still assume an element with id="court" exists)
        chartDiv = document.querySelector(this.containerSelector) ||
            document.getElementById('court');
        this.chartDiv = chartDiv;

        court = d3.select(chartDiv)
            .append('court')
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height);
        this.svg = court;

        // keep this for other files that might use it
        court.append('table');

        heat_g  = court.append('g');
        court_g = court.append('g');
        this.heat_g  = heat_g;
        this.court_g = court_g;

        title = d3.select(document.getElementById('caption')).append('text');
        this.title = title;

        // slider containers (Slider.js expects these)
        slider_axis = court.append('g')
            .attr('class', 'slider-axis');
        slider_rect = court.append('g')
            .attr('class', 'slider-rect');
        rect_entity = slider_rect.append('rect');
        this.slider_axis = slider_axis;
        this.slider_rect = slider_rect;
        this.rect_entity = rect_entity;

        // scales (same domains as before)
        court_xScale = d3.scaleLinear().domain([-25, 25]);
        court_yScale = d3.scaleLinear().domain([-4, 43]);
        shot_xScale  = d3.scaleLinear().domain([-250, 250]);
        shot_yScale  = d3.scaleLinear().domain([-45, 420]);

        this.court_xScale = court_xScale;
        this.court_yScale = court_yScale;
        this.shot_xScale  = shot_xScale;
        this.shot_yScale  = shot_yScale;

        color = d3.scaleSequential(d3.interpolateOrRd)
            .domain([5e-6, 3e-2]); // Points per square pixel.
        this.color = color;

        // shapes used by draw_court
        Basket           = court_g.append('circle');
        Backboard        = court_g.append('rect');
        Outterbox        = court_g.append('rect');
        Innerbox         = court_g.append('rect');
        CornerThreeLeft  = court_g.append('rect');
        CornerThreeRight = court_g.append('rect');
        OuterLine        = court_g.append('rect');
        RestrictedArea   = court_g.append('path');
        TopFreeThrow     = court_g.append('path');
        BottomFreeThrow  = court_g.append('path');
        ThreeLine        = court_g.append('path');
        CenterOuter      = court_g.append('path');
        CenterInner      = court_g.append('path');

        this.Basket           = Basket;
        this.Backboard        = Backboard;
        this.Outterbox        = Outterbox;
        this.Innerbox         = Innerbox;
        this.CornerThreeLeft  = CornerThreeLeft;
        this.CornerThreeRight = CornerThreeRight;
        this.OuterLine        = OuterLine;
        this.RestrictedArea   = RestrictedArea;
        this.TopFreeThrow     = TopFreeThrow;
        this.BottomFreeThrow  = BottomFreeThrow;
        this.ThreeLine        = ThreeLine;
        this.CenterOuter      = CenterOuter;
        this.CenterInner      = CenterInner;

        // draw the court
        draw_court();

        // initialize slider if Slider() is defined
        if (typeof Slider === 'function') {
            Slider();
        }
    }

    // Example helper if you ever need to redraw the geometry
    redraw() {
        if (this.court_g) {
            this.court_g.selectAll('*').remove();
        }
        draw_court();
    }

    getScales() {
        return {
            court_xScale,
            court_yScale,
            shot_xScale,
            shot_yScale
        };
    }
}

// Old API name kept for compatibility: initCourt()
// Now it just constructs the Court object.
function initCourt() {
    window.courtObject = new Court();
}

// run initCourt when DOM is ready (after all scripts have loaded)
document.addEventListener('DOMContentLoaded', initCourt);


// -------------------------------------------------------------------
//   COURT DRAWING
// -------------------------------------------------------------------

function draw_court() {
    const width = 480;
    const height = width / 50 * 47;
    court_g.attr("width", width)
        .attr("height", height);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    court_xScale.range([margin.left, innerWidth]).nice();
    court_yScale.range([margin.top, innerHeight]).nice();

    // Track final sideline regions (11 and 12)
    let area11 = null;
    let area12 = null;



    // Rim
    Basket.attr('cx', court_xScale(0))
        .attr('cy', court_yScale(-0.75))
        .attr('r', court_yScale(0.75) - court_yScale(0))
        .style('fill', 'none')
        .style('stroke', 'black');

    // Backboard
    Backboard.attr('x', court_xScale(-3))
        .attr('y', court_yScale(-1.5))
        .attr('width', court_xScale(3) - court_xScale(-3))
        .attr('height', 1)
        .style('fill', 'none')
        .style('stroke', 'black');

    // Outer paint (lane box)
    Outterbox
        .attr('x', court_xScale(-8))
        .attr('y', court_yScale(-4))
        .attr('width', court_xScale(8) - court_xScale(-8))
        .attr('height', court_yScale(15) - court_yScale(-4))
        .style('fill', 'none')
        .style('stroke', 'black');

    // Inner paint (lane box) – still commented out
    // Innerbox
    //     .attr('x', court_xScale(-6))
    //     .attr('y', court_yScale(-4))
    //     .attr('width', court_xScale(6) - court_xScale(-6))
    //     .attr('height', court_yScale(15) - court_yScale(-4))
    //     .style('fill', 'none')
    //     .style('stroke', 'black');

    // Corner 3s
    CornerThreeLeft
        .attr('x', court_xScale(-22))
        .attr('y', court_yScale(-4))
        .attr('width', 1)
        .attr('height', court_yScale(10) - court_yScale(-4))
        .style('fill', 'none')
        .style('stroke', 'black')
        .style('stroke-width', 1);

    CornerThreeRight
        .attr('x', court_xScale(22))
        .attr('y', court_yScale(-4))
        .attr('width', 1)
        .attr('height', court_yScale(10) - court_yScale(-4))
        .style('fill', 'none')
        .style('stroke', 'black')
        .style('stroke-width', 1);

    // Outer boundary
    OuterLine
        .attr('x', court_xScale(-25))
        .attr('y', court_yScale(-4))
        .attr('width', court_xScale(25) - court_xScale(-25))
        .attr('height', court_yScale(43) - court_yScale(-4))
        .style('fill', 'none')
        .style('stroke', 'black');

    // Restricted area – still commented out
    // appendArcPath(RestrictedArea,
    //     court_xScale(3) - court_xScale(0),
    //     90 * Math.PI / 180,
    //     270 * Math.PI / 180)
    //     .attr('fill', 'none')
    //     .attr("stroke", "black")
    //     .attr("transform",
    //         "translate(" + court_xScale(0) + ", " + court_yScale(-0.75) + ")");

    // Free-throw circle (top) – commented out
    // appendArcPath(TopFreeThrow,
    //     court_xScale(6) - court_xScale(0),
    //     90 * Math.PI / 180,
    //     270 * Math.PI / 180)
    //     .attr('fill', 'none')
    //     .attr("stroke", "black")
    //     .attr("transform",
    //         "translate(" + court_xScale(0) + ", " + court_yScale(15) + ")");

    // Free-throw circle (bottom, dotted) – commented out
    // appendArcPath(BottomFreeThrow,
    //     court_xScale(6) - court_xScale(0),
    //     -90 * Math.PI / 180,
    //     90 * Math.PI / 180)
    //     .attr('fill', 'none')
    //     .attr("stroke", "black")
    //     .style("stroke-dasharray", ("3, 3"))
    //     .attr("transform",
    //         "translate(" + court_xScale(0) + ", " + court_yScale(15) + ")");

    // 3-point arc
    var angle = Math.atan((10 - 0.75) / (22)) * 180 / Math.PI;
    var dis = court_yScale(18); // radius in pixels
    appendArcPath(ThreeLine, dis,
        (angle + 90) * Math.PI / 180,
        (270 - angle) * Math.PI / 180)
        .attr('fill', 'none')
        .attr("stroke", "black")
        .attr('stroke-width', 1)
        .attr('class', 'shot-chart-court-3pt-line')
        .attr("transform",
            "translate(" + court_xScale(0) + ", " + court_yScale(0) + ")");

    // Center circles – still commented out
    // appendArcPath(CenterOuter, ...)
    // appendArcPath(CenterInner, ...)

    // ----- basic vertical geometry -----
    const halfCourtY = 43;   // used for vertical rays & outer regions


    // ----- horizontal lines from sideline through 3pt corner to vertical 3pt lines -----
    const bandYFt = 10;   // y of the 3pt corner
    const laneLeftFt = -8;
    const laneRightFt = 8;
    const sidelineLeftFt = -25;
    const sidelineRightFt = 25;

    // left horizontal: from left sideline (-25) to left corner 3 vertical (-22)
    court_g.append("line")
        .attr("x1", court_xScale(sidelineLeftFt))
        .attr("y1", court_yScale(bandYFt))
        .attr("x2", court_xScale(-22))
        .attr("y2", court_yScale(bandYFt))
        .style("stroke", "black")
        .style("stroke-width", 1);

    // ----- SHADE REGION: between CORAL band (y=10) and CHARTREUSE corner-3 line (x=-22),
    // bounded by left sideline and baseline -----
    {
        // y positions in feet
        const topYFt = bandYFt;    // 10  (coral band)
        const bottomYFt = -4; // -4 (baseline)

        // x positions in feet
        const sidelineLeftFt = -25;
        const cornerLeftFt = -22;   // chartreuse vertical

        // convert to pixels
        const topYpx = court_yScale(topYFt);
        const bottomYpx = court_yScale(bottomYFt);
        const sidelineLeftXpx = court_xScale(sidelineLeftFt);
        const cornerLeftXpx = court_xScale(cornerLeftFt);

        // polygon in pixel space:
        // (-25, -4) -> (-22, -4) -> (-22, 10) -> (-25, 10)
        const coralChartreusePx = [];
        coralChartreusePx.push([sidelineLeftXpx, bottomYpx]); // A
        coralChartreusePx.push([cornerLeftXpx,  bottomYpx]);  // B
        coralChartreusePx.push([cornerLeftXpx,  topYpx]);     // C
        coralChartreusePx.push([sidelineLeftXpx, topYpx]);    // D

        // draw the shaded region
        court_g.append("polygon")
            .attr("class", "coral-chartreuse-region")
            .attr("points", coralChartreusePx.map(([x, y]) => `${x},${y}`).join(" "))
            .attr("fill", "#832f0b")   // choose any color you like
            .attr("opacity", 0.6)
            .attr("stroke", "none");

        // compute area in feet^2 and log it
        const coralChartreuseFeet = coralChartreusePx.map(([x, y]) => [
            court_xScale.invert(x),
            court_yScale.invert(y)
        ]);

        const areaCoralChartreuseFt2 = polygonAreaFeet(coralChartreuseFeet);
        console.log(
            "AREA 1 left corner-3 box ≈",
            areaCoralChartreuseFt2.toFixed(2),
            "square feet"
        );
    }


    // right horizontal: from right sideline (25) to right corner 3 vertical (22)
    court_g.append("line")
        .attr("x1", court_xScale(sidelineRightFt))
        .attr("y1", court_yScale(bandYFt))
        .attr("x2", court_xScale(22))
        .attr("y2", court_yScale(bandYFt))
        .style("stroke", "black")
        .style("stroke-width", 1);

    // ----- SHADE REGION: between AQUA band (y=10) and CYAN corner-3 line (x=22),
    // bounded by right sideline and baseline -----
    {
        // y positions in feet
        const topYFt = bandYFt;   // 10  (aqua band)
        const bottomYFt = -4;     // baseline

        // x positions in feet
        const cornerRightFt = 22;   // cyan vertical
        const sidelineRightFtLocal = 25; // right sideline

        // convert to pixels
        const topYpx = court_yScale(topYFt);
        const bottomYpx = court_yScale(bottomYFt);
        const cornerRightXpx = court_xScale(cornerRightFt);
        const sidelineRightXpx = court_xScale(sidelineRightFtLocal);

        // polygon in pixel space:
        // (22, -4) -> (25, -4) -> (25, 10) -> (22, 10)
        const aquaCyanPx = [];
        aquaCyanPx.push([cornerRightXpx,  bottomYpx]); // A
        aquaCyanPx.push([sidelineRightXpx, bottomYpx]); // B
        aquaCyanPx.push([sidelineRightXpx, topYpx]);    // C
        aquaCyanPx.push([cornerRightXpx,  topYpx]);     // D

        // draw the shaded region
        court_g.append("polygon")
            .attr("class", "aqua-cyan-region")
            .attr("points", aquaCyanPx.map(([x, y]) => `${x},${y}`).join(" "))
            .attr("fill", "#ff8000")   // pick any color you like
            .attr("opacity", 0.6)
            .attr("stroke", "none");

        // compute area in feet^2 and log it
        const aquaCyanFeet = aquaCyanPx.map(([x, y]) => [
            court_xScale.invert(x),
            court_yScale.invert(y)
        ]);

        const areaAquaCyanFt2 = polygonAreaFeet(aquaCyanFeet);
        console.log(
            "AREA 2 right corner-3 box ≈",
            areaAquaCyanFt2.toFixed(2),
            "square feet"
        );
    }


    // ----- divide the paint (both boxes) horizontally in half -----
    const laneTopFt = -4;   // bottom of paint in your coords
    const laneBottomFt = 15;   // top of paint (free throw line)
    const midYFt = (laneTopFt + laneBottomFt) / 2;  // 5.5

    court_g.append("line")
        .attr("x1", court_xScale(laneLeftFt))
        .attr("y1", court_yScale(midYFt))
        .attr("x2", court_xScale(laneRightFt))
        .attr("y2", court_yScale(midYFt))
        .style("stroke", "black")
        .style("stroke-width", 1);

    court_g.append("line")
        .attr("x1", court_xScale(laneLeftFt))
        .attr("y1", court_yScale(midYFt))
        .attr("x2", court_xScale(laneRightFt))
        .attr("y2", court_yScale(midYFt))
        .style("stroke", "black")
        .style("stroke-width", 1);

    // ----- SHADE REGION: between ORCHID line (y = midYFt) and TOP OF PAINT (y = laneBottomFt) -----
    {
        const topYFt = midYFt;        // orchid line (5.5 ft)
        const bottomYFt = laneBottomFt; // top of paint (15 ft)
        const leftXFt = laneLeftFt;   // -8 ft
        const rightXFt = laneRightFt; //  8 ft

        const topYpx = court_yScale(topYFt);
        const bottomYpx = court_yScale(bottomYFt);
        const leftXpx = court_xScale(leftXFt);
        const rightXpx = court_xScale(rightXFt);

        // polygon in pixel space: (-8, 5.5) -> (8, 5.5) -> (8, 15) -> (-8, 15)
        const orchidPaintPx = [];
        orchidPaintPx.push([leftXpx,  topYpx]);    // A
        orchidPaintPx.push([rightXpx, topYpx]);    // B
        orchidPaintPx.push([rightXpx, bottomYpx]); // C
        orchidPaintPx.push([leftXpx,  bottomYpx]); // D

        // draw the shaded region
        court_g.append("polygon")
            .attr("class", "orchid-top-paint-region")
            .attr("points", orchidPaintPx.map(([x, y]) => `${x},${y}`).join(" "))
            .attr("fill", "#8821d5")   // choose any color you like
            .attr("opacity", 0.6)
            .attr("stroke", "none");

        // compute area in feet^2 and log it
        const orchidPaintFeet = orchidPaintPx.map(([x, y]) => [
            court_xScale.invert(x),
            court_yScale.invert(y)
        ]);

        const areaOrchidPaintFt2 = polygonAreaFeet(orchidPaintFeet);
        console.log(
            "AREA 6 top of the paint ≈",
            areaOrchidPaintFt2.toFixed(2),
            "square feet"
        );
    }

    // ----- SHADE REGION: between SIENNA line (midYFt) and BOTTOM OF PAINT (laneTopFt) -----
    {
        const topYFt = laneTopFt;     // bottom of paint, y = -4
        const bottomYFt = midYFt;     // sienna/mid line, y = 5.5
        const leftXFt = laneLeftFt;   // -8 ft
        const rightXFt = laneRightFt; //  8 ft

        const topYpx = court_yScale(topYFt);
        const bottomYpx = court_yScale(bottomYFt);
        const leftXpx = court_xScale(leftXFt);
        const rightXpx = court_xScale(rightXFt);

        // polygon in pixel space: (-8, -4) -> (8, -4) -> (8, 5.5) -> (-8, 5.5)
        const siennaBottomPaintPx = [];
        siennaBottomPaintPx.push([leftXpx,  topYpx]);    // A
        siennaBottomPaintPx.push([rightXpx, topYpx]);    // B
        siennaBottomPaintPx.push([rightXpx, bottomYpx]); // C
        siennaBottomPaintPx.push([leftXpx,  bottomYpx]); // D

        // draw the shaded region
        court_g.append("polygon")
            .attr("class", "sienna-bottom-paint-region")
            .attr("points", siennaBottomPaintPx.map(([x, y]) => `${x},${y}`).join(" "))
            .attr("fill", "#a0522d")   // sienna-like color; tweak if you want
            .attr("opacity", 0.6)
            .attr("stroke", "none");

        // compute area in feet^2 and log it
        const siennaBottomPaintFeet = siennaBottomPaintPx.map(([x, y]) => [
            court_xScale.invert(x),
            court_yScale.invert(y)
        ]);

        const areaSiennaBottomPaintFt2 = polygonAreaFeet(siennaBottomPaintFeet);
        console.log(
            "AREA 5 bottom of the paint ≈",
            areaSiennaBottomPaintFt2.toFixed(2),
            "square feet"
        );
    }


    // ----- intersections of basket→paint-corner rays with 3pt arc -----
    const circleCenter = {
        x: court_xScale(0),
        y: court_yScale(0)
    };
    const circleRadius = dis;

// basket center in pixels
    const basketCenter = {
        x: court_xScale(0),
        y: court_yScale(-0.75)
    };

// top corners of the outer paint (in feet)
    const paintTopLeftFt  = { x: -8, y: 15 };
    const paintTopRightFt = { x:  8, y: 15 };

    const paintTopLeftPx = {
        x: court_xScale(paintTopLeftFt.x),
        y: court_yScale(paintTopLeftFt.y)
    };
    const paintTopRightPx = {
        x: court_xScale(paintTopRightFt.x),
        y: court_yScale(paintTopRightFt.y)
    };

// helper: extend a ray from P through Q well beyond the 3pt line
    function extendRay(P, Q, factor = 10) {
        return {
            x: P.x + (Q.x - P.x) * factor,
            y: P.y + (Q.y - P.y) * factor
        };
    }

// intersections with the 3pt arc, along basket→paint-corner rays
    const Iright = lineCircleIntersection(
        basketCenter,
        extendRay(basketCenter, paintTopRightPx),
        circleCenter,
        circleRadius
    );
    const Ileft = lineCircleIntersection(
        basketCenter,
        extendRay(basketCenter, paintTopLeftPx),
        circleCenter,
        circleRadius
    );



    // rectangle for the OUTER PAINT in *pixel* space
    const paintRectPx = {
        xMin: court_xScale(-8),
        xMax: court_xScale(8),
        yMin: court_yScale(-4),
        yMax: court_yScale(15)
    };

    // ----- center vertical line: from PAINT EDGE up to half court -----
    // ----- center vertical ORANGE line: basket → middle of 3-pt arc -----
    // shoot a vertical ray DOWNWARD from the basket so it crosses the arc
    const centerRayFar = {
        x: basketCenter.x,
        y: basketCenter.y + 1000   // big number so we go well past the arc
    };

    // intersection of that vertical ray with the 3-pt circle
    const centerI = lineCircleIntersection(
        basketCenter,
        centerRayFar,
        circleCenter,
        circleRadius
    );

    // only draw the CENTER line from the TOP OF THE PAINT up to half court
    const centerTopPx = {
        x: basketCenter.x,             // x = 0 in feet
        y: court_yScale(halfCourtY)    // y = 43 in feet
    };

    // top-center of the paint (free-throw line) in pixels
    const centerPaintEdgePx = {
        x: court_xScale(0),
        y: court_yScale(15)            // y = 15 ft = top of the paint
    };

    if (centerI) {
        court_g.append("line")
            .attr("x1", centerPaintEdgePx.x)  // start at paint edge
            .attr("y1", centerPaintEdgePx.y)
            .attr("x2", centerTopPx.x)        // end at half-court
            .attr("y2", centerTopPx.y)
            .style("stroke", "black")
            .style("stroke-width", 1);
    }



    // ----- SHADE REGION: between ORANGE center line and RED left line,
    // above the paint (y >= 15) up to the 3-pt arc -----
    if (centerI && Ileft) {

        // top middle of the paint in *pixel* space
        const topCenterPaintPx = {
            x: court_xScale(0),
            y: court_yScale(15)
        };

        // build polygon in *pixel* space
        const wedgePtsPx = [];

        // 1) start at top center of the paint
        wedgePtsPx.push([topCenterPaintPx.x, topCenterPaintPx.y]);

        // 2) go up the ORANGE center line to where it hits the arc
        wedgePtsPx.push([centerI.x, centerI.y]);

        // 3) follow the 3-pt arc from centerI over to Ileft
        const angleCenterDeg = Math.atan2(
            centerI.y - circleCenter.y,
            centerI.x - circleCenter.x
        ) * 180 / Math.PI;

        const angleIleftDeg = Math.atan2(
            Ileft.y - circleCenter.y,
            Ileft.x - circleCenter.x
        ) * 180 / Math.PI;

        const arcPts = sampleArcPixels(
            circleCenter,
            circleRadius,
            angleCenterDeg,
            angleIleftDeg,
            40   // number of samples along the arc
        );

        arcPts.forEach(p => {
            wedgePtsPx.push([p.x, p.y]);
        });

        // 4) down the RED line to the top-left corner of the paint
        wedgePtsPx.push([paintTopLeftPx.x, paintTopLeftPx.y]);

        // 5) closing the polygon implicitly adds the top-of-paint segment
        //    from paintTopLeftPx back to topCenterPaintPx.

        // ---- draw the shaded region ----
        court_g.append("polygon")
            .attr("class", "orange-red-center-region")
            .attr("points", wedgePtsPx.map(([x, y]) => `${x},${y}`).join(" "))
            .attr("fill", "#d5974f")   // choose any color you like
            .attr("opacity", 0.6)
            .attr("stroke", "none");

        // ---- compute area in feet^2 and log it ----
        const wedgePtsFeet = wedgePtsPx.map(([x, y]) => [
            court_xScale.invert(x),
            court_yScale.invert(y)
        ]);

        const areaFt2 = polygonAreaFeet(wedgePtsFeet);
        console.log(
            "Area 9 left of top of the key under left middle of 3 point arc (inside 3-pt line, excluding paint) ≈",
            areaFt2.toFixed(2),
            "square feet"
        );
    }

    // ----- SHADE REGION (RIGHT SIDE): between ORANGE center line and RIGHT black line,
    // above the paint (y >= 15) up to the 3-pt arc -----
    if (centerI && Iright) {

        // top middle of the paint in *pixel* space
        const topCenterPaintPx = {
            x: court_xScale(0),
            y: court_yScale(15)
        };

        // build polygon in *pixel* space
        const wedgePtsPx = [];

        // 1) start at top center of the paint
        wedgePtsPx.push([topCenterPaintPx.x, topCenterPaintPx.y]);

        // 2) go up the ORANGE center line to where it hits the arc
        wedgePtsPx.push([centerI.x, centerI.y]);

        // 3) follow the 3-pt arc from centerI over to Iright
        const angleCenterDeg = Math.atan2(
            centerI.y - circleCenter.y,
            centerI.x - circleCenter.x
        ) * 180 / Math.PI;

        const angleIrightDeg = Math.atan2(
            Iright.y - circleCenter.y,
            Iright.x - circleCenter.x
        ) * 180 / Math.PI;

        const arcPtsRight = sampleArcPixels(
            circleCenter,
            circleRadius,
            angleCenterDeg,
            angleIrightDeg,
            40   // number of samples along the arc
        );
        arcPtsRight.forEach(p => {
            wedgePtsPx.push([p.x, p.y]);
        });

        // 4) down the RIGHT black line to the top-right corner of the paint
        wedgePtsPx.push([paintTopRightPx.x, paintTopRightPx.y]);

        // 5) closing the polygon implicitly adds the top-of-paint segment
        //    from paintTopRightPx back to topCenterPaintPx.

        // ---- draw the shaded region (use a different color) ----
        court_g.append("polygon")
            .attr("class", "orange-black-center-region-right")
            .attr("points", wedgePtsPx.map(([x, y]) => `${x},${y}`).join(" "))
            .attr("fill", "#3f8dcd")   // light blue; change if you want
            .attr("opacity", 0.6)
            .attr("stroke", "none");

        // ---- compute area in feet^2 and log it ----
        const wedgePtsFeet = wedgePtsPx.map(([x, y]) => [
            court_xScale.invert(x),
            court_yScale.invert(y)
        ]);

        const areaFt2 = polygonAreaFeet(wedgePtsFeet);
        console.log(
            "Area 10 right of top of the key under right middle of 3 point arc (inside 3-pt line, excluding paint) ≈",
            areaFt2.toFixed(2),
            "square feet"
        );
    }


    // extend those lines from arc to half court (these already start outside paint)
    const halfCourtYpx = court_yScale(halfCourtY);

    if (Iright) {
        const dirRight = {
            x: Iright.x - basketCenter.x,
            y: Iright.y - basketCenter.y
        };

        const tExtRight = (halfCourtYpx - Iright.y) / dirRight.y;
        const extendedRight = {
            x: Iright.x + tExtRight * dirRight.x,
            y: halfCourtYpx
        };

        // draw from TOP-RIGHT CORNER OF THE PAINT to half court
        court_g.append("line")
            .attr("x1", paintTopRightPx.x)   // start at paint corner
            .attr("y1", paintTopRightPx.y)
            .attr("x2", extendedRight.x)     // end at half-court
            .attr("y2", extendedRight.y)
            .style("stroke", "black")
            .style("stroke-width", 1);
    }

    if (Ileft) {
        const dirLeft = {
            x: Ileft.x - basketCenter.x,
            y: Ileft.y - basketCenter.y
        };

        const tExtLeft = (halfCourtYpx - Ileft.y) / dirLeft.y;
        const extendedLeft = {
            x: Ileft.x + tExtLeft * dirLeft.x,
            y: halfCourtYpx
        };

        // draw from TOP-LEFT CORNER OF THE PAINT to half court
        court_g.append("line")
            .attr("x1", paintTopLeftPx.x)    // start at paint corner
            .attr("y1", paintTopLeftPx.y)
            .attr("x2", extendedLeft.x)      // end at half-court
            .attr("y2", extendedLeft.y)
            .style("stroke", "black")
            .style("stroke-width", 1);
    }


    // ----- SHADE REGION (OUTSIDE 3PT): between ORANGE center line and RED left line,
    // from the 3-pt arc up to the half-court line -----
    if (centerI && Ileft) {

        // top points on half-court line for center and left ray
        const halfCourtYpxOuter = court_yScale(halfCourtY);

        // left sideline x in pixels
        const sidelineLeftPxX = court_xScale(-25);

        // top point on half court at center line
        const centerTopPxOuter = {
            x: basketCenter.x,       // x = 0
            y: halfCourtYpxOuter     // y at half court
        };

        // where the LEFT ray hits half court (same logic as extendedLeft above)
        const dirLeftOuter = {
            x: Ileft.x - basketCenter.x,
            y: Ileft.y - basketCenter.y
        };
        const tExtLeftOuter = (halfCourtYpxOuter - Ileft.y) / dirLeftOuter.y;
        const extLeftOuter = {
            x: Ileft.x + tExtLeftOuter * dirLeftOuter.x,
            y: halfCourtYpxOuter
        };

        // build polygon in *pixel* space:
        // centerTop → extLeft → Ileft → arc back to centerI → centerTop
        const wedgeOuterPx = [];

        // 1) top on half court at center line
        wedgeOuterPx.push([centerTopPxOuter.x, centerTopPxOuter.y]);

        // 2) top where left ray hits half court
        wedgeOuterPx.push([extLeftOuter.x, extLeftOuter.y]);

        // 3) down the red left line to the 3-pt arc intersection
        wedgeOuterPx.push([Ileft.x, Ileft.y]);

        // 4) follow the 3-pt arc from Ileft back to centerI
        const angleIleftDeg = Math.atan2(
            Ileft.y - circleCenter.y,
            Ileft.x - circleCenter.x
        ) * 180 / Math.PI;

        const angleCenterDeg = Math.atan2(
            centerI.y - circleCenter.y,
            centerI.x - circleCenter.x
        ) * 180 / Math.PI;

        const arcOuterPts = sampleArcPixels(
            circleCenter,
            circleRadius,
            angleIleftDeg,
            angleCenterDeg,
            40   // number of samples along the arc
        );
        arcOuterPts.forEach(p => {
            wedgeOuterPx.push([p.x, p.y]);
        });

        // 5) (optional) ensure we explicitly include centerI
        wedgeOuterPx.push([centerI.x, centerI.y]);
        // polygon will close back up to centerTopPxOuter

        // ---- draw the shaded region ----
        court_g.append("polygon")
            .attr("class", "orange-red-outer-region")
            .attr("points", wedgeOuterPx.map(([x, y]) => `${x},${y}`).join(" "))
            .attr("fill", "#3b8c25")    // pick any color you like
            .attr("opacity", 0.6)
            .attr("stroke", "none");

        // ---- compute area in feet^2 and log it ----
        const wedgeOuterFeet = wedgeOuterPx.map(([x, y]) => [
            court_xScale.invert(x),
            court_yScale.invert(y)
        ]);

        const areaOuterFt2 = polygonAreaFeet(wedgeOuterFeet);
        console.log(
            "AREA 13 (outside 3pt) left top of the key 3 pointer ≈",
            areaOuterFt2.toFixed(2),
            "square feet"
        );
    }

    // ----- SHADE REGION (OUTSIDE 3PT): between YELLOW center line and ORANGE right line,
    // from the 3-pt arc up to the half-court line -----
    if (centerI && Iright) {

        // y of half-court in pixels
        const halfCourtYpxOuter = court_yScale(halfCourtY);

        // top point on half court along the center (yellow) line
        const centerTopPxOuter = {
            x: basketCenter.x,       // x = 0
            y: halfCourtYpxOuter
        };

        // where the RIGHT (orange) ray hits half court
        const dirRightOuter = {
            x: Iright.x - basketCenter.x,
            y: Iright.y - basketCenter.y
        };
        const tExtRightOuter = (halfCourtYpxOuter - Iright.y) / dirRightOuter.y;
        const extRightOuter = {
            x: Iright.x + tExtRightOuter * dirRightOuter.x,
            y: halfCourtYpxOuter
        };

        // build polygon in *pixel* space:
        // centerTop → extRight → Iright → arc back to centerI → centerTop
        const wedgeOuterPxRight = [];

        // 1) top on half court at center (yellow) line
        wedgeOuterPxRight.push([centerTopPxOuter.x, centerTopPxOuter.y]);

        // 2) top where the orange ray hits half court
        wedgeOuterPxRight.push([extRightOuter.x, extRightOuter.y]);

        // 3) down the orange right line to the 3-pt arc intersection
        wedgeOuterPxRight.push([Iright.x, Iright.y]);

        // 4) follow the 3-pt arc from Iright back to centerI
        const angleIrightDeg = Math.atan2(
            Iright.y - circleCenter.y,
            Iright.x - circleCenter.x
        ) * 180 / Math.PI;

        const angleCenterDeg = Math.atan2(
            centerI.y - circleCenter.y,
            centerI.x - circleCenter.x
        ) * 180 / Math.PI;

        const arcOuterPtsRight = sampleArcPixels(
            circleCenter,
            circleRadius,
            angleIrightDeg,
            angleCenterDeg,
            40   // number of samples along the arc
        );
        arcOuterPtsRight.forEach(p => {
            wedgeOuterPxRight.push([p.x, p.y]);
        });

        // 5) explicitly include centerI
        wedgeOuterPxRight.push([centerI.x, centerI.y]);
        // polygon will close back up to centerTopPxOuter

        // ---- draw the shaded region ----
        court_g.append("polygon")
            .attr("class", "yellow-orange-outer-region")
            .attr("points", wedgeOuterPxRight.map(([x, y]) => `${x},${y}`).join(" "))
            .attr("fill", "#e412e4")   // nice yellow; tweak if you want
            .attr("opacity", 0.6)
            .attr("stroke", "none");

        // ---- compute area in feet^2 and log it ----
        const wedgeOuterFeetRight = wedgeOuterPxRight.map(([x, y]) => [
            court_xScale.invert(x),
            court_yScale.invert(y)
        ]);

        const areaOuterFt2Right = polygonAreaFeet(wedgeOuterFeetRight);
        console.log(
            "AREA 14 (outside 3pt) right top of the key 3 pointer ≈",
            areaOuterFt2Right.toFixed(2),
            "square feet"
        );
    }

    // ----- SHADE REGION (OUTSIDE 3PT): between YELLOW hash and PURPLE left ray,
    // from the hash up to half court -----
    if (Ileft) {

        const halfCourtYpxOuter = court_yScale(halfCourtY);

        // left sideline x in pixels
        const sidelineLeftPxX = court_xScale(-25);

        // point on sideline at the yellow hash (same y as Ileft)
        const sidelineHashPx = {
            x: sidelineLeftPxX,
            y: Ileft.y
        };

        // point on sideline at half court
        const sidelineTopPx = {
            x: sidelineLeftPxX,
            y: halfCourtYpxOuter
        };

        // where the PURPLE left ray hits half court
        const dirLeftOuter2 = {
            x: Ileft.x - basketCenter.x,
            y: Ileft.y - basketCenter.y
        };
        const tExtLeftOuter2 = (halfCourtYpxOuter - Ileft.y) / dirLeftOuter2.y;
        const extLeftOuter2 = {
            x: Ileft.x + tExtLeftOuter2 * dirLeftOuter2.x,
            y: halfCourtYpxOuter
        };

        // Polygon in pixel space: sideline@hash -> Ileft -> extLeft@half -> sideline@half
        const yellowPurplePx = [];
        yellowPurplePx.push([sidelineHashPx.x, sidelineHashPx.y]);  // A
        yellowPurplePx.push([Ileft.x, Ileft.y]);                    // B
        yellowPurplePx.push([extLeftOuter2.x, extLeftOuter2.y]);    // C
        yellowPurplePx.push([sidelineTopPx.x, sidelineTopPx.y]);    // D


    }


    // ----- SHADE REGION (OUTSIDE 3PT): between PURPLE right ray and YELLOW right hash,
    // from the hash up to the half-court line -----
    if (Iright) {

        const halfCourtYpxOuter = court_yScale(halfCourtY);

        // right sideline x in pixels
        const sidelineRightPxX = court_xScale(25);

        // point on sideline at the yellow hash (same y as Iright)
        const sidelineHashRightPx = {
            x: sidelineRightPxX,
            y: Iright.y
        };

        // point on sideline at half court
        const sidelineTopRightPx = {
            x: sidelineRightPxX,
            y: halfCourtYpxOuter
        };

        // where the PURPLE right ray hits half court
        const dirRightOuter2 = {
            x: Iright.x - basketCenter.x,
            y: Iright.y - basketCenter.y
        };
        const tExtRightOuter2 = (halfCourtYpxOuter - Iright.y) / dirRightOuter2.y;
        const extRightOuter2 = {
            x: Iright.x + tExtRightOuter2 * dirRightOuter2.x,
            y: halfCourtYpxOuter
        };

        // Polygon in pixel space:
        // sideline@hash -> Iright -> extRight@half -> sideline@half
        const purpleYellowPx = [];
        purpleYellowPx.push([sidelineHashRightPx.x, sidelineHashRightPx.y]); // A
        purpleYellowPx.push([Iright.x, Iright.y]);                           // B
        purpleYellowPx.push([extRightOuter2.x, extRightOuter2.y]);           // C
        purpleYellowPx.push([sidelineTopRightPx.x, sidelineTopRightPx.y]);   // D


    }


    // ----- lines from PAINT EDGE to tops of corner-3 verticals (stop at 3pt line) -----
    const cornerLeftXFt = -22;
    const cornerLeftYFt = 10;
    const cornerRightXFt = 22;
    const cornerRightYFt = 10;

    const cornerLeftPx = {
        x: court_xScale(cornerLeftXFt),
        y: court_yScale(cornerLeftYFt)
    };
    const cornerRightPx = {
        x: court_xScale(cornerRightXFt),
        y: court_yScale(cornerRightYFt)
    };

    // where the orange ray (basket -> cornerLeft) exits the paint rectangle
    const orangeExit = lineRectExitPoint(
        basketCenter,
        cornerLeftPx,
        paintRectPx
    );

    // where the orange ray (basket -> cornerRight) exits the paint rectangle
    const orangeExit1 = lineRectExitPoint(
        basketCenter,
        cornerRightPx,
        paintRectPx
    );



    // ----- rays from the EDGE OF THE PAINT to the corner-3 tops -----

    // helper: intersection of basket→corner ray with a vertical line x = laneX
    function intersectWithVertical(basket, corner, laneX) {
        const t = (laneX - basket.x) / (corner.x - basket.x);
        return {
            x: laneX,
            y: basket.y + t * (corner.y - basket.y)
        };
    }

    // lane left/right x positions in pixels (edges of the outer paint)
    const laneLeftXpx  = paintRectPx.xMin; // x = -8 ft
    const laneRightXpx = paintRectPx.xMax; // x =  8 ft

    // where the basket→corner rays exit the paint
    const leftStartPx  = intersectWithVertical(basketCenter, cornerLeftPx,  laneLeftXpx);
    const rightStartPx = intersectWithVertical(basketCenter, cornerRightPx, laneRightXpx);

    // left ray: from left paint edge to left corner-3 top
    court_g.append("line")
        .attr("x1", leftStartPx.x)
        .attr("y1", leftStartPx.y)
        .attr("x2", cornerLeftPx.x)
        .attr("y2", cornerLeftPx.y)
        .style("stroke", "black")
        .style("stroke-width", 1);

    // ----- SHADE REGION: between MAROON corner-3 line and MAGENTA ray,
    // from baseline (y = -4) up to the corner-3 top (y = 10), outside the paint -----
    if (leftStartPx) {

        // bottom of the paint / baseline in feet (already used above)
        const baselineYFt = laneTopFt;   // -4
        const baselineYpx = court_yScale(baselineYFt);

        // bottom points on baseline:
        // lane-left edge (x = -8) and corner-3 foot (x = -22)
        const laneLeftBottomPx = {
            x: court_xScale(laneLeftFt),       // -8
            y: baselineYpx
        };

        const maroonBottomPx = {
            x: court_xScale(cornerLeftXFt),    // -22
            y: baselineYpx
        };

        // we already have:
        //   cornerLeftPx: (-22, 10) in pixel space (corner-3 top)
        //   leftStartPx:  intersection of basket→corner ray with x = -8

        // Polygon in pixel space:
        // lane-left baseline -> maroon baseline -> corner 3 top -> magenta start -> back
        const maroonMagentaPx = [];
        maroonMagentaPx.push([laneLeftBottomPx.x, laneLeftBottomPx.y]); // A: (-8, -4)
        maroonMagentaPx.push([maroonBottomPx.x,    maroonBottomPx.y]);  // B: (-22, -4)
        maroonMagentaPx.push([cornerLeftPx.x,      cornerLeftPx.y]);    // C: (-22, 10)
        maroonMagentaPx.push([leftStartPx.x,       leftStartPx.y]);     // D: (-8, ~3.16)

        // ---- draw the shaded region ----
        court_g.append("polygon")
            .attr("class", "maroon-magenta-region")
            .attr("points", maroonMagentaPx.map(([x, y]) => `${x},${y}`).join(" "))
            .attr("fill", "#ff0000")   // pick any color you like
            .attr("opacity", 0.6)
            .attr("stroke", "none");

        // ---- compute area in feet^2 and log it ----
        const maroonMagentaFeet = maroonMagentaPx.map(([x, y]) => [
            court_xScale.invert(x),
            court_yScale.invert(y)
        ]);

        const areaMaroonMagentaFt2 = polygonAreaFeet(maroonMagentaFeet);
        console.log(
            "AREA 3 left mid post area ≈",
            areaMaroonMagentaFt2.toFixed(2),
            "square feet"
        );
    }


    // right ray: from right paint edge to right corner-3 top
    court_g.append("line")
        .attr("x1", rightStartPx.x)
        .attr("y1", rightStartPx.y)
        .attr("x2", cornerRightPx.x)
        .attr("y2", cornerRightPx.y)
        .style("stroke", "black")
        .style("stroke-width", 1);

    // ----- SHADE REGION: between LIME corner-3 line and FUCHSIA ray,
    // from baseline (y = -4) up to the corner-3 top (y = 10), outside the paint -----
    if (rightStartPx) {

        // bottom of the paint / baseline in feet
        const baselineYFt = laneTopFt;   // -4
        const baselineYpx = court_yScale(baselineYFt);

        // bottom points on baseline:
        // lane-right edge (x = 8) and corner-3 foot (x = 22)
        const laneRightBottomPx = {
            x: court_xScale(laneRightFt),      //  8
            y: baselineYpx
        };

        const limeBottomPx = {
            x: court_xScale(cornerRightXFt),   // 22
            y: baselineYpx
        };

        // we already have:
        //   cornerRightPx: (22, 10) in pixel space (corner-3 top)
        //   rightStartPx:  intersection of basket→cornerRight ray with x = 8

        // Polygon in pixel space:
        // lane-right baseline -> lime baseline -> corner 3 top -> fuchsia start -> back
        const limeFuchsiaPx = [];
        limeFuchsiaPx.push([laneRightBottomPx.x, laneRightBottomPx.y]); // A: (8, -4)
        limeFuchsiaPx.push([limeBottomPx.x,      limeBottomPx.y]);      // B: (22, -4)
        limeFuchsiaPx.push([cornerRightPx.x,     cornerRightPx.y]);     // C: (22, 10)
        limeFuchsiaPx.push([rightStartPx.x,      rightStartPx.y]);      // D: (8, ~3.16)

        // ---- draw the shaded region ----
        court_g.append("polygon")
            .attr("class", "lime-fuchsia-region")
            .attr("points", limeFuchsiaPx.map(([x, y]) => `${x},${y}`).join(" "))
            .attr("fill", "#80ffc0")   // pick any color you like
            .attr("opacity", 0.6)
            .attr("stroke", "none");

        // ---- compute area in feet^2 and log it ----
        const limeFuchsiaFeet = limeFuchsiaPx.map(([x, y]) => [
            court_xScale.invert(x),
            court_yScale.invert(y)
        ]);

        const areaLimeFuchsiaFt2 = polygonAreaFeet(limeFuchsiaFeet);
        console.log(
            "AREA 4 right mid post area ≈",
            areaLimeFuchsiaFt2.toFixed(2),
            "square feet"
        );
    }




    // ----- SHADE + AREA: region between ORANGE band (y=10) and RED hash (y=Ileft),
    // bounded by left sideline and 3-pt arc, excluding the paint (y >= 10) -----
    if (Ileft) {

        // left sideline x in feet
        const sidelineLeftFt = -25;

        // key points in *pixel* space
        const sidelineOrangePx = {
            x: court_xScale(sidelineLeftFt),
            y: court_yScale(bandYFt)          // y = 10 (orange line)
        };

        const sidelineRedPx = {
            x: court_xScale(sidelineLeftFt),
            y: Ileft.y                         // same y as the red hash
        };

        // we already have cornerLeftPx (x = -22, y = 10) and Ileft on the arc

        // build polygon in *pixel* space for the strip:
        // sideline @ orange → corner 3 → arc → Ileft → sideline @ red
        const stripPtsPx = [];

        // 1) start on sideline at orange line
        stripPtsPx.push([sidelineOrangePx.x, sidelineOrangePx.y]);

        // 2) go along the orange horizontal to the corner three top
        stripPtsPx.push([cornerLeftPx.x, cornerLeftPx.y]);  // (-22, 10) on 3-pt line

        // 3) follow the 3-pt arc from cornerLeft down to Ileft
        const angleCornerLeftDeg = Math.atan2(
            cornerLeftPx.y - circleCenter.y,
            cornerLeftPx.x - circleCenter.x
        ) * 180 / Math.PI;

        const angleIleftDeg = Math.atan2(
            Ileft.y - circleCenter.y,
            Ileft.x - circleCenter.x
        ) * 180 / Math.PI;

        const arcStripPts = sampleArcPixels(
            circleCenter,
            circleRadius,
            angleCornerLeftDeg,
            angleIleftDeg,
            40   // number of samples along that arc section
        );

        arcStripPts.forEach(p => {
            stripPtsPx.push([p.x, p.y]);
        });

        // 4) from arc point Ileft back along the red hash to the sideline
        stripPtsPx.push([Ileft.x, Ileft.y]);
        stripPtsPx.push([sidelineRedPx.x, sidelineRedPx.y]);

        // closing the polygon returns us to sidelineOrangePx


    }

    // RIGHT: region between orange band (y=10) and right black hash (Iright)
    if (Iright) {
        const sidelineRightFt = 25;

        const sidelineOrangePxRight = {
            x: court_xScale(sidelineRightFt),
            y: court_yScale(bandYFt)      // y = 10
        };

        const sidelineRedPxRight = {
            x: court_xScale(sidelineRightFt),
            y: Iright.y                   // same y as right hash
        };

        const stripPtsPxRight = [];

        // 1) sideline @ orange band (top of strip)
        stripPtsPxRight.push([sidelineOrangePxRight.x, sidelineOrangePxRight.y]);

        // 2) orange/black horizontal to right corner 3
        stripPtsPxRight.push([cornerRightPx.x, cornerRightPx.y]); // (22, 10) on arc

        // 3) along the 3-pt arc from cornerRight down to Iright
        const angleCornerRightDeg = Math.atan2(
            cornerRightPx.y - circleCenter.y,
            cornerRightPx.x - circleCenter.x
        ) * 180 / Math.PI;

        const angleIrightDeg = Math.atan2(
            Iright.y - circleCenter.y,
            Iright.x - circleCenter.x
        ) * 180 / Math.PI;

        const arcStripPtsRight = sampleArcPixels(
            circleCenter,
            circleRadius,
            angleCornerRightDeg,
            angleIrightDeg,
            40
        );
        arcStripPtsRight.forEach(p => {
            stripPtsPxRight.push([p.x, p.y]);
        });

        // 4) from Iright back along the right hash to the sideline
        stripPtsPxRight.push([Iright.x, Iright.y]);
        stripPtsPxRight.push([sidelineRedPxRight.x, sidelineRedPxRight.y]);

        // polygon closes back up the sideline to sidelineOrangePxRight
        // ----- COMBINED REGION (AREAS 11 + 13): LEFT SIDELINE -----
        // From y=10 (corner-3 band) up to half court,
        // bounded by: left sideline, corner-3 vertical, 3-pt arc, and left paint-corner ray.
        if (Ileft) {
            const halfCourtYpxOuter = court_yScale(halfCourtY);

            // left sideline x in pixels
            const sidelineLeftPxX = court_xScale(sidelineLeftFt); // sidelineLeftFt = -25

            // point on sideline at the orange band (y = 10)
            const sidelineOrangePxLeft = {
                x: sidelineLeftPxX,
                y: court_yScale(bandYFt)
            };

            // point on sideline at half court
            const sidelineTopLeftPx = {
                x: sidelineLeftPxX,
                y: halfCourtYpxOuter
            };

            // corner-3 top on the arc at (-22, 10)
            const cornerLeftPx = {
                x: court_xScale(-22),
                y: court_yScale(bandYFt)
            };

            // where the left paint-corner ray hits half court
            const dirLeftOuter2 = {
                x: Ileft.x - basketCenter.x,
                y: Ileft.y - basketCenter.y
            };
            const tExtLeftOuter2 = (halfCourtYpxOuter - Ileft.y) / dirLeftOuter2.y;
            const extLeftOuter2 = {
                x: Ileft.x + tExtLeftOuter2 * dirLeftOuter2.x,
                y: halfCourtYpxOuter
            };

            // Build combined polygon in pixel space:
            // sideline at y=10 -> corner-3 -> arc (corner->Ileft) -> ray to half -> sideline at half
            const combinedLeftPx = [];

            // 1) sideline @ y=10
            combinedLeftPx.push([sidelineOrangePxLeft.x, sidelineOrangePxLeft.y]);

            // 2) along horizontal to corner-3 vertical
            combinedLeftPx.push([cornerLeftPx.x, cornerLeftPx.y]);

            // 3) follow the 3-pt arc from cornerLeft up to Ileft
            const angleCornerLeftDeg = Math.atan2(
                cornerLeftPx.y - circleCenter.y,
                cornerLeftPx.x - circleCenter.x
            ) * 180 / Math.PI;

            const angleIleftDeg = Math.atan2(
                Ileft.y - circleCenter.y,
                Ileft.x - circleCenter.x
            ) * 180 / Math.PI;

            const arcCombinedLeft = sampleArcPixels(
                circleCenter,
                circleRadius,
                angleCornerLeftDeg,
                angleIleftDeg,
                40   // samples along arc
            );
            arcCombinedLeft.forEach(p => {
                combinedLeftPx.push([p.x, p.y]);
            });

            // 4) up the left paint-corner ray to half-court
            combinedLeftPx.push([extLeftOuter2.x, extLeftOuter2.y]);

            // 5) along left sideline back down to y=10
            combinedLeftPx.push([sidelineTopLeftPx.x, sidelineTopLeftPx.y]);
            // polygon closes back to sidelineOrangePxLeft

            // Draw combined shaded region for REGION 11 (old 11 + 13)
            court_g.append("polygon")
                .attr("class", "region-11-combined")
                .attr("points", combinedLeftPx.map(([x, y]) => `${x},${y}`).join(" "))
                .attr("fill", "#b38cff")   // any single uniform color you like
                .attr("opacity", 0.6)
                .attr("stroke", "none");

// Compute area in feet^2 and log it
            const combinedLeftFeet = combinedLeftPx.map(([x, y]) => [
                court_xScale.invert(x),
                court_yScale.invert(y)
            ]);

            const combinedLeftAreaFt2 = polygonAreaFeet(combinedLeftFeet);
            console.log(
                "AREA 11 (left sideline, combined from old 11 + 13) ≈",
                combinedLeftAreaFt2.toFixed(2),
                "square feet"
            );
            // treat this as the official area for region 11
            area11 = combinedLeftAreaFt2;

        }

        // ----- COMBINED REGION (AREAS 12 + 16): RIGHT SIDELINE -----
        // From y=10 (corner-3 band) up to half court,
        // bounded by: right sideline, corner-3 vertical, 3-pt arc, and right paint-corner ray.
        if (Iright) {
            const halfCourtYpxOuter = court_yScale(halfCourtY);

            // right sideline x in pixels
            const sidelineRightPxX = court_xScale(sidelineRightFt); // sidelineRightFt = 25

            // point on sideline at the orange band (y = 10)
            const sidelineOrangePxRight = {
                x: sidelineRightPxX,
                y: court_yScale(bandYFt)
            };

            // point on sideline at half court
            const sidelineTopRightPx = {
                x: sidelineRightPxX,
                y: halfCourtYpxOuter
            };

            // corner-3 top on the arc at (22, 10)
            const cornerRightPx = {
                x: court_xScale(22),
                y: court_yScale(bandYFt)
            };

            // where the right paint-corner ray hits half court
            const dirRightOuter2 = {
                x: Iright.x - basketCenter.x,
                y: Iright.y - basketCenter.y
            };
            const tExtRightOuter2 = (halfCourtYpxOuter - Iright.y) / dirRightOuter2.y;
            const extRightOuter2 = {
                x: Iright.x + tExtRightOuter2 * dirRightOuter2.x,
                y: halfCourtYpxOuter
            };

            // Build combined polygon in pixel space:
            // sideline @ y=10 -> corner-3 -> arc (corner->Iright) -> ray to half -> sideline at half
            const combinedRightPx = [];

            // 1) sideline @ y=10
            combinedRightPx.push([sidelineOrangePxRight.x, sidelineOrangePxRight.y]);

            // 2) along horizontal to corner-3 vertical
            combinedRightPx.push([cornerRightPx.x, cornerRightPx.y]);

            // 3) follow the 3-pt arc from cornerRight up to Iright
            const angleCornerRightDeg = Math.atan2(
                cornerRightPx.y - circleCenter.y,
                cornerRightPx.x - circleCenter.x
            ) * 180 / Math.PI;

            const angleIrightDeg = Math.atan2(
                Iright.y - circleCenter.y,
                Iright.x - circleCenter.x
            ) * 180 / Math.PI;

            const arcCombinedRight = sampleArcPixels(
                circleCenter,
                circleRadius,
                angleCornerRightDeg,
                angleIrightDeg,
                40
            );
            arcCombinedRight.forEach(p => {
                combinedRightPx.push([p.x, p.y]);
            });

            // 4) up the right paint-corner ray to half-court
            combinedRightPx.push([extRightOuter2.x, extRightOuter2.y]);

            // 5) along right sideline back down to y=10
            combinedRightPx.push([sidelineTopRightPx.x, sidelineTopRightPx.y]);
            // polygon closes back to sidelineOrangePxRight

            // Draw combined shaded region for REGION 12 (old 12 + 16)
            court_g.append("polygon")
                .attr("class", "region-12-combined")
                .attr("points", combinedRightPx.map(([x, y]) => `${x},${y}`).join(" "))
                .attr("fill", "#b38cff")
                .attr("opacity", 0.6)
                .attr("stroke", "none");

            // Compute area in feet^2 and log it
            const combinedRightFeet = combinedRightPx.map(([x, y]) => [
                court_xScale.invert(x),
                court_yScale.invert(y)
            ]);

            const combinedRightAreaFt2 = polygonAreaFeet(combinedRightFeet);
            console.log(
                "AREA 12 (right sideline, combined from old 12 + 16) ≈",
                combinedRightAreaFt2.toFixed(2),
                "square feet"
            );
            // treat this as the official area for region 12
            area12 = combinedRightAreaFt2;

        }


    }


    // ----- SHADE REGION: between orange (basket->corner 3) and red (basket->paintTopLeft->arc),
    // excluding the paint (only outside the lane) -----
    if (Ileft && orangeExit) {

        // build polygon in *pixel* space
        const wedgePts = [];

        // 1) start where the orange ray exits the paint on the left lane line
        wedgePts.push([orangeExit.x, orangeExit.y]);

        // 2) go up to the top of the left corner 3 (orange line end)
        wedgePts.push([cornerLeftPx.x, cornerLeftPx.y]);

        // 3) follow the 3pt arc from cornerLeft to Ileft
        const angleCornerLeftDeg = Math.atan2(
            cornerLeftPx.y - circleCenter.y,
            cornerLeftPx.x - circleCenter.x
        ) * 180 / Math.PI;

        const angleIleftDeg = Math.atan2(
            Ileft.y - circleCenter.y,
            Ileft.x - circleCenter.x
        ) * 180 / Math.PI;

        const arcPts = sampleArcPixels(
            circleCenter,
            circleRadius,
            angleCornerLeftDeg,
            angleIleftDeg,
            40      // number of samples along the arc
        );

        arcPts.forEach(p => {
            wedgePts.push([p.x, p.y]);
        });

        // 4) down the red line from the arc intersection back to the top-left of the paint
        wedgePts.push([paintTopLeftPx.x, paintTopLeftPx.y]);

        // 5) when the polygon closes, SVG will draw the left lane edge
        //    from paintTopLeftPx back down to orangeExit (both are on x = lane left)

        court_g.append("polygon")
            .attr("class", "orange-red-region")
            .attr("points", wedgePts.map(([x, y]) => `${x},${y}`).join(" "))
            .attr("fill", "#ffcc80")   // pick any color you like
            .attr("opacity", 0.55)     // semi-transparent
            .attr("stroke", "none");
    }

    // ----- SHADE REGION (RIGHT SIDE):
    // between orange (basket->right corner 3) and red (basket->paintTopRight->arc),
    // excluding the paint (only outside the lane) -----
    if (Iright && orangeExit1) {

        // build polygon in *pixel* space
        const wedgePts = [];

        // 1) start where the orange ray exits the paint on the right lane line
        wedgePts.push([orangeExit1.x, orangeExit1.y]);

        // 2) go up to the top of the right corner 3 (orange line end)
        wedgePts.push([cornerRightPx.x, cornerRightPx.y]);

        // 3) follow the 3pt arc from cornerRight to Iright
        const angleCornerRightDeg = Math.atan2(
            cornerRightPx.y - circleCenter.y,
            cornerRightPx.x - circleCenter.x
        ) * 180 / Math.PI;

        const angleIrightDeg = Math.atan2(
            Iright.y - circleCenter.y,
            Iright.x - circleCenter.x
        ) * 180 / Math.PI;

        const arcPts = sampleArcPixels(
            circleCenter,
            circleRadius,
            angleCornerRightDeg,
            angleIrightDeg,
            40   // number of samples along the arc
        );

        arcPts.forEach(p => {
            wedgePts.push([p.x, p.y]);
        });

        // 4) down the red line from the arc intersection back to the top-right of the paint
        wedgePts.push([paintTopRightPx.x, paintTopRightPx.y]);

        // 5) when the polygon closes, SVG will draw the right lane edge
        //    from paintTopRightPx back down to orangeExit (both are on x = lane right)

        court_g.append("polygon")
            .attr("class", "orange-red-region-right")
            .attr("points", wedgePts.map(([x, y]) => `${x},${y}`).join(" "))
            .attr("fill", "#cce5ff")   // ⬅ different color; tweak as you like
            .attr("opacity", 0.55)
            .attr("stroke", "none");
    }




    // ----- REGION LABELS ONLY (no COURT_REGIONS polygons) -----
// We still use COURT_REGIONS from regions.js just for label positions & ids.
    if (typeof window !== 'undefined' && window.COURT_REGIONS) {

        // use *all* regions, including 13
        const regions = window.COURT_REGIONS;

        // helpers to convert court coords (feet) -> pixel coords
        const px = x => court_xScale(x);
        const py = y => court_yScale(y);

        // --- Numeric labels only, no filled polygons ---
        const labels = court_g.selectAll('.region-label')
            .data(regions, d => d.id);

        labels.exit().remove();

        labels.enter()
            .append('text')
            .attr('class', 'region-label')
            .merge(labels)
            .attr('x', d => px(d.labelX))
            .attr('y', d => py(d.labelY) + 4)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('pointer-events', 'none')
            .text(d => d.id);
    }


}



// -------------------------------------------------------------------
//   HELPERS
// -------------------------------------------------------------------

// Line–circle intersection in *pixel* space.
// P, Q, C are {x, y} objects; R is radius in pixels.
function lineCircleIntersection(P, Q, C, R) {
    const dx = Q.x - P.x;
    const dy = Q.y - P.y;

    const fx = P.x - C.x;
    const fy = P.y - C.y;

    const a = dx*dx + dy*dy;
    const b = 2 * (fx*dx + fy*dy);
    const c = fx*fx + fy*fy - R*R;

    const disc = b*b - 4*a*c;
    if (disc < 0) return null; // no intersection

    const sqrtD = Math.sqrt(disc);
    const t1 = (-b - sqrtD) / (2*a);
    const t2 = (-b + sqrtD) / (2*a);

    // choose a t >= 0 (going outward from P)
    let t = null;
    if (t1 >= 0 && t1 <= 1) t = t1;
    else if (t2 >= 0 && t2 <= 1) t = t2;
    else if (t1 >= 0) t = t1;
    else if (t2 >= 0) t = t2;
    else return null;

    return {
        x: P.x + dx * t,
        y: P.y + dy * t
    };
}

function appendArcPath(base, radius, startAngle, endAngle) {
    var points = 30;

    var angle = d3.scaleLinear()
        .domain([0, points - 1])
        .range([startAngle, endAngle]);

    var line = d3.lineRadial()
        .radius(radius)
        .angle(function(d, i) { return angle(i); });

    return base.datum(d3.range(points))
        .attr("d", line);
}

// Sample points along an arc in *pixel space*.
// center: {x, y} in pixels
// radius: in pixels
// startDeg, endDeg: angles in DEGREES
// steps: how many segments to split the arc into
function sampleArcPixels(center, radius, startDeg, endDeg, steps) {
    const pts = [];
    const startRad = startDeg * Math.PI / 180;
    const endRad   = endDeg   * Math.PI / 180;

    for (let i = 0; i <= steps; i++) {
        const t   = i / steps;
        const ang = startRad + (endRad - startRad) * t;
        const x   = center.x + radius * Math.cos(ang);
        const y   = center.y + radius * Math.sin(ang);
        pts.push({ x, y });
    }

    return pts;
}


// Line–rectangle exit point in pixel space.
// P0 is inside the rect; P1 is outside. We return the first boundary point.
function lineRectExitPoint(P0, P1, rect) {
    const dx = P1.x - P0.x;
    const dy = P1.y - P0.y;
    const candidates = [];


    function addCandidate(t) {
        if (t <= 0 || t > 1 || !isFinite(t)) return;
        const x = P0.x + dx * t;
        const y = P0.y + dy * t;
        if (x >= rect.xMin - 1e-6 && x <= rect.xMax + 1e-6 &&
            y >= rect.yMin - 1e-6 && y <= rect.yMax + 1e-6) {
            candidates.push({ t, x, y });
        }
    }

    if (dx !== 0) {
        addCandidate((rect.xMin - P0.x) / dx);
        addCandidate((rect.xMax - P0.x) / dx);
    }
    if (dy !== 0) {
        addCandidate((rect.yMin - P0.y) / dy);
        addCandidate((rect.yMax - P0.y) / dy);
    }

    if (!candidates.length) return null;
    candidates.sort((a, b) => a.t - b.t);
    return candidates[0];  // closest intersection as we move from P0 -> P1
}

// Area of a polygon given as [[x,y], ...] in *feet*.
// Returns a positive area (square feet).
function polygonAreaFeet(points) {
    let sum = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[(i + 1) % n];
        sum += x1 * y2 - x2 * y1;
    }
    return Math.abs(sum) / 2;
}
