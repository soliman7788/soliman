
window.onload = function(){
    
"use strict";

var blocks = [];
var triggers = [];
var players = [];
var buttons = [];

var inPs = new particleSystem();
var outPs = new particleSystem();
// inPs.active = false
adjustCanvas();

var Game = {
    devMode: false, // Turn to true to see how the game really does what it does behind the screen;
    bgcol: '#090B19',
    state: 'running',

    screen: 1,
    fails: 0,

    world: {
        mainThemeColor: "purple",
        dimensions: {
            meters: 466,
        }
    },

    buttons: {
        innerColor: 'rgba(150,150,150,0.9)',
    },

    time: {
        deltatime: 0,
        speedMultiplier: 1,
        lagLimitInMilliseconds: 0.16,
    },

    sound: {
        currentSoundtrack: null,
    },

    device: {
        controls: {
            active: true,
            keyboard: true,
            touch: true,
            stableJoystick: true,
            view: {
                dpad: true,
                joystick: true,
            },
        },

        capability: 5,
    },

    data: {
        won: false,
        lastHoverdButton: null,
    },

    Screen: {
        transitioning: false,
        playingScene: false,
        showBackButton: false, // For only the main game screen
        showButtonSelector: true,
        lastScreens: new Array(),
        subtitles: {
            visible: true,
            text: "",
            x: c.xc,
            y: c.h * 0.9,
            color: "white",
            width: c.w,
            render: function () {
                if (this.visible) {
                    this.x = c.xc,
                        this.y = c.h * 0.9
                    let fntSize = this.width * 1.6 / (this.text.length);
                    fntSize = limit(fntSize, c.w * 0.04, c.w * 0.06)
                    let fnt = font(fntSize)
                    Rect(this.x, this.y - fntSize * 0.08, c.w, fntSize * 1.5, "rgba(0,0,0,0.8)")
                    glow(10)
                    txt(this.text, this.x, this.y, fnt, this.color)
                    glow(0)
                }
            },
        },
        text: {
            text: "",
            font: "50px cursive",
            color: "white",
            angle: 0,
            alpha: 0,
            alphaTarget: 0,
            fadeSpeed: 1,
            glow: 20,
            setAlphaTarget: function (alphaTarget = 1, speed = 3) {
                this.alphaTarget = alphaTarget;
                this.fadeSpeed = speed;
            },
        },
        color: {
            r: 0,
            g: 0,
            b: 0,
            a: 0,
            alphaTarget: 0,
            fadeSpeed: 1,
            setAlphaTarget: function (alphaTarget = 1, speed = 3) {
                this.alphaTarget = alphaTarget;
                this.fadeSpeed = speed;
            },
        },

        tintColor: function () {
            this.color.a = approach(this.color.a, this.color.alphaTarget, this.color.fadeSpeed).value;
            this.text.alpha = approach(this.text.alpha, this.text.alphaTarget, this.text.fadeSpeed).value;
            return colorObjectToString(this.color);
        },

        setTintColor: function (r, g, b, a) {
            this.color.r = r;
            this.color.g = g;
            this.color.b = b;
            this.color.setAlphaTarget(a, 10);
        },

        setText: function (text, font = "50px cursive", color = "white", angle = 0) {
            let tObj = this.text;
            tObj.text = text;
            tObj.font = font;
            tObj.color = color;
            tObj.angle = angle;
        },

        showText: function () {
            cc.textAlign = "center";
            cc.save()
            cc.translate(c.xc, c.yc/*+(size*(c.h*0.05))*/)
            cc.rotate(degToRad(this.text.angle))
            cc.fillStyle = this.text.color;
            cc.font = this.text.font
            glow(this.text.glow, this.text.color)
            alpha(this.text.alpha)
            cc.fillText(this.text.text, 0, 0)
            alpha(0)
            glow(0);
            cc.restore();
        },

setAlphaTarget: function (alphaTarget = 0, speed = 3) {
            this.color.alphaTarget = alphaTarget;
            this.color.fadeSpeed = speed;
        },

        switchScreen: function (targetScreen, totalTime = 2, callback = nullFunction, firstAlpha = 1, secondAlpha = 0) {
            let screenPointer = this
            let settingsScreen = 8;
            screenPointer.color.setAlphaTarget(firstAlpha, totalTime * 2)
            setTimeout(function () {
                if (screenPointer.lastScreens[screenPointer.lastScreens.length - 1] != Game.screen && Game.screen != settingsScreen) {
                    //save the screen to go back to when the backbutton is clicked in the target screen
                    screenPointer.lastScreens.push(Game.screen)
                }
                Game.screen = targetScreen
                callback();
                screenPointer.color.setAlphaTarget(secondAlpha, totalTime * 2)
            }, (totalTime / 2) * 1000)
        }
    },

    background: {
        midColor: "rgba(255,112, 31,1)",
        color: "rgba(145,206,255,255)",
        render: function () {
            let dmX = Game.world.dimensions.meters;
            let dmY = Game.world.dimensions.meters;
            rect(dmX * -26, dmY * -17, dmX * 82, dmY * 32, this.color);
        },
    },

    camShaking: false,
    camShakeMagnitudeX: 10,
    camShakeMagnitudeY: 10,
    camShake: function (magX = 10, magY = 10) {
        this.camShaking = true;
        this.camShakeMagnitudeX = magX;
        this.camShakeMagnitudeY = magY;
    },

    end: function () {
        this.Screen.transitioning = true;
    },

    refresh: function () {
        this.data.won = false;
        blocks.length = 0;
        triggers.length = 0;
        Caldro.info.currentPlayer.refresh();
        clearAllTasks();
        positionButtons();
    },
}



var buttonSelector = {
    x: c.xc,
    y: c.yc,

    backupButton: new button(c.xc, -c.h, 10, 10, 'buttonSelectorBackupButton', 'transparent', 'transparent'),

    index: 0,
    inside: false,
    selectedButton: { effect: function () { }, show: function () { } },
    activeButtons: buttons.filter(function (button) {
        return button.active
    }),

    update: function () {

        delete this.activeButtons;
        this.activeButtons = buttons.filter(function (button) {
            return button.visible
        })
        if (this.activeButtons.length == 0) {
            this.activeButtons = [this.backupButton];
        }
        this.index = limit(this.index, 0, this.activeButtons.length - 1, this.activeButtons.length - 1, 0)
        this.x = this.activeButtons[this.index].x;
        this.y = this.activeButtons[this.index].y;
    },

    check: function (button) {
        this.inside = this.x >= button.x - (button.width / 2) && this.x <= button.x + (button.width / 2) && this.y >= button.y - (button.height / 2) && this.y <= button.y + (button.height / 2);
        if (this.inside == true && button.active == true) {
            this.selectedButton = button;
        } else {
            this.selectedButton = { effect: function () { } };
        }

        return this.inside;
    },

    selectButton: function (directionOfSelection = 'forward') {
        let dir = 0
        this.update()
        if (directionOfSelection.includes('forward')) {
            dir = 1

        } else if (directionOfSelection.includes('backward')) {
            dir = -1
        }
        this.index += dir;
    }

}


function block(x, y, xv, yv, w, h, color = 'grey', timer = 0, type = 'block') {
    this.x = x;
    this.y = y;
    this.lastx = x;
    this.lasty = y;
    this.xv = xv;
    this.yv = yv;
    this.gravity = 0;
    this.falling = false;
    this.color = color;
    this.width = w;
    this.height = h;
    this.size = w;
    this.type = type;
    this.glow = 0;
    this.callback = this.positioningCallback = NULLFUNCTION;

    this.update = function (deltatime = Game.time.deltatime) {
        if (Game.state == 'running') {
            --this.timer;

if (this.falling) {
                this.yv += this.gravity
            }
            this.lastx = this.x;
            this.lasty = this.y;
            this.x += this.xv * deltatime;
            this.y += this.yv * deltatime;;
            this.callback();
            this.positioningCallback()
        }
    }

    this.render = function () {
        glow(this.glow, this.color);
        Rect(this.x, this.y, this.width, this.height, this.color)
        if (Game.devMode) {
            stRect(this.x, this.y, this.width, this.height, "grey", 10)
        }
        glow(0);
    }
}

function placeBlock(x, y, width, height, color, timer = null, type = "env_block") {
    let envBlock = new block(x, y, 0, 0, width, height, color, timer, type);
    blocks.push(envBlock)
}

function envBlock(x, y, width, height, color, timer = null, type = "env_block") {
    let dmX = Game.world.dimensions.meters;
    let dmY = Game.world.dimensions.meters;
    let envblock = new block(dmX * x + (width * dmX) * 0.5, dmY * y + (height * dmY) * 0.5, 0, 0, (width + 0.05) * dmX, (height + 0.05) * dmY, color, timer, type);
    blocks.push(envblock)
    dmX = dmY = null;
    return envblock;
}

function envTrig(x, y, width, height, target, effect = function () { }) {
    let dmX = Game.world.dimensions.meters;
    let dmY = Game.world.dimensions.meters;
    let envtrig = new trigger(dmX * x + (width * dmX) * 0.5, dmY * y + (height * dmY) * 0.5, width * dmX, height * dmY, target);
    envtrig.effect = effect;
    triggers.push(envtrig)
    dmX = dmY = null;
    return envtrig;
}


//2D Points




function Character(x, y, color) {
    this.x = x;
    this.y = y;
    this.xv = 0;
    this.yv = 0;
    this.minSpeed = [2, 2];
    this.maxSpeed = [4, 4];
    this.jumps = 0;
    this.jumpLimit = 2;
    this.clamp = 0.3;
    this.gravity = 9.8;
    this.color = color;
    this.anticolor = "red"
    this.glow = 0;
    this.width = Game.world.dimensions.meters * 0.20;
    this.height = Game.world.dimensions.meters * 0.3;
    this.editedWidth = this.width;
    this.editedHeight = this.height;
    // this.boundingBox = new rectBody(this.x, this.y, this.width, this.height)
    //insert bounding info here

    this.falling = true;
    this.speed = 0;
    this.friction = [5, 0];
    this.data = [];
    this.toContain = true;
    this.selfNavigate = true;
    this.particleEffects = true
    this.energy = 100;
    this.averageEnergy = this.energy;
    this.energyTimer = new timer("depeting_energy_timer");
    this.maxEnergy = 100;
    this.state = 'happy';
    this.angle = 0;
    this.eyes = {
        x: this.x,
        y: this.y - this.height / 4,
        width: this.width,
        height: this.height,
        update: function () {

        },
        render: function () {
            // Rect(this.x, this.y, this.width, this.height, "skyblue")
        }
    }
    this.happyCircle = {
        x: this.x,
        y: this.y,
        radius: 1,
        targetRadius: 1,
        growthSpeed: 0.3,
        movementSpeed: 0.3
    }
}
Character.prototype = {
    update: function (deltatime = Game.time.deltatime) {
        if (Game.state == 'running') {
            if (this.selfNavigate) {

            }
            this.y += (this.yv * Game.world.dimensions.meters) * (deltatime)
            if (this.falling) {
                let shiftKey = GameKeys.getKey("shift")
                if (shiftKey) {
                    if (!shiftKey.beingPressed) {
                        this.yv += this.gravity * deltatime;
                    }
                }
            } else {
                // addFriction(this, [6, 0], deltatime)
            }
            if (Math.abs(this.xv) < this.clamp) {
                this.xv = 0;
            }
            this.x += (this.xv * Game.world.dimensions.meters) * (deltatime)
            this.angle = this.xv * 2;
            addFriction(this, this.friction, deltatime)
            if (this.toContain) {

            }

if(this.energyTimer.getCurrentTime() > 2){
                this.averageEnergy = this.averageEnergy-25*deltatime
            }
            this.averageEnergy = limit(this.averageEnergy, this.energy, this.maxEnergy)
            this.happyCircle.x = approach(this.happyCircle.x, this.x, this.happyCircle.movementSpeed).value;
            this.happyCircle.y = approach(this.happyCircle.y, this.y, this.happyCircle.movementSpeed).value;
            this.happyCircle.radius = approach(this.happyCircle.radius, this.happyCircle.targetRadius, this.happyCircle.growthSpeed).value;
            this.eyes.update();
            this.particleStream();
            this.callback();
        }
    },

    findLastCheckpoint: function () {
        let dmX = Game.world.dimensions.meters;
        let dmY = Game.world.dimensions.meters;
        let playerPointer = this
        place(this, {
            x: dmX * -8,
            y: dmY * -13.5
        })
        GameCam.unattach()
        setTimeout(function(){
            GameCam.callback = function(){
                GameCam.x = approach(GameCam.x, playerPointer.x, 2, Game.time.deltatime).value
                GameCam.y = approach(GameCam.y, playerPointer.y, 2, Game.time.deltatime).value
                playerPointer.energy+=40*Game.time.deltatime
            }
            setTimeout(function(){
                GameCam.attach(playerPointer)
                GameCam.callback = NULLFUNCTION
            }, 3000)
        }, 2000)
    },

    takeDamage: function (amount = 20) {
        // PLAY DAMAGE SOUND HERE
        soundBank.play("damage")
        this.jumps = 1;
        this.energyTimer.setTime(0);
        this.energy -= Math.abs(amount * Game.time.deltatime);
        this.energy = limit(this.energy, 0, this.maxEnergy)
        let velx = 30;
        let vely = 30;
        amount = limit(amount, 10, 30);
        if (this.particleEffects) {
            inPs.particleSource(this.x, this.y, this.width, this.height, [-velx, velx], [-vely, vely], [0, 0], gen(8, 15), "red", amount, 0.7, "line", 20)
            inPs.particleSource(this.x, this.y, this.width, this.height, [-velx, velx], [-vely, vely], [0, 0], gen(30, 50), "red", amount, 1, "box", 20)
            inPs.particleSource(this.x, this.y, this.width, this.height, [-velx, velx], [-vely, vely], [0, 0], gen(30, 60), this.color, amount, 0.7, "box", 20)
        }
        if (this.energy <= 0) {
            inPs.particleSource(this.x, this.y, this.width, this.height, [-velx, velx], [-vely, vely], [0, 0], gen(20, 40), "red", amount, 2, "line", 20)
            inPs.particleSource(this.x, this.y, this.width, this.height, [-velx, velx], [-vely, vely], [0, 0], gen(50, 70), "red", amount, 2, "box", 20)
            inPs.particleSource(this.x, this.y, this.width, this.height, [-velx, velx], [-vely, vely], [0, 0], gen(40, 80), this.color, amount, 2, "box", 20)
            // this.energy = 100;
            this.findLastCheckpoint();
        }
    },

    render: function () {
        alpha(0.4)
        circle(this.happyCircle.x, this.happyCircle.y, this.happyCircle.radius, this.color)
        alpha(1)
        glow(this.glow, this.color);
        Rect(this.x, this.y, this.width, this.height, this.color, this.angle);
        glow(0);
        this.eyes.render();
    },

    particleStream: function () {
        let velx = 1000;
        let vely = 1000;
        let psArr = inPs.particleSource(this.x, this.y, this.width, this.height, [-velx * 0.1, velx * 0.1], [-vely * 0.1, vely * 0.1], [0, 0], gen(20, 30), [this.color], 2, 0.8, "box", 20)
        psArr = null;
        velx = vely = null;
    },

    handleJump: function () {
        if (this.jumps < this.jumpLimit) {
            let velx = 100;
            let vely = 400;
            ++this.jumps;
            if (this.jumps > 1) {
                soundBank.play("double_jump")
                if (this.particleEffects) {
                    inPs.particleSource(this.x, this.y, this.width * 3, this.height / 2, [-velx, velx], [vely, vely * 2], [0, 0], gen(20, 30), [this.color], 24, 1, "box", 20)

}
            } else {
                soundBank.play("jump")
                if (this.particleEffects) {
                    inPs.particleSource(this.x, this.y, this.width, this.height / 2, [-velx, velx], [vely, vely], [0, 0], gen(20, 30), [this.color], 20, 1, "box", 20)
                }
            }
            this.yv = limit(-this.maxSpeed[1], -this.maxSpeed[1], -this.minSpeed[1])
            velx = vely = null;
        } else {
            //play failed jump sound here
            let velx = 300;
            let vely = 400;
            Game.camShake(20, 20)
            if (this.particleEffects) {
                soundBank.play("failed_jump")
                let playerPointer = this
                doTask("jumpFeedback", function () {
                    let oldColor = playerPointer.color;
                    playerPointer.color = playerPointer.anticolor;
                    setTimeout(function () {
                        playerPointer.color = oldColor;
                        clearDoTask("jumpFeedback")
                    }, 200)
                })
                inPs.particleSource(this.x, this.y, this.width, this.height / 2, [-velx, velx], [vely, vely], [0, 0], gen(20, 30), [this.anticolor], 10, 1, "box", 20)
            }
            velx = vely = null;
        }
    },

    callback: function () { },

    refresh: function () {
        this.xv = this.yv = 0;
        this.callback = NULLFUNCTION
        // this.toContain = true;
        // this.minSpeed = [300, 300];
        // this.maxSpeed = [1000, 1000];
        // this.particleStream = function(){}
    },

}





function setupGame() {
    Game.refresh();
    Caldro.setCamera(GameCam)
    GameCam.attach(player)
    Game.Screen.subtitles.visible = false
    Game.Screen.showBackButton = false
    Game.background.color = "rgba(145,206,255,255)"
    let dmX = Game.world.dimensions.meters;
    let dmY = Game.world.dimensions.meters;
    place(player, {
        x: dmX * -8,
        y: dmY * -13.5
    })
    GameCam.zoom = 0.25;
    if (c.orientation == "potrait") {
        GameCam.zoom = 0.141618
    }

    let color1 = Game.world.mainThemeColor
    let color2 = "blue"
    let goalSze = 0.35
    let G1 = envBlock(-17, -17, 14, 4, color1)
    let G2 = envBlock(-17, -15, 8, 4, color1)
    let G3 = envBlock(-15, -10, 12, 10, color1)

    let SGN1 = envBlock(-6, -11, 1, 0.5)
    makeSign(SGN1, "right", "white")

    let G3_2 = envBlock(-16, -12, 5, 3, color1)

    let GOAL1 = makeGoal(-10.5, -10.5, goalSze, goalSze)

    let G5 = envBlock(-6, -3, 7, 3, color1)

    let PLT1 = envBlock(-3, -7, 1.5, 0.375, color1)
    let BST1 = makeBoostBlock(-2.875, -7.125, 1, 0.125)

    let LAV1 = envTrig(1, -2.5, 3, 2.5)
    makeHarmful(LAV1)

    let SL1 = envBlock(2, -3, 1, 0.25, color1)
    makeSliderBlock(SL1, new Point2D(2.5, -2.5), new Point2D(2.5, -6.5), 20)

    let G5_5 = envBlock(1, -9, 2, 0.5, color1)
    let G6 = envBlock(4, -10, 6, 1, color1)
    let G7 = envBlock(4, -4, 6, 4, color1)
    let G8 = envBlock(10, -3, 7, 3, color1)
    let G8_5 = envBlock(4, -9, 1, 3, color1)

    let LAZ1 = makeLaserRod(5, -9, 1, 5, "black")
    let LAZ2 = makeLaserRod(7, -9, 1, 5, "black")

    let GOAL2 = makeGoal(6.5, -10.5, goalSze)
    let GOAL3 = makeGoal(6.5, -4.5, goalSze)

    let SL2 = envBlock(2, -3, 1, 0.25, color1)
    makeSliderBlock(SL2, new Point2D(11, -10), new Point2D(17, -13), 20)

    let G9 = envBlock(18, -13, 10, 1, color1)
    let G9_5 = envBlock(17, -3.5, 11, 3.5, color1)
    let G10 = envBlock(18, -4, 10, 2, color1)

    let LAV2 = envTrig(20, -4.25, 1, 0.25)
    makeHarmful(LAV2)

    let LAV4 = envTrig(25, -6, 1, 1);
    makeRevolverBlock(LAV4, new Point2D(25, -6), 1.5, 200);
    makeHarmful(LAV4);

    let GOAL4 = makeGoal(20.5, -5, goalSze)
    let GOAL5 = makeGoal(23, -15, 1, 1)

    let WALL1 = envBlock(-17, -19, 4, 21, color1)
    let WALL1_5 = envBlock(-17, 3.5, 4, 18, color1)
    let WALL2 = envBlock(29, -19, 10, 36, color1)
    let TOP = envBlock(-17, -22, 56, 5, color1)
    let BOTTOM = envBlock(-17, 17, 56, 7, color1)

let fisrtFLOORbottom = envBlock(-13, 0, 41, 2, color1)
    
    let G12 = envBlock(25, 9, 2, 1, color1)
    let G13 = envBlock(26, 10, 1, 7, color1)

    let PLT2 = envBlock(28, 10, 1, 0.25, color1)
    let G11 = envBlock(27, 10.125, 2, 6.825)
    makeWater(G11)
    let GOAL6 = makeGoal(28.5, 11, goalSze)
    
    let BST2 = makeBoostBlock(20, 16.875, 1, 0.125, -16)
    let G14 = envBlock(19, 14, 1, 3, color1)
    let G14_5 = envBlock(11, 14, 1, 3, color1)
    let LAV5 = envTrig(12, 15.5, 7, 1.5)
    makeHarmful(LAV5)
    let GOAL7 = makeGoal(16.5, 4.5, goalSze)


    let G15 = envBlock(11, 5, 9, 1, color1)
    let G15_1 = envBlock(19, 6, 1, 7, color1)
    let G15_5 = envBlock(11, 5, 1, 8, color1)
    let G16 = envBlock(5, 2, 2, 11, color1)

    let LAZ3 = makeLaserRod(7, 6, 4, 1, "black", "x")
    let SL3 = envBlock(9, 6.875, 2, 0.25, "black")
    makeSliderBlock(SL3, new Point2D(8, 7), new Point2D(10, 7), 90, "yellow", gen(0, 100))
    let LAZ4 = makeLaserRod(7, 7, 4, 1,  "black", "x")
    let SL4 = envBlock(9, 7.875, 2, 0.25,  "black")
    makeSliderBlock(SL4, new Point2D(8, 8), new Point2D(10, 8   ), 90, "yellow", gen(0, 100))
    let LAZ5 = makeLaserRod(7, 8, 4, 1, "black", "x")
    let SL5 = envBlock(9, 8.875, 2, 0.25,  "black")
    makeSliderBlock(SL5, new Point2D(8, 9), new Point2D(10, 9), 90, "yellow", gen(0, 100))
    let LAZ6 = makeLaserRod(7, 9, 4, 1, "black", "x")
    let SL6 = envBlock(9, 9.875, 2, 0.25,  "black")
    makeSliderBlock(SL6, new Point2D(8, 10), new Point2D(10, 10), 90, "yellow", gen(0, 100))
    let LAZ7 = makeLaserRod(7, 10, 4, 1, "black", "x")

    let PLT3 = envBlock(8, 11.625, 2, 0.25, color1)
    let LAZ8 = makeLaserRod(7, 12, 4, 1, "black", "x")

    let G17 = envBlock(7, 15.5, 1, 1.5, color1)
    let G18 = envBlock(6, 15, 1, 2, color1)
    let WT2 = envBlock(8, 15.625, 3, 1.375)
    makeWater(WT2)

    let G19 = envBlock(1, 9, 1, 8, color1)
    let G20 = envBlock(3, 4, 1, 12, color1)
    let G21 = envBlock(2, 16.75, 2, 0.25, color1)
    let WT3 = envBlock(2, 9.125, 1, 8, color1)
    makeWater(WT3, 15)
    let GOAL8 = makeGoal(2.5, 6, goalSze)
    let GOAL8_1 = makeGoal(15.5, 13, goalSze)

    let RV1 = envBlock(0, 7, 1.5, 0.25, color1)
    makeRevolverBlock(RV1, new Point2D(0, 7), 1, 20)
    let GOAL8_2 = makeGoal(0, 5.5, goalSze)
    let GOAL8_4 = makeGoal(0, 7.5, goalSze)
    let GOAL8_6 = makeGoal(-1, 6.5, goalSze)
    let GOAL8_8 = makeGoal(1, 6.5, goalSze)

    let PLT4 = envBlock(-2, 9, 1, 0.25, color1)
    let PLT5 = envBlock(0, 10, 1, 0.25, color1)
    let PLT6 = envBlock(-2, 11, 1, 0.25, color1)
    let PLT7 = envBlock(0, 12, 1, 0.25, color1)

    let LAZ9 = makeLaserRod(-2, 13, 1, 2, color1)
    let LAZ10 = makeLaserRod(0, 14, 1, 2, color1)
    
    let G22 = envBlock(-2, 15.625, 1, 0.375, color1)
    let G22_5 = envBlock(-4, 4, 1, 11, color1)
    let G22_5_5 = envBlock(-4, 4, 8, 1, color1)
    let GOAL9 = makeGoal(-1.5, 15.375, goalSze)
    let LAZ11 = makeLaserRod(-4, 16, 5, 1, color1, "x")

    let G23 = envBlock(-6, 15.625, 2, 1.375, color1)
    let G2$_not_even_close = envBlock(-13, 15.625, 1, 1.375, color1)

    let G24 = envBlock(-6, 15.25, 1, 0.375, color1)

    let SL7 = envBlock(-6, 15, 2, 0.25, color1);
    makeSliderBlock(SL7, new Point2D(-7, 15.375), new Point2D(-11, 13.375), 40)
    
    let G25 = envBlock(-13, 13, 1, 0.375, color1)
    let SL8 = envBlock(-11, 13, 2, 0.25, color1);
    makeSliderBlock(SL8, new Point2D(-11, 13), new Point2D(-6, 10.25), 40)
    
    let G26 = envBlock(-5, 10, 1, 0.25, color1);
    
    let SL9 = envBlock(-6, 10.125, 1, 0.25, color1);
    makeSliderBlock(SL9, new Point2D(-6, 10), new Point2D(-8, 5.125), 20)
    
    let G27 = envBlock(-13, 5, 4.5, 1, color1);
    
    let G28 = envBlock(-11, 4.5, 1, 0.5, color1);
    let G29 = envBlock(-12, 4, 1, 1, color1);
    let G30 = envBlock(-13, 3.5, 1, 1.5, color1);
    
    let G31 = envBlock(-30, -8, 13, 10, color1);
    let G32 = envBlock(-30, 3.5, 13, 20, color1);
    let G33 = envBlock(-30, 1, 3, 4, color1);

    let GOAL11 = makeGoal(-12, 2.75, goalSze)


let GOAL12 = makeEnd(-14, 2.75, goalSze*3)
}

// I'VE DONE A GOOD AMOUNT OF WORK, LOL, BUT WE CAN STILL JUST FINISH THE GAME TOGETHER!! >_<




function makeEnd(x, y, size = 0.25) {
    let dmX = Game.world.dimensions.meters;
    let dmY = Game.world.dimensions.meters;
    let goalTrigger = envTrig(x - size / 2, y - size / 2, size, size, Caldro.currentPlayer)
    goalTrigger.data["color"] = "white"
    let fntSize = goalTrigger.width/3;
    let txtColor = "yellow"
    goalTrigger.drawing = function () {
        alpha(1)
        glow(10, txtColor)
        // triangle(this.x, this.y, this.width, this.data["color"])
        textOutline(fntSize/2, txtColor)
        wrapText("You\nWin xD", this.x, this.y-(fntSize/2), 0, fntSize, this.data["color"], font(fntSize))
        textOutline(0)
        glow(0)
        let velx = 10;
        let vely = 10;
        inPs.particleSource(this.x, this.y, this.width, this.height, [-velx, velx], [-vely, vely], [0, 0], 26, this.data["color"], 1, 0.4, "line")
    }
    goalTrigger.effect = function () {
        GameCam.unattach()
        //PLAY SOUND HERE
        let velx = 600;
        let vely = 600;
        inPs.particleSource(this.x, this.y, this.width, this.height, [-velx, velx], [-vely, vely], [0, 0], dmX*gen(0.072, 0.25), txtColor, 50, 2)
        inPs.particleSource(this.x, this.y, this.width, this.height, [-velx, velx], [-vely, vely], [0, 0], dmX*gen(0.072, 0.25), "white", 30, 2)
        Game.camShake(70, 30)
        goalTrigger.triggerer.callback = function(){
            goalTrigger.triggerer.xv = -5
        }
        sceneCam.mimic(GameCam)
        // Caldro.setCamera(sceneCam)
        setTimeout(function(){
            Caldro.setCamera(viewCam)
            Game.Screen.switchScreen(2, 2)
        }, 3000)
        goalTrigger.data["toDestroy"] = true;
        goalTrigger.active = false;
    }
    return goalTrigger;
}

function makeGoal(x, y, size = 0.25) {
    let dmX = Game.world.dimensions.meters;
    let dmY = Game.world.dimensions.meters;
    let goalTrigger = envTrig(x - size / 2, y - size / 2, size, size, Caldro.currentPlayer)
    goalTrigger.data["color"] = "white"
    goalTrigger.drawing = function () {
        alpha(1)
        glow(10, this.data["color"])
        triangle(this.x, this.y, this.width, this.data["color"])
        glow(0)
        let velx = 10;
        let vely = 10;
        inPs.particleSource(this.x, this.y, this.width, this.height, [-velx, velx], [-vely, vely], [0, 0], 26, this.data["color"], 1, 0.4, "line")

    }
    goalTrigger.effect = function () {
        //PLAY SOUND HERE
        soundBank.play("got_goal")

        let velx = 600;
        let vely = 600;
        inPs.particleSource(this.x, this.y, this.width, this.height, [-velx, velx], [-vely, vely], [0, 0], 100, this.data["color"], 20, 2, function () {
            triangle(this.x, this.y, this.width, this.color)
        })
        Game.camShake(70, 30)
        ++goalTrigger.triggerer.data["points"];
        goalTrigger.data["toDestroy"] = true;
        goalTrigger.active = false;
    }
    
    return goalTrigger;
}

function makeSign(block, signType = "danger", outlineColor = "white", rodColor = "red") {
    block.type += "ghost";
    let width = block.width * 0.2
    let height = block.height * 0.9
    block.render = function () {
        Rect(block.x, block.y + (block.height - height), width, height, rodColor)
        if (signType == "danger") {
            let x = block.x;
            let y = block.y - block.height / 4
            let length = block.width
            let sizedif = 0.7
            triangle(x, y, length, outlineColor)
            triangle(x, y + length * (sizedif / 14), length * sizedif, block.color)
            // Rect(x, y, 40, 40, "orange")
            txt("!", x, y + length * (sizedif / 5), "1000 " + width * 3 + "px Arial", outlineColor)
        } else if (signType == "left") {
            block.render = function () {
                let angle = 270;
                let space = block.width * 0.4
                triangle(block.x - space, block.y, block.width, "lime", angle)


triangle(block.x + space, block.y, block.width, "lime", angle)
            }
        } else if (signType == "right") {
            block.render = function () {
                let angle = 90;
                let space = block.width * 0.4
                triangle(block.x - space, block.y, block.width, "lime", angle)
                triangle(block.x + space, block.y, block.width, "lime", angle)
            }
        } else if (signType == "up") {
            block.render = function () {
                let angle = 0;
                let space = block.height * 0.4
                triangle(block.x, block.y - space, block.width, "lime", angle)
                triangle(block.x, block.y + space, block.width, "lime", angle)
            }
        } else if (signType == "down") {
            block.render = function () {
                let angle = 180;
                let space = block.height * 0.4
                triangle(block.x, block.y - space, block.width, "lime", angle)
                triangle(block.x, block.y + space, block.width, "lime", angle)
            }
        }
    }
}

function makeHarmful(trig, damage = 220, visible = true, color = "red", glw = 20) {
    if (visible) {
        trig.drawing = function () {
            glow(glw, color);
            Rect(trig.x, trig.y, trig.width, trig.height, color);
            let size = limit(trig.width, 10, 200);
            inPs.particleSource(trig.x, trig.y - trig.height / 2, trig.width, trig.height / 2, [-500, 500], [-800, -200], [0, 0], gen(size - (size / 6), size), color, 1, 1, "box", 5)
        }
    }
    trig.effect = function () {
        Game.camShake(50, 100);
        trig.triggerer.yv = -2;
        trig.triggerer.takeDamage(damage);
    }
}

function makeWater(block, upthrust = 20, color = "rgba(135, 206, 235, 0.6)") {
   block.type += "ghost";
   block.color = color;
   block.trig = new trigger(block.x, block.y, block.width, block.height);
   block.trig.effect = function(){
       block.trig.triggerer.yv -= upthrust*Game.time.deltatime;
   }
   triggers.push(block.trig)
}

function makeBoostBlock(x, y, width, height, boostValue = -10) {
    let tramp = envTrig(x, y, width, height, Caldro.info.currentPlayer)
    tramp.effect = function () {
        soundBank.play("bounce_pad")
        tramp.triggerer.yv = boostValue;
    }
    tramp.drawing = function () {
        if (!tramp.activated) {
            glow(20, "magenta")
            Rect(tramp.x, tramp.y, tramp.width, tramp.height, "magenta")
            glow(0)
            inPs.particleSource(tramp.x, tramp.y, tramp.width, tramp.height, [-150, 150], [-400, -100], [0, 0], gen(0.2, 0.4), "magenta", 2, 2, "line", 20)
        } else {
            glow(20, "#22FF12")
            Rect(tramp.x, tramp.y, tramp.width, tramp.height, "#22FF12")
            glow(0)
            inPs.particleSource(tramp.x, tramp.y, tramp.width, tramp.height, [-350, 350], [-1500, -700], [0, 0], gen(0.2, 0.4), "#22FF12", 20, 2, "line", 20)
            inPs.particleSource(tramp.x, tramp.y, tramp.width, tramp.height, [-500, 500], [-1500, -700], [0, 0], gen(50, 90), "#22FF12", 20, 2, "box", 20)
        }
    }
}

function makeLaserRod(x, y, width = 1, height = 2, color = "grey", axis = 'y', damage = 180) {
    let dmX = Game.world.dimensions.meters;
    let dmY = Game.world.dimensions.meters;
    if (axis == "y") {
        let top = envBlock(x, y, width, 0.375, color)
        let laser = envTrig(x + (width / 4), y + 0.375, width / 2, height - 0.75, Caldro.info.currentPlayer)
        let bottom = envBlock(x, y + (height - 0.3755), width, 0.3755, color)
        let osc = new oscilator(40, 50)
        laser.callback = function () {
            osc.update(Game.time.deltatime)
            if (Math.abs(osc.value) > 25) {
                laser.active = false;
            } else {
                laser.active = true;
            }
        }
        laser.drawing = function () {
            if (laser.active) {
                glow(30, "red");
                Rect(laser.x, laser.y, laser.width, laser.height, "red");


glow(30, "white");
                Rect(laser.x, laser.y, laser.width / 2.5, laser.height, "white")
                glow(0)
                let velx = 700
                let vely = 400
                inPs.particleSource(laser.x, laser.y, laser.width, laser.height, [-velx, velx], [-vely, vely], [0, 0], gen(50, 100), "red", 2, 1, 'box', 20)
            } else {
                glow(20, "#22FF12")
                alpha(0.3)
                Rect(laser.x, laser.y, laser.width, laser.height, "#22FF12");
                alpha(1)
                glow(0)
                let velx = 700
                let vely = 200
                inPs.particleSource(laser.x, laser.y, laser.width, laser.height, [-velx, velx], [-vely, vely], [0, 0], gen(50, 100), "#22FF12", 1, 1, 'box', 20)
            }
            laser.effect = function () {
                Game.camShake(50, 80);
                laser.triggerer.takeDamage(damage)
            }
        }
    } else {
        let left = envBlock(x, y, 0.375, height, color)
        let laser = envTrig(x + 0.375, y + height / 4, width - 0.75, height / 2, Caldro.info.currentPlayer)
        let right = envBlock(x + (width - 0.375), y, 0.375, height, color)
        let osc = new oscilator(40, 50)
        laser.callback = function () {
            osc.update(Game.time.deltatime)
            if (Math.abs(osc.value) > 25) {
                laser.active = false;
            } else {
                laser.active = true;
            }
        }
        laser.drawing = function () {
            if (laser.active) {
                glow(30, "red");
                Rect(laser.x, laser.y, laser.width, laser.height, "red");
                glow(30, "white");
                Rect(laser.x, laser.y, laser.width, laser.height / 2.5, "white")
                glow(0)
                let velx = 400
                let vely = 700
                inPs.particleSource(laser.x, laser.y, laser.width, laser.height, [-velx, velx], [-vely, vely], [0, 0], gen(50, 100), "red", 2, 1, 'box', 20)
            } else {
                glow(20, "#22FF12")
                alpha(0.3)
                Rect(laser.x, laser.y, laser.width, laser.height, "#22FF12");
                alpha(1)
                glow(0)
                let velx = 200
                let vely = 700
                inPs.particleSource(laser.x, laser.y, laser.width, laser.height, [-velx, velx], [-vely, vely], [0, 0], gen(50, 100), "#22FF12", 1, 1, 'box', 20)
            }


window.onload = function(){
    
"use strict";

var blocks = [];
var triggers = [];
var players = [];
var buttons = [];

var inPs = new particleSystem();
var outPs = new particleSystem();
// inPs.active = false
adjustCanvas();

var Game = {
    devMode: false, // Turn to true to see how the game really does what it does behind the screen;
    bgcol: '#090B19',
    state: 'running',

    screen: 1,
    fails: 0,

    world: {
        mainThemeColor: "purple",
        dimensions: {
            meters: 466,
        }
    },

    buttons: {
        innerColor: 'rgba(150,150,150,0.9)',
    },

    time: {
        deltatime: 0,
        speedMultiplier: 1,
        lagLimitInMilliseconds: 0.16,
    },

    sound: {
        currentSoundtrack: null,
    },

    device: {
        controls: {
            active: true,
            keyboard: true,
            touch: true,
            stableJoystick: true,
            view: {
                dpad: true,
                joystick: true,
            },
        },

        capability: 5,
    },

    data: {
        won: false,
        lastHoverdButton: null,
    },

    Screen: {
        transitioning: false,
        playingScene: false,
        showBackButton: false, // For only the main game screen
        showButtonSelector: true,
        lastScreens: new Array(),
        subtitles: {
            visible: true,
            text: "",
            x: c.xc,
            y: c.h * 0.9,
            color: "white",
            width: c.w,
            render: function () {
                if (this.visible) {
                    this.x = c.xc,
                        this.y = c.h * 0.9
                    let fntSize = this.width * 1.6 / (this.text.length);
                    fntSize = limit(fntSize, c.w * 0.04, c.w * 0.06)
                    let fnt = font(fntSize)
                    Rect(this.x, this.y - fntSize * 0.08, c.w, fntSize * 1.5, "rgba(0,0,0,0.8)")
                    glow(10)
                    txt(this.text, this.x, this.y, fnt, this.color)
                    glow(0)
                }
            },
        },
        text: {
            text: "",
            font: "50px cursive",
            color: "white",
            angle: 0,
            alpha: 0,
            alphaTarget: 0,
            fadeSpeed: 1,
            glow: 20,
            setAlphaTarget: function (alphaTarget = 1, speed = 3) {
                this.alphaTarget = alphaTarget;
                this.fadeSpeed = speed;
            },
        },
        color: {
            r: 0,
            g: 0,
            b: 0,
            a: 0,
            alphaTarget: 0,
            fadeSpeed: 1,
            setAlphaTarget: function (alphaTarget = 1, speed = 3) {
                this.alphaTarget = alphaTarget;
                this.fadeSpeed = speed;
            },
        },

        tintColor: function () {
            this.color.a = approach(this.color.a, this.color.alphaTarget, this.color.fadeSpeed).value;
            this.text.alpha = approach(this.text.alpha, this.text.alphaTarget, this.text.fadeSpeed).value;
            return colorObjectToString(this.color);
        },

        setTintColor: function (r, g, b, a) {
            this.color.r = r;
            this.color.g = g;
            this.color.b = b;
            this.color.setAlphaTarget(a, 10);
        },

        setText: function (text, font = "50px cursive", color = "white", angle = 0) {
            let tObj = this.text;
            tObj.text = text;
            tObj.font = font;
            tObj.color = color;
            tObj.angle = angle;
        },

        showText: function () {
            cc.textAlign = "center";
            cc.save()
            cc.translate(c.xc, c.yc/*+(size*(c.h*0.05))*/)
            cc.rotate(degToRad(this.text.angle))
            cc.fillStyle = this.text.color;
            cc.font = this.text.font
            glow(this.text.glow, this.text.color)
            alpha(this.text.alpha)
            cc.fillText(this.text.text, 0, 0)
            alpha(0)
            glow(0);
            cc.restore();

        }
    