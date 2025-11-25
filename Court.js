// Court.js

// --- globals so other files (Shot.js, Slider.js, HeatMap.js) can use them ---
let margin;
let chartDiv, court, heat_g, court_g, title;
let slider_axis, slider_rect, rect_entity;
let court_xScale, court_yScale, shot_xScale, shot_yScale, color;
let Basket, Backboard, Outterbox, Innerbox, CornerThreeLeft, CornerThreeRight, OuterLine;
let RestrictedArea, TopFreeThrow, BottomFreeThrow, ThreeLine, CenterOuter, CenterInner;

// ----- initialize SVG, groups, scales, shapes, then draw court -----
function initCourt() {
    margin = { left: 20, right: 20, top: 20, bottom: 20 };

    chartDiv = document.getElementById('court');

    court = d3.select(chartDiv)
        .append('court')
        .append('svg')
        .attr('width', 480)
        .attr('height', 480 / 50 * 47);

    // keep this for other files that might use it
    court.append('table');

    heat_g  = court.append('g');
    court_g = court.append('g');

    title = d3.select(document.getElementById('caption')).append('text');

    // slider containers (Slider.js expects these)
    slider_axis = court.append('g')
        .attr('class', 'slider-axis');
    slider_rect = court.append('g')
        .attr('class', 'slider-rect');
    rect_entity = slider_rect.append('rect');

    // scales (same domains as before)
    court_xScale = d3.scaleLinear().domain([-25, 25]);
    court_yScale = d3.scaleLinear().domain([-4, 43]);
    shot_xScale  = d3.scaleLinear().domain([-250, 250]);
    shot_yScale  = d3.scaleLinear().domain([-45, 420]);

    color = d3.scaleSequential(d3.interpolateOrRd)
        .domain([5e-6, 3e-2]); // Points per square pixel.

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

    // draw the court
    draw_court();

    // initialize slider if Slider() is defined
    if (typeof Slider === 'function') {
        Slider();
    }
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

    // ----- 33° geometry (no lines drawn now) -----
    const ftMidX = 0;
    const ftMidY = 15;
    const halfCourtY = 43;

    const angleDeg = 33;
    const angleRad = angleDeg * Math.PI / 180;

    const xLeftFt = -25;
    const xRightFt = 25;

    const deltaXFt = xRightFt - ftMidX;
    const deltaYFt = deltaXFt * Math.tan(angleRad);
    const yEdgeFt = ftMidY + deltaYFt;

    // NOTE: 33° lines (from ft line to sideline) are now removed.
    // We only keep the geometry for intersections later.

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
        .style("stroke-width", 2);

    // right horizontal: from right sideline (25) to right corner 3 vertical (22)
    court_g.append("line")
        .attr("x1", court_xScale(sidelineRightFt))
        .attr("y1", court_yScale(bandYFt))
        .attr("x2", court_xScale(22))
        .attr("y2", court_yScale(bandYFt))
        .style("stroke", "black")
        .style("stroke-width", 2);

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
        .style("stroke-width", 2);

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
    const centerTopPx = {
        x: court_xScale(ftMidX),
        y: court_yScale(halfCourtY)
    };

    const centerExit = lineRectExitPoint(basketCenter, centerTopPx, paintRectPx);
    if (centerExit) {
        court_g.append("line")
            .attr("x1", centerExit.x)
            .attr("y1", centerExit.y)   // just where it exits the paint (y ≈ 15)
            .attr("x2", centerTopPx.x)
            .attr("y2", centerTopPx.y)  // half court
            .style("stroke", "black")
            .style("stroke-width", 2);
    }

    // ----- FULL rays from basket center through paint corners to the 3pt arc -----
    if (Iright) {
        court_g.append("line")
            .attr("x1", basketCenter.x)
            .attr("y1", basketCenter.y)        // start at basket center
            .attr("x2", Iright.x)
            .attr("y2", Iright.y)              // end at intersection with arc
            .style("stroke", "black")
            .style("stroke-width", 2);
    }

    if (Ileft) {
        court_g.append("line")
            .attr("x1", basketCenter.x)
            .attr("y1", basketCenter.y)        // start at basket center
            .attr("x2", Ileft.x)
            .attr("y2", Ileft.y)               // end at intersection with arc
            .style("stroke", "black")
            .style("stroke-width", 2);
    }


    // extend those lines from arc to half court (these already start outside paint)
    //const halfCourtYpx = court_yScale(halfCourtY);

    //if (Iright) {
        //const dirRight = {
            //x: Iright.x - basketCenter.x,
            //y: Iright.y - basketCenter.y
        //};

        //const tExtRight = (halfCourtYpx - Iright.y) / dirRight.y;
        //const extendedRight = {
            //x: Iright.x + tExtRight * dirRight.x,
            //y: halfCourtYpx
        //};

        //court_g.append("line")
            //.attr("x1", Iright.x)
            //.attr("y1", Iright.y)
            //.attr("x2", extendedRight.x)
            //.attr("y2", extendedRight.y)
            //.style("stroke", "black")
            //.style("stroke-width", 2);
    //}

    //if (Ileft) {
        //const dirLeft = {
            //x: Ileft.x - basketCenter.x,
            //y: Ileft.y - basketCenter.y
        //};

        //const tExtLeft = (halfCourtYpx - Ileft.y) / dirLeft.y;
        //const extendedLeft = {
            //x: Ileft.x + tExtLeft * dirLeft.x,
            //y: halfCourtYpx
        //};

        //court_g.append("line")
            //.attr("x1", Ileft.x)
            //.attr("y1", Ileft.y)
            //.attr("x2", extendedLeft.x)
            //.attr("y2", extendedLeft.y)
            //.style("stroke", "black")
            //.style("stroke-width", 2);
    //}

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

    // ----- FULL rays from basket center to corner-3 tops -----
    court_g.append("line")
        .attr("x1", basketCenter.x)
        .attr("y1", basketCenter.y)     // start at basket center
        .attr("x2", cornerLeftPx.x)
        .attr("y2", cornerLeftPx.y)     // top of left corner 3
        .style("stroke", "black")
        .style("stroke-width", 2);

    court_g.append("line")
        .attr("x1", basketCenter.x)
        .attr("y1", basketCenter.y)     // start at basket center
        .attr("x2", cornerRightPx.x)
        .attr("y2", cornerRightPx.y)    // top of right corner 3
        .style("stroke", "black")
        .style("stroke-width", 2);


    // ----- sideline hash lines moved down to intersect arc + basket→arc lines -----
    if (Ileft && Iright) {
        // Left hash: sideline (-25) to Ileft (on 3pt arc & left radial)
        court_g.append("line")
            .attr("x1", court_xScale(-25))
            .attr("y1", Ileft.y)
            .attr("x2", Ileft.x)
            .attr("y2", Ileft.y)
            .style("stroke", "black")
            .style("stroke-width", 2);

        // Right hash: sideline (25) to Iright (on 3pt arc & right radial)
        court_g.append("line")
            .attr("x1", court_xScale(25))
            .attr("y1", Iright.y)
            .attr("x2", Iright.x)
            .attr("y2", Iright.y)
            .style("stroke", "black")
            .style("stroke-width", 2);
    }

    // ----- REGION POLYGONS + LABELS -----
    // Use COURT_REGIONS from regions.js to draw filled polygons for each region.
    if (typeof window !== 'undefined' && window.COURT_REGIONS) {

        const regions = window.COURT_REGIONS;

        // helpers to convert court coords (feet) -> pixel coords
        const px = x => court_xScale(x);
        const py = y => court_yScale(y);

        // one distinct color per region
        const regionColor = d3.scaleOrdinal()
            .domain(regions.map(r => r.id))
            .range([
                '#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e',
                '#e6ab02', '#a6761d', '#666666', '#1f78b4', '#b2df8a',
                '#fb9a99', '#fdbf6f', '#cab2d6', '#ffff99', '#b15928',
                '#8dd3c7', '#fb8072'
            ]);

        // --- Draw one polygon per region ---
        const regionShapes = court_g.selectAll('.region-shape')
            .data(regions, d => d.id);

        regionShapes.exit().remove();

        regionShapes.enter()
            .append('polygon')
            .attr('class', 'region-shape')
            .merge(regionShapes)
            .attr('points', d =>
                d.polygon
                    .map(([x, y]) => `${px(x)},${py(y)}`)
                    .join(' ')
            )
            .attr('fill', d => regionColor(d.id))
            .attr('opacity', 0.65)
            .attr('stroke', '#000')
            .attr('stroke-width', 0.5)
            .attr('stroke-opacity', 0.4);

        // --- Numeric labels on top ---
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

    // Sample points along the existing 3-pt arc in *pixel space*.
// center: {x, y} in pixels
// radius: in pixels
// startDeg, endDeg: degrees, same as you use for appendArcPath
// steps: how many points along the arc
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
