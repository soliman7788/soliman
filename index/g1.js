let W, H;
let btns;
let level = 1;
let level_MAX
let lastD;
let stateTime = false;
let posBtn = [];

const random = (max=1, min=0) => Math.random() * (max - min) + min;

const btnPressed = (btn) => {
    btn.style.color = 'red';
    btn.style.border = '1.5px solid white';
    btn.setAttribute('state', 'BTN_PRESSED');
    check();
};

const btnRelease = (btn) => {
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.setAttribute('state', '');
    stateTime = false;
    progress.style.width = 0 + 'px';
};

const nextLevel = () => {
    posBtn = [];
    output.innerHTML = "";
    level++;
    stateTime = false;
};

const checkTime = () => {
    if(stateTime){
        let dateNow = Date.now();
        progress.style.width = 100-100*(lastD+2000-dateNow)/2000 + "%";
        if(Date.now()>=lastD+2000){
            if(level<level_MAX){
                progress.style.width = 0;
                nextLevel();
                createLevel();
            }
            else finish();
        }
    }
};
window.setInterval(checkTime,10);

const check = () => {
    let cpt = 0;
    for(let i=0; i<btns.length; i++){
       if(btns[i].getAttribute("state")==='BTN_PRESSED')cpt++;
    }
    if(cpt===btns.length){
        lastD = Date.now();
        stateTime = true;
    }
};


const newEvents = () => {
    nlevel.innerHTML = "LEVEL " + level;
    btns = output.getElementsByTagName('button');
    for(let i=0; i<btns.length; i++){
        btns[i].addEventListener("touchstart", () => btnPressed(btns[i]) );
        btns[i].addEventListener("touchend", () => btnRelease(btns[i]) );
    }
};

const createLevel = () => {
    for(let i=0; i<level; i++){
        let x, y , dist;
        let w = 50;
        do{
            x = random(W-w,20);
            y = random(H-w,90);
            dist = false;
            if(posBtn.length > 0){
                for(let a=0; a<posBtn.length; a++){
                    if(Math.abs(posBtn[a].x - x) < w+20 && Math.abs(posBtn[a].y - y) < w+20)dist = true;
                }
            }
        }while(dist);
        posBtn.push(new Point(x, y));
        createButton(x, y, w);
    }
    newEvents();
};
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
const finish = () => {
    stateTime = false;
    Swal.fire({
        title: 'CONGRATULATIONS !',
        text: 'Thanks for playing ',
        imageUrl: 'https://image.flaticon.com/icons/svg/1642/1642322.svg',
        imageWidth: 300,
        imageHeight: 200,
        imageAlt: 'Custom image',
    })
    .then(() => {
        output.innerHTML = "";
        posBtn = [];
        level = 1;
        createLevel();
    });
};


const createButton = (x, y, w) => {
        let div = document.createElement("button");
        div.setAttribute('class', 'btn');
        div.style.left = x  + "px";
        div.style.top = y + "px";
        div.style.width = w + "px";
        div.style.height = w + "px";
        div.style.borderRadius = "50%";
        div.innerHTML  = <i class="fas fa-fingerprint fa-4x"></i>;
        output.appendChild(div);
};


const boxAlert = () => {
    Swal.fire({
        title: 
            'Hold all fingerprints at the same time to validate the level',
            showClass: {popup: 'animateanimated animatefadeInDown'},
            hideClass: {popup: 'animateanimated animatefadeOutUp'},
            text: 'Choice your difficulty:',
            input: 'radio',
            inputOptions: {
                4: 'Easy',
                6: 'Medium',
                10: 'Hard'
            },
            inputValidator: (value) => {
                if (!value) return 'You need to choose a difficulty !'
                else level_MAX = value;
            }
    })
};

const init = () => {
    W = innerWidth;
    H = innerHeight;
    boxAlert();
    createLevel();
};

onload = init;