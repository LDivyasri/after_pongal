/**
 * Standard Construction Project Template
 * Based on the standard construction workflow
 * 
 * This template defines all phases and tasks that should be auto-created
 * when a new construction project is initialized.
 */

const CONSTRUCTION_TEMPLATE = [
    // BASEMENT FLOOR (-1)
    {
        serialNumber: 1,
        floorNumber: -1,
        floorName: "Basement",
        stageName: "Initial Planning and Site Preparation",
        tasks: [
            "Site plan",
            "Architectural drawings",
            "Elevation",
            "Site pooja"
        ]
    },
    {
        serialNumber: 2,
        floorNumber: -1,
        floorName: "Basement",
        stageName: "Basement Construction Stages",
        tasks: [
            "Site clearance",
            "Marking",
            "Excavation",
            "PCC",
            "Bar bending",
            "Pillar marking and placing",
            "Footing concrete",
            "Earth pit column concrete below GL",
            "Earth pit soil filling and soil tightening",
            "Plinth level marking",
            "Plinth beam bar bending and shuttering",
            "Concreting and de-shuttering",
            "Basement level brick work - inner plastering",
            "Steps",
            "Gravel filling",
            "Soil consolidation",
            "DPC concrete and PCC",
            "Water tank and septic tank"
        ]
    },

    // GROUND FLOOR (0)
    {
        serialNumber: 3,
        floorNumber: 0,
        floorName: "Ground Floor",
        stageName: "Lintel Level Construction",
        tasks: [
            "Lintel level",
            "Column shoe marking",
            "Rod lapping if needed",
            "Column box fixing and concreting",
            "Sill level brick work 3'",
            "Sill concrete",
            "Lintel level brick work",
            "Lintel level shuttering",
            "Bar bending and concreting"
        ]
    },

    // FIRST FLOOR (1)
    {
        serialNumber: 4,
        floorNumber: 1,
        floorName: "First Floor",
        stageName: "Roof Level Construction",
        tasks: [
            "Roof level",
            "Rod lapping if needed",
            "Brick work",
            "Roof centering",
            "Bar bending",
            "Electrical pipeline fixing",
            "Concreting",
            "Concrete de-shuttering",
            "Electrical pipeline graly work"
        ]
    },

    // SECOND FLOOR (2) - If applicable
    {
        serialNumber: 5,
        floorNumber: 2,
        floorName: "Second Floor",
        stageName: "Wall and Finishing Works",
        tasks: [
            "Parapet wall brick work and sill concrete",
            "Doors and windows frame fixing",
            "Inner plastering",
            "Kitchen tabletop concreting",
            "Outer plastering",
            "Rooftop tanki concrete",
            "Elevation work"
        ]
    },

    // ROOF / TERRACE (999)
    {
        serialNumber: 6,
        floorNumber: 999,
        floorName: "Roof / Terrace",
        stageName: "Compound Wall Construction",
        tasks: [
            "Compound wall basement",
            "Brick work",
            "Plastering"
        ]
    },

    // FINISHING WORKS (Common to all floors - 1000)
    {
        serialNumber: 7,
        floorNumber: 1000,
        floorName: "Finishing (Common)",
        stageName: "Electrical and Plumbing Rough-in",
        tasks: [
            "Electrical wiring",
            "Plumbing line inner and outer"
        ]
    },
    {
        serialNumber: 8,
        floorNumber: 1000,
        floorName: "Finishing (Common)",
        stageName: "Plumbing Finishes",
        tasks: [
            "Plumbing finishing work",
            "Outer plumbing pipeline",
            "Inner plumbing pipeline",
            "Kitchen tap",
            "Bathroom fittings",
            "Outer area fittings",
            "Overhead Water tank fixing and connection"
        ]
    },
    {
        serialNumber: 9,
        floorNumber: 1000,
        floorName: "Finishing (Common)",
        stageName: "Electrical Finishes",
        tasks: [
            "Electrical finishing work",
            "Switch box",
            "MCB box",
            "Light fittings"
        ]
    },
    {
        serialNumber: 10,
        floorNumber: 1000,
        floorName: "Finishing (Common)",
        stageName: "Painting",
        tasks: [
            "Inner painting work",
            "Paint 2 or 3 coats",
            "Primer",
            "Emulsion",
            "Gril painting",
            "Main door polish",
            "Windows and doors polishing or painting",
            "Outer painting work",
            "Elevation",
            "MS gate painting",
            "Additional laser cut or other elevation element painting"
        ]
    },
    {
        serialNumber: 11,
        floorNumber: 1000,
        floorName: "Finishing (Common)",
        stageName: "Tiles work",
        tasks: [
            "Both room wall and floor finish",
            "Main floor finish",
            "Kitchen wall",
            "Elevation wall",
            "Parking"
        ]
    },
    {
        serialNumber: 12,
        floorNumber: 1000,
        floorName: "Finishing (Common)",
        stageName: "Granite and Staircase Work",
        tasks: [
            "Tabletop granite",
            "Front step",
            "Inner staircase",
            "Paneling work"
        ]
    },
    {
        serialNumber: 13,
        floorNumber: 1000,
        floorName: "Finishing (Common)",
        stageName: "Carpentry Finishes",
        tasks: [
            "Carpenter finishing work",
            "Main door",
            "Bedroom door",
            "Bathroom door",
            "Windows frame and shutter",
            "All glasses fixing"
        ]
    },
    {
        serialNumber: 14,
        floorNumber: 1000,
        floorName: "Finishing (Common)",
        stageName: "Optional Extras",
        tasks: [
            "Elevation grill or laser work",
            "Main gate work",
            "Outer area handrails",
            "MS or SS work"
        ]
    }
];

module.exports = CONSTRUCTION_TEMPLATE;
