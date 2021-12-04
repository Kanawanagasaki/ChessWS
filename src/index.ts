///<reference path="Board.ts" />

declare const welcome:HTMLDivElement;
declare const error:HTMLDivElement;
declare const chess:HTMLDivElement;

declare const canvas:HTMLCanvasElement;

declare const nicknameInput:HTMLInputElement;
declare const loginBtn:HTMLButtonElement;
declare const loginError:HTMLParagraphElement;

declare const chessDisplayText:HTMLElement;

var myNickname:string = "";
var nicknameAskTimeout = -1;
var isLogginedIn:boolean = false;

var isInGame:boolean = false;
var opponentNickname:string = "";
var opponentPong:number = 0;

if(localStorage.getItem('nickname') && localStorage.getItem('nickname').trim().length > 3)
    nicknameInput.value = localStorage.getItem('nickname').trim();

loginBtn.onclick = function()
{
    if(nicknameInput.value.trim().length < 3)
        loginError.innerText = "Nickname should be at least 3 symbols long";
    else
    {
        ws.send("signin " + nicknameInput.value.trim());
        localStorage.setItem('nickname', nicknameInput.value.trim());
        nicknameInput.disabled = true;
        loginBtn.disabled = true;

        nicknameAskTimeout = setTimeout(()=>
        {
            myNickname = nicknameInput.value.trim();
            isLogginedIn = true;
            welcome.style.display = "none";
            chess.style.display = "";
            loginError.innerText = "";
            nicknameInput.disabled = false;
            loginBtn.disabled = false;
            ws.send("search " + myNickname);
        }, 3000);
    }
};

const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";
ctx.clearRect(0,0,canvas.width,canvas.height);
ctx.fillStyle = "#ddd";
ctx.fillRect(0,0,canvas.width,canvas.height);

const board = new Board(canvas.width / 8, canvas.height / 8);
function gameLoop()
{
    board.Draw(ctx);
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

canvas.onmousedown = function(ev)
{
    let bound = canvas.getBoundingClientRect();
    let x = ev.x - bound.left;
    let y = ev.y - bound.top;
    board.OnMouseDown(x, y);
};
canvas.onmousemove = function(ev)
{
    let bound = canvas.getBoundingClientRect();
    let x = ev.x - bound.left;
    let y = ev.y - bound.top;
    board.OnMouseMove(x, y);
};
canvas.onmouseup = function(ev)
{
    let bound = canvas.getBoundingClientRect();
    let x = ev.x - bound.left;
    let y = ev.y - bound.top;
    board.OnMouseUp(x, y);
};

const ws = new WebSocket("wss://free3.piesocket.com/v3/1?api_key=87KzZCsi48RAbfXYJRk67qDFRzmuCSLPb7Tv4vk2");
ws.onmessage = function(packet)
{
    const message = packet.data as string;
    const args = message.split(" ");
    switch(args[0])
    {
        case "signin":
            if(myNickname == args[1])
                ws.send("signin-conflict " + args[1]);
            break;
        case "signin-conflict":
            if(nicknameInput.value == args[1])
            {
                loginError.innerText = args[1] + " already occupied";
                nicknameInput.disabled = false;
                loginBtn.disabled = false;
                if(nicknameAskTimeout >= 0)
                {
                    clearTimeout(nicknameAskTimeout);
                    nicknameAskTimeout = -1;
                }
            }
            break;
        case "search":
            if(!isLogginedIn) break;
            if(isInGame && !board.IsCheckmate && !board.IsStalemate) break;
            ws.send("play " + myNickname + " " + args[1]);
            break;
        case "play":
            if(!isLogginedIn) break;
            if(isInGame && !board.IsCheckmate && !board.IsStalemate) break;
            if(args[2] != myNickname) break;
            opponentNickname = args[1];
            isInGame = true;
            board.Init(Math.random() < 0.5);
            ws.send("play-confirm " + (board.IsPlayingAsWhite ? "white" : "black") + " " + myNickname + " " + opponentNickname);
            chessDisplayText.innerText = "Playing against " + opponentNickname;
            opponentPong = performance.now();
            break;
        case "play-confirm":
            if(!isLogginedIn) break;
            if(isInGame && !board.IsCheckmate && !board.IsStalemate) break;
            if(args[3] != myNickname) break;
            opponentNickname = args[2];
            isInGame = true;
            board.Init(args[1] == "black");
            chessDisplayText.innerText = "Playing against " + opponentNickname;
            opponentPong = performance.now();
            break;
        case "move":
            if(!isLogginedIn) break;
            if(isInGame && (board.IsCheckmate || board.IsStalemate)) break;
            if(args[1] != opponentNickname) break;
            if(args[2] != myNickname) break;
            board.Move(+args[3], +args[4], +args[5], +args[6]);
            break;
        case "ping":
            if(!isLogginedIn) break;
            if(isInGame && (board.IsCheckmate || board.IsStalemate)) break;
            if(args[1] != opponentNickname) break;
            if(args[2] != myNickname) break;
            ws.send("pong " + myNickname + " " + opponentNickname);
            break;
        case "pong":
            if(!isLogginedIn) break;
            if(isInGame && (board.IsCheckmate || board.IsStalemate)) break;
            if(args[1] != opponentNickname) break;
            if(args[2] != myNickname) break;
            opponentPong = performance.now();
            break;
    }
}
ws.onclose = ws.onerror = function(err)
{
    welcome.style.display = chess.style.display = "none";
    error.style.display = "";
}

setInterval(()=>
{
    if(!isLogginedIn) return;
    if(!isInGame || board.IsCheckmate || board.IsStalemate) return;
    if(performance.now() - opponentPong < 30000)
        ws.send("ping " + myNickname + " " + opponentNickname);
    else
    {
        isInGame = false;
        chessDisplayText.innerText = `${opponentNickname} left, looking for opponent`;
        ws.send("search " + myNickname);
    }
}, 10000);
