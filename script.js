/* ================= ELEMENTS ================= */
const boxes = document.querySelectorAll(".box");
const resetBtn = document.querySelector(".resetbtn");
const msgContainer = document.querySelector(".msg-container");
const newGameBtn = document.querySelector(".new-btn");
const msgText = document.querySelector("#msg");
const crossBtn = document.querySelector("#ch1");
const zeroBtn = document.querySelector("#ch2");
const confettiContainer = document.getElementById("confetti-container");
const youScoreEl = document.getElementById("you-score");
const aiScoreEl = document.getElementById("ai-score");
const youPlus = document.getElementById("you-plus");
const aiPlus = document.getElementById("ai-plus");
const warningText = document.getElementById("warning");

let youScore = 0;
let aiScore = 0;


const HUMAN = "X";
const AI = "O";

let currentPlayer = null;
let count = 0;

const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

/* ================= PLAYER SELECTION ================= */
crossBtn.addEventListener("click", () => startGame(HUMAN));
zeroBtn.addEventListener("click", () => startGame(AI));

function startGame(player) {
    currentPlayer = player;
    crossBtn.disabled = true;
    zeroBtn.disabled = true;

    // If AI starts first
    if (currentPlayer === AI) {
        setTimeout(aiMove, 500);
    }
}

/* ================= BOX CLICK ================= */
boxes.forEach(box => {
    box.addEventListener("click", () => {

        // ❗ No player selected
        if (!currentPlayer) {
            showWarning();
            return;
        }

        // ❌ Block clicks during AI turn
        if (currentPlayer === AI || box.disabled) return;

        makeMove(box, HUMAN);

        if (checkWinner()) return;

        setTimeout(aiMove, 500);
    });
});


/* ================= MOVE HANDLER ================= */
function makeMove(box, player) {
    box.innerText = player;
    box.classList.add(player === HUMAN ? "x" : "o");
    box.disabled = true;
    count++;
    currentPlayer = player === HUMAN ? AI : HUMAN;
}

/* ================= AI LOGIC ================= */
function aiMove() {
    if (count >= 9) return;

    // 1️⃣ Try to win
    let move = findBestMove(AI);

    // 2️⃣ Try to block human
    if (!move) {
        move = findBestMove(HUMAN);
    }

    // 3️⃣ Take the Center (Strategic move)
    if (!move && !boxes[4].disabled) {
        move = boxes[4];
    }

    // 4️⃣ Random move
    if (!move) {
        const available = [...boxes].filter(box => !box.disabled);
        if (available.length > 0) {
            move = available[Math.floor(Math.random() * available.length)];
        }
    }

    if (move) {
        makeMove(move, AI);
        checkWinner();
    }
}

function findBestMove(player) {
    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        const values = [boxes[a], boxes[b], boxes[c]];

        const filled = values.filter(box => box.innerText === player);
        const empty = values.find(box => box.innerText === "");

        if (filled.length === 2 && empty) {
            return empty;
        }
    }
    return null;
}

/* ================= WIN / DRAW ================= */
function checkWinner() {
    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        const v1 = boxes[a].innerText;
        const v2 = boxes[b].innerText;
        const v3 = boxes[c].innerText;

        if (v1 && v1 === v2 && v2 === v3) {
            showWinner(v1);
            return true;
        }
    }

    if (count === 9) {
        showDraw();
        return true;
    }

    return false;
}

function showWinner(winner) {
    if (winner === "X") {
        youScore++;
        youScoreEl.innerText = youScore;
        showPlus(youPlus);
        msgText.innerText = "🏆 You Win!";
    } else {
        aiScore++;
        aiScoreEl.innerText = aiScore;
        showPlus(aiPlus);
        msgText.innerText = "🤖 Computer Wins!";
    }

    msgContainer.classList.remove("hide");
    disableBoxes();
    launchConfetti();
}

function showDraw() {
    msgText.innerText = "🤝 It's a Draw!";
    msgContainer.classList.remove("hide");
}

/* ================= RESET ================= */
function resetGame() {
    count = 0;
    currentPlayer = null;

    boxes.forEach(box => {
        box.innerText = "";
        box.disabled = false;
        box.classList.remove("x", "o");
    });

    msgContainer.classList.add("hide");
    crossBtn.disabled = false;
    zeroBtn.disabled = false;
}

function disableBoxes() {
    boxes.forEach(box => box.disabled = true);
}

/* ================= EVENTS ================= */
newGameBtn.addEventListener("click", resetGame);
resetBtn.addEventListener("click", resetGame);

/* ================= CONFETTI ================= */
function launchConfetti() {
    // Clear any old confetti first
    confettiContainer.innerHTML = '';
    
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement("div");
        confetti.classList.add("confetti");

        // Randomize appearance
        confetti.style.left = Math.random() * 100 + "vw";
        confetti.style.backgroundColor = ['#00f7ff', '#ff4fd8', '#fff700'][Math.floor(Math.random() * 3)];
        confetti.style.animationDuration = (Math.random() * 2 + 1) + "s";
        confetti.style.opacity = Math.random();

        confettiContainer.appendChild(confetti);
    }
    
    // Cleanup to prevent memory leaks
    setTimeout(() => {
        confettiContainer.innerHTML = '';
    }, 3000);
}
function showPlus(el) {
    el.classList.remove("show"); // reset
    void el.offsetWidth;         // force reflow
    el.classList.add("show");
}

function showWarning() {
    warningText.classList.remove("hide");

    setTimeout(() => {
        warningText.classList.add("hide");
    }, 1500);
}