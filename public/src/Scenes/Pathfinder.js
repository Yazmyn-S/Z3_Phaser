class Pathfinder extends Phaser.Scene {
    constructor() {
        super("pathfinderScene");
    }

    preload() {}

    init() {
        this.TILESIZE = 16;
        this.SCALE = 2.0;
        this.TILEWIDTH = 40;
        this.TILEHEIGHT = 25;
        this.my = { sprite: {} };
    }

    async create() {
        // Create a new tilemap which uses 16x16 tiles, and is 40 tiles wide and 25 tiles tall
        this.map = this.add.tilemap("three-farmhouses", this.TILESIZE, this.TILESIZE, this.TILEHEIGHT, this.TILEWIDTH);

        // Add a tileset to the map
        this.tileset = this.map.addTilesetImage("kenney-tiny-town", "tilemap_tiles");

        // Create the layers
        this.groundLayer = this.map.createLayer("Ground-n-Walkways", this.tileset, 0, 0);
        this.treesLayer = this.map.createLayer("Trees-n-Bushes", this.tileset, 0, 0);
        this.housesLayer = this.map.createLayer("Houses-n-Fences", this.tileset, 0, 0);

        // Create townsfolk sprite
        // Use setOrigin() to ensure the tile space computations work well
        this.my.sprite.purpleTownie = this.add.sprite(this.tileXtoWorld(5), this.tileYtoWorld(5), "purple").setOrigin(0, 0);

        // Camera settings
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setZoom(this.SCALE);

        // Create grid of visible tiles for use with path planning
        let tinyTownGrid = this.layersToGrid([this.groundLayer, this.treesLayer, this.housesLayer]);
        this.my.sprite.wheelBarrow = this.add.sprite(this.tileXtoWorld(37), this.tileYtoWorld(3), "purple").setOrigin(0, 0);

        let xVal = 37;
        let yVal = 3;
        const { Solver, Int, And } = new window.Context("main");

        // Function to get valid values
        async function getValidValues(constraints) {
            const { left, right, top, bottom } = constraints;

            console.log("Constraints:", { left, right, top, bottom });

            const solver = new Solver();
            const x = Int.const("x");
            const y = Int.const("y");

            const validX = new Set();
            const validY = new Set();
            const validPairs = [];

            // Define constraints
            solver.add(x.ge(left));
            solver.add(x.le(right));
            solver.add(y.ge(top));
            solver.add(y.le(bottom));

            // Find solutions
            while (await solver.check() === "sat") {
                const model = solver.model();

                // Get values
                const xTemp = Number(model.eval(x).value());
                const yTemp = Number(model.eval(y).value());

                // Push valid values to list
                validX.add(xTemp);
                validY.add(yTemp);
                validPairs.push({ x: xTemp, y: yTemp });

                // Exclude current solution
                solver.add(And(x.neq(xTemp), y.neq(yTemp)));
            }

            return {
                // Sort values
                validX: Array.from(validX).sort((a, b) => a - b),
                validY: Array.from(validY).sort((a, b) => a - b),
                // Get random pair
                randomPair: validPairs[Math.floor(Math.random() * validPairs.length)] || null,
            };
        }

        // Output results
        function outputResult(label, results) {
            const { validX, validY, randomPair } = results;
            console.log(label);
            if (randomPair) {
                console.log(`x: ${validX.join(" ")}`);
                console.log(`y: ${validY.join(" ")}`);
                console.log(`Random (x,y): (${randomPair.x}, ${randomPair.y})`);
                xVal = randomPair.x;
                yVal = randomPair.y;
                
            } else {
                console.log("unsat");
            }
            console.log("\n");
        }

        const scenarios = [
            { label: "Inside the fence", constraints: { left: 35, right: 37, top: 3, bottom: 5 } },
        ];

        // Process scenarios
        for (const scenario of scenarios) {
            const results = await getValidValues(scenario.constraints);
            outputResult(scenario.label, results);
        }

        // Use original Z3 comparisons to make random constraints
        this.my.sprite.wheelBarrow.x = this.tileXtoWorld(xVal);
        this.my.sprite.wheelBarrow.y = this.tileYtoWorld(yVal);
    }

    update() {}

    tileXtoWorld(tileX) {
        return tileX * this.TILESIZE;
    }

    tileYtoWorld(tileY) {
        return tileY * this.TILESIZE;
    }

    // layersToGrid
    layersToGrid() {
        let grid = [];
        return grid;
    }
}