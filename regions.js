// regions.js
// Region IDs + label positions + 4-point polygons (in court coords).

const COURT_REGIONS = [
    {
        id: 1,
        labelX: -23.50,
        labelY: 3.00,
        // Left corner box: between sideline (-25), corner 3 line (-22), baseline (-4) and y=10
        polygon: [
            [-25, -4],
            [-22, -4],
            [-22, 10],
            [-25, 10]
        ]
    },
    {
        id: 2,
        labelX: 23.50,
        labelY: 3.00,
        // Right corner box
        polygon: [
            [22, -4],
            [25, -4],
            [25, 10],
            [22, 10]
        ]
    },
    {
        id: 3,
        labelX: -15.00,
        labelY: 1.00,
        // Left above corner (inside arc-ish, above paint)
        polygon: [
            [-22, -4],
            [-8, -4],
            [-8, 3.16],
            [-22, 10]
        ]
    },
    {
        id: 4,
        labelX: 15.00,
        labelY: 1.00,
        // Right above corner
        polygon: [
            [8, -4],
            [22, -4],
            [22, 10],
            [8, 3.16]
        ]
    },
    {
        id: 5,
        labelX: 0.00,
        labelY: 0.75,  // this is still centered between -4 and 5.5
        // Lower paint (baseline to mid-line, lane to lane)
        polygon: [
            [-8, -4],   // left lane line, baseline
            [ 8, -4],   // right lane line, baseline
            [ 8,  5.5], // right lane line, mid-line
            [-8,  5.5]  // left lane line, mid-line
        ]
    },
    {
        id: 6,
        labelX: 0.00,
        labelY: 10.25,
        // Upper paint (mid-line to top of paint)
        polygon: [
            [-8,  5.5],
            [ 8,  5.5],
            [ 8, 15],
            [-8, 15]
        ]
    },

    {
        id: 7,
        labelX: -13.14,
        labelY: 15.96,
        // Left inside arc lower wing
        polygon: [
            [-22, 10],
            [-8, 3.16],
            [-8, 19],
            [-14, 19]
        ]
    },
    {
        id: 8,
        labelX: 13.14,
        labelY: 15.96,
        // Right inside arc lower wing
        polygon: [
            [8, 10],
            [14, 10],
            [14, 19],
            [8, 19]
        ]
    },
    {
        id: 9,
        labelX: -4.00,
        labelY: 19.70,
        // Left high elbow
        polygon: [
            [-6, 19],
            [0, 19],
            [0, 24],
            [-6, 24]
        ]
    },
    {
        id: 11,
        labelX: 4.00,
        labelY: 19.70,
        // Right high elbow
        polygon: [
            [0, 19],
            [6, 19],
            [6, 24],
            [0, 24]
        ]
    },
    {
        id: 12,
        labelX: -21.64,
        labelY: 15.96,
        // Left above-break deep (outside arc)
        polygon: [
            [-25, 10],
            [-22, 10],
            [-11.7, 22.42],
            [-25, 22.42]
        ]
    },
    {
        id: 13,
        labelX: 21.64,
        labelY: 15.96,
        // Right above-break deep
        polygon: [
            [22, 10],
            [25, 10],
            [25, 22.42],
            [11.7, 22.42]
        ]
    },
    {
        id: 14,
        labelX: -20.30,
        labelY: 32.46,
        // Left corner deep three
        polygon: [
            [-25, 22.42],
            [-11.75, 22.42],
            [-22.22, 43],
            [-25, 43]
        ]
    },
    {
        id: 15,
        labelX: -7.80,
        labelY: 32.46,
        // Left-center deep three
        polygon: [
            [-11.75, 22.42],
            [0, 24],
            [0, 43],
            [-22.22, 43]
        ]
    },
    {
        id: 16,
        labelX: 7.80,
        labelY: 32.46,
        // Right-center deep three
        polygon: [
            [0, 24],
            [11.75, 22.42],
            [22.22, 43],
            [0, 43]
        ]
    },
    {
        id: 17,
        labelX: 20.30,
        labelY: 32.46,
        // Right deep corner three
        polygon: [
            [11.75, 22.42],
            [25, 22.42],
            [25, 43],
            [22.22, 43]
        ]
    }
];

// expose as global for Court.js
if (typeof window !== 'undefined') {
    window.COURT_REGIONS = COURT_REGIONS;
}
