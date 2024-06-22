// 
// document.getElementById("userCont").style.display = "none"
// document.getElementById("oppNameCont").style.display = "none"
// document.getElementById("valueCont").innerHTML=`<h1>fghjkl</h1>`
// document.getElementById("whosTurn").style.display = "none"
// 

const socket = io();
let board = [];
let playerColor = null;
let selectedPiece = null;
let possibleMoves = [];
let localStream;
let peerConnection;
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const callButton = document.getElementById('callButton');
let gameState = {
    board: [],
    turn: 'white',
    winner: null
};


const config = {
    iceServers: [
        {
            urls: "turn:relay1.expressturn.com:3478",
            username: "efD08GKZ1QV5X7KPMN",
            credential: "2vS3rl5sPO0tp3P9",
        }
    ]
};

callButton.addEventListener('click', startCall);

// Prompt the user for their name and room
let userName ;
let userRoom ;

socket.on('connect', () => {
    console.log('Connected to server');
});

document.getElementById('find').addEventListener("click", function () {
    userName = document.getElementById("name").value
    userRoom = document.getElementById("room").value
    console.log(userName, userRoom);

        document.getElementById("user").innerText = userName
        if (userName == null || userName == '') {
            alert("Please enter a name")
        }
        else{
            socket.emit('joinRoom', { name: userName, room: userRoom });
            document.getElementById("find").disabled = true;
            // document.querySelector(".h1").style.display ="none";
            document.getElementById("name").style.display = "none"
            document.getElementById("find").style.display = "none"
            document.getElementById("data").style.display = "none"
            // document.getElementById("").style.display = "none"
            document.getElementById("game").style.display ="block";
             

        }

});


// Emit the joinRoom event with user name and room


let p;
socket.on('playerColor', (color) => {
    playerColor = color;
     document.getElementById("whosTurn").style.display = "block"
    document.getElementById("value").innerText=color;
    if(color=="white"){
        p=userName;
    }
    if(p){
        document.getElementById("whosTurn").innerHTML=`<div>It is ${p} turn</div>`;
    }
   
    console.log('You are playing as', color);
});


// 
async function startCall() {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true,video: true });
    localVideo.srcObject = localStream;
    // localVideo.style.display = "none"; 
    peerConnection = new RTCPeerConnection(config);
    peerConnection.addStream(localStream);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('candidate', event.candidate);
        }
    };

    peerConnection.onaddstream = (event) => {
        // const remoteAudio = new Audio();
        // remoteAudio.srcObject = event.stream;
        // remoteAudio.play();
        remoteVideo.srcObject = event.stream;
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', offer);
}

socket.on('offer', async (offer) => {
    if (!peerConnection) {
        startCall();
    }
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', answer);
});

socket.on('answer', async (answer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('candidate', (candidate) => {
    const iceCandidate = new RTCIceCandidate(candidate);
    peerConnection.addIceCandidate(iceCandidate);
});

function hangUp() {
    peerConnection.close();
    localStream.getTracks().forEach(track => track.stop());
    peerConnection = null;
}


socket.on('initGame', (gameState) => {
    board = gameState.board;
    renderBoard(board);
    document.getElementById("userCont").style.display = "block"
document.getElementById("oppNameCont").style.display = "block"
document.getElementById("valueCont").style.display = "block"


});
// io.to(roomState.players.white.id).emit('opponentName', roomState.players.black.name);
// 

socket.on("roomFull",(mess)=>{
    alert(mess);
    return ;
})
socket.on('updateBoard', (gameState) => {
    board = gameState.board;
    // let turnDiv=  document.querySelector('#turn')
    // document.getElementById("whosTurn").style.display = "block"
    let color=gameState.turn;
    console.log(color);
    let ans=gameState.players[color].name;
    console.log(ans);
    document.getElementById("whosTurn").innerHTML=`<div>It is ${ans} turn</div>`;
    
    possibleMoves = [];
    renderBoard(board);
  
});

socket.on('invalidMove', (data) => {
    alert(data.message);
});
socket.on('gameOver', (data) => {
    gameState.winner = data.winner;
    hangUp();
    // document.querySelector('.win').innerHTML=`<h1>the winner is ${data.winner}</h1>`;
    alert(`Game over! The winner is ${data.winner}`);

  });


  socket.on('opponentName', (opponentName) => {
    // let opponentDiv = document.querySelector('.opponent');
    // opponentDiv.innerHTML = `<h1>Your opponent is ${opponentName}</h1>`;
    document.getElementById("oppNameCont").style.display = "block"
    document.getElementById("oppName").innerText=opponentName;
    // opponentDiv.classList.add('opponenthighlight');
    // startCall();
});

  function renderBoard(board) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.getElementById(`${col + 1}_${8 - row}`);
            // Reset the cell's content and classes
            cell.innerHTML = '';
            cell.className = `gamecell ${(row + col) % 2 === 0 ? '' : 'grey'}`;

            if (board[row][col]) {
                // Add piece to the cell
                cell.innerHTML = `<span class="${board[row][col].type}">${getPieceSymbol(board[row][col])}</span>`;
                if (!gameState.winner) {
                    if (board[row][col].color === playerColor) {
                        cell.addEventListener('click', () => selectPiece(row, col));
                    } else {
                        cell.addEventListener('click', () => movePiece(row, col));
                    }
                }
            } else {
                // Add click event for empty cell if the game is not over
                if (!gameState.winner) {
                    cell.addEventListener('click', () => movePiece(row, col));
                }
            }

            // Highlight possible moves
            if (possibleMoves.some(move => move.row === row && move.col === col)) {
                cell.classList.add('highlight');
            }
        }
    }
}


function getPieceSymbol(piece) {
    switch (piece.type) {
        case 'pawn': return piece.color === 'white' ? '♙' : '♟';
        case 'rook': return piece.color === 'white' ? '♖' : '♜';
        case 'knight': return piece.color === 'white' ? '♘' : '♞';
        case 'bishop': return piece.color === 'white' ? '♗' : '♝';
        case 'queen': return piece.color === 'white' ? '♕' : '♛';
        case 'king': return piece.color === 'white' ? '♔' : '♚';
        default: return '';
    }
}

function selectPiece(row, col) {
    selectedPiece = { row, col };
    const piece = board[row][col];
    if (piece && piece.color === playerColor) {
        console.log(piece);
        console.log(row,col);
        socket.emit('getPossibleMoves', { piece, position: selectedPiece });
    }
}
// to highlight it
socket.on('possibleMoves', (moves) => {
    possibleMoves = moves;
    renderBoard(board);
});

function movePiece(row, col) {
    if (selectedPiece) {
        const move = {
            from: selectedPiece,
            to: { row, col }
        };
        socket.emit('movePiece', move);
        selectedPiece = null;
        possibleMoves = [];
    }
}