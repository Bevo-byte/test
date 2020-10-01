import layout from './layout.js';

const width = 28;

// *********** GLOBAL VARIABLES **************************************

const grid = document.querySelector('.grid')
const scoreDisplay = document.getElementById('score')
const highScoreDisplay = document.getElementById('high-score')
const ghostTypes = ['red', 'pink', 'blue', 'orange']
const startingPacmanPosition = 489
const acceptedKeycodes = [37, 38, 39, 40]
const pacDeath = new Audio("./audio/pac_dead.wav")
const pacWakka = new Audio("./audio/pac_wakka.wav")
const gameIntro = new Audio("./audio/game_start.mp3")
const eatingGhost = new Audio("./audio/eating_ghost.mp3")

let squares = []
let pacmanPosition = startingPacmanPosition
let score = 0;
let highScore = 0
let isRunning = false
let intervals = []
let pelletTimer
let muted = false

// *********** GLOBAL HELPERS **************************************

// gets a random num between 0-3 to determine left/up/right/down movement and returns it as a grid index change
const randomDirection = () => {
    let randomNum = Math.floor(Math.random() * 4)
    let direction
    if (randomNum === 0) {
        direction = -1
    }
    else if (randomNum === 1) {
        direction = -width
    }
    else if (randomNum === 2) {
        direction = 1
    }
    else if (randomNum === 3) {
        direction = +width
    }

    return direction
}

const addPacDot = (position) => {
    if (isPacDot(position) || isPowerPellet(position)) {
        squares[position].classList.add('override-bg')
    }
}

const removePacDot = (position) => {
    if (isPacDot(position) || isPowerPellet(position)) {
        squares[position].classList.remove('override-bg')
    }
}

const addGhost = (ghost, position) => {
    squares[position].classList.add(ghost.colour)
}

const addScaredGhost = (position) => {
    squares[position].classList.add("scared-ghost")
}

const removeGhost = (ghost) => {
    squares[ghost.currentPosition].classList.remove(ghost.colour)
    squares[ghost.currentPosition].classList.remove('scared-ghost')
}

const resetGhost = (ghost) => {
    squares[ghost.currentPosition].classList.remove('scared-ghost')
    squares[ghost.currentPosition].classList.remove(ghost.colour)
    ghost.currentPosition = ghost.startingPosition
    ghost.lastPosition = ghost.startingPosition
    ghost.isScared = false
}

const isLeftEntrance = (position) => {
    return squares[position].classList.contains("left-shortcut-entrance")
}

const isRightEntrance = (position) => {
    return squares[position].classList.contains("right-shortcut-entrance")
}

const goToRightEntrance = (position) => {
    return position + width - 1
}
const goToLeftEntrance = (position) => {
    return position - width + 1
}

const isWall = (position) => {
    return squares[position].classList.contains("wall")
}

const isGhostLair = (position) => {
    return squares[position].classList.contains("ghost-lair")
}

const isPacDot = (position) => {
    return squares[position].classList.contains("pac-dot")
}

const isPowerPellet = (position) => {
    return squares[position].classList.contains("power-pellet")
}

const checkForClash = (position) => {
    if ((ghostTypes.some(ghostType => squares[position].classList.contains(ghostType)) || squares[position].classList.contains("scared-ghost"))
        && squares[position].classList.contains("pacman")) {
        ghosts.forEach(ghost => {
            if (position === ghost.currentPosition) {
                if (ghost.isScared) {
                    playSound(eatingGhost)
                    score += 25
                    updateScore()
                    resetGhost(ghost)
                }
                else {
                    endGame()
                }
            }
        });
    }
}

const updateScore = () => {
    scoreDisplay.textContent = score
}

// *********** CREATE BOARD ************

const createBoard = () => {
    updateScore()
    highScoreDisplay.textContent = highScore
    //for loop 
    for (let i = 0; i < layout.length; i++) {
        //create a square 
        const square = document.createElement('div')
        //put square in grid 
        grid.appendChild(square)
        //put square in sqaures array
        squares.push(square)

        if (Array.isArray(layout[i])) {
            squares[i].classList.add('wall')
            if (layout[i][0] === 1) {
                squares[i].classList.add('wall-left')
            }
            if (layout[i][1] === 1) {
                squares[i].classList.add('wall-top')
            }
            if (layout[i][2] === 1) {
                squares[i].classList.add('wall-right')
            }
            if (layout[i][3] === 1) {
                squares[i].classList.add('wall-bottom')
            }

        }

        if (layout[i] === 0) {
            squares[i].classList.add('pac-dot')
        } else if (layout[i] === 2) {
            squares[i].classList.add('ghost-lair')
        } else if (layout[i] === 3) {
            squares[i].classList.add('power-pellet')
        } else if (layout[i] === 5) {
            squares[i].classList.add('left-shortcut-entrance')
        } else if (layout[i] === 6) {
            squares[i].classList.add('right-shortcut-entrance')
        } else if (layout[i] === 7) {
            squares[i].classList.add('forbidden')
        } else if (layout[i] === 8) {
            squares[i].classList.add('forbidden')
            squares[i].id = "ready-state"
        }
    }
}

const resetBoard = () => {
    while (grid.firstChild) {
        grid.removeChild(grid.firstChild);
    }
    squares = []
    createBoard()
}

// *********** CREATE PACMAN ********************************

const createPacman = () => {
    squares[startingPacmanPosition].classList.add('pacman')
}

// *********** CREATE GHOSTS ********************************

class Ghost {
    constructor(colour, startingPosition, speed) {
        this.colour = colour
        this.startingPosition = startingPosition
        this.speed = speed
        this.currentPosition = startingPosition
        this.lastPosition = startingPosition
        this.isScared = false
    }
}

const ghosts = [
    new Ghost(ghostTypes[0], 294, 500), //red
    new Ghost(ghostTypes[1], 348, 600), //blue
    new Ghost(ghostTypes[2], 351, 700), //pink
    new Ghost(ghostTypes[3], 349, 800) //orange
]

// creates each ghost based on starting position and colour, adds them to board
const createGhosts = () => {
    ghosts.forEach(ghost => {
        squares[ghost.startingPosition].classList.add(ghost.colour)
    });
}

//To-DO(Jason): refactor using global helper functions
const resetGhosts = () => {
    ghosts.forEach(ghost => {
        resetGhost(ghost)
    });
}

// *********** GHOST MOVEMENT ********************************************************

//TODO: stop ghosts going through each other (check actual behaviour of pacman game)
// checkForGhost = () => {}

const isLastPosition = (position, ghost) => {
    return position === ghost.lastPosition
}

const isForbidden = (position) => {
    return squares[position].classList.contains("forbidden")
}

const getNewPosition = (ghost) => {
    let direction = randomDirection()
    let position = ghost.currentPosition

    if (isLeftEntrance(position) && direction === -1) {
        return goToRightEntrance(position)
    }
    else if (isRightEntrance(position) && direction === 1) {
        return goToLeftEntrance(position)
    }

    let targetPosition = position + direction

    if (isWall(targetPosition) || isLastPosition(targetPosition, ghost) || isForbidden(targetPosition)) {
        while (true) {
            targetPosition = getNewPosition(ghost)
            if (!isWall(targetPosition) && !isLastPosition(targetPosition, ghost) && !isForbidden(targetPosition)) {
                return targetPosition
            }
        }
    }

    return targetPosition
}

const moveGhost = (ghost) => {
    intervals.push(setInterval(() => {
        removeGhost(ghost)
        removePacDot(ghost.currentPosition)

        let lastPosition = ghost.currentPosition
        ghost.currentPosition = getNewPosition(ghost)
        ghost.lastPosition = lastPosition

        addPacDot(ghost.currentPosition)
        if(ghost.isScared) {
            addScaredGhost(ghost.currentPosition)
        }
        else {
            addGhost(ghost, ghost.currentPosition)
        }
        
        checkForClash(ghost.currentPosition)
    }, ghost.speed)
    )
}

//for each ghost set their movement intervals
const moveGhosts = () => {
    ghosts.forEach(ghost => {
        moveGhost(ghost)
    })
}

const clearGhostIntervals = () => {
    intervals.forEach(interval => {
        clearInterval(interval)
    })
}

const scareGhosts = () => ghosts.forEach(ghost => ghost.isScared = true)

const unScareGhosts = () => ghosts.forEach(ghost => ghost.isScared = false)

// *********** PAC-MAN MOVEMENT ****************************************************

const removePacman = () => {
    squares[pacmanPosition].classList.remove('pacman')

    squares[pacmanPosition].classList.remove('left')
    squares[pacmanPosition].classList.remove('up')
    squares[pacmanPosition].classList.remove('right')
    squares[pacmanPosition].classList.remove('down')
}

const eatPacDot = () => {
    squares[pacmanPosition].classList.remove('pac-dot')
    score++
    updateScore()
}

const eatPowerPellet = () => {
    clearTimeout(pelletTimer)
    squares[pacmanPosition].classList.remove('power-pellet')
    score += 5
    updateScore()
    scareGhosts()
    pelletTimer = setTimeout(unScareGhosts, 10000)
}

const checkShortcut = (position, direction) => {
    const leftEntrance = squares[position].classList.contains("left-shortcut-entrance")
    const rightEntrance = squares[position].classList.contains("right-shortcut-entrance")

    if (leftEntrance && direction === -1) {
        return position + width - 1
    }
    else if (rightEntrance && direction === 1) {
        return position - width + 1
    }
    else {
        return position
    }
}

// takes in a users keyboard input and moves pacman in direction if available
const movePacman = (e) => {
    //if game isn't started or not a valid key press
    if (!isRunning || !acceptedKeycodes.includes(e.keyCode)) {
        return
    }
    e.preventDefault(); //stops the window from scrolling with key presses while game is running
    playSound(pacWakka)
    const pacman = document.getElementsByClassName('pacman')
    let newPosition = pacmanPosition
    let direction
    let style = ""
    removePacman()

    if (e.keyCode === 37) {
        direction = -1
        style = "left"
    }
    else if (e.keyCode === 38) {
        direction = -width
        style = "up"
    }
    else if (e.keyCode === 39) {
        direction = 1
        style = "right"
    }
    else if (e.keyCode === 40) {
        direction = +width
        style = "down"
    }

    newPosition += direction

    pacmanPosition = checkShortcut(pacmanPosition, direction)

    //valid move, pacman position now updated
    if (!isWall(newPosition) && !isGhostLair(newPosition)) {
        pacmanPosition = newPosition
    }

    if (isPacDot(newPosition)) {
        eatPacDot()
    }

    if (isPowerPellet(newPosition)) {
        eatPowerPellet()
    }

    squares[pacmanPosition].classList.add('pacman')
    squares[pacmanPosition].classList.add(style)

    checkForClash(pacmanPosition)
}

// *********** GAME STATE ************

const toggleStartButton = () => {
    let startButton = document.getElementById("start")
    startButton.disabled = !startButton.disabled
}

const resetScore = () => {
    score = 0
    updateScore()
}

const setHighScore = () => {
    if (score > highScore) {
        highScore = score
        highScoreDisplay.textContent = highScore
    }
}

const setGameState = (gameState = "") => {
    document.getElementById("game-state").textContent = gameState
}

const resetPacman = () => {
    pacmanPosition = startingPacmanPosition
}

const setReadyMessage = (readyState = "") => {
    document.getElementById("ready-state").textContent = readyState
}

const playSound = (sound) => {
    if (!muted) {
        sound.play()
    }
}

const toggleSound = (e) => {
    muted = !muted
    document.getElementById("MyElement").classList.add('MyClass');
    document.getElementById("MyElement").classList.remove('MyClass');
}

// *********** Initialize Board ************

// IIFE (Immediately Invoked Function Expression)
const initializeBoard = (() => {
    createBoard()
    createPacman()
    createGhosts()
    setReadyMessage("Ready!")
})()

// *********** START GAME ************

const startGame = () => {
    playSound(gameIntro)
    toggleStartButton()
    setTimeout(() => {
        isRunning = true;
        setReadyMessage()
        resetScore()
        setGameState()
        moveGhosts()
    },gameIntro.duration * 1000)
}

// *********** END GAME ************

const endGame = () => {
    isRunning = false
    playSound(pacDeath)
    removePacman()
    resetPacman()
    clearGhostIntervals()
    unScareGhosts()
    resetGhosts()
    setHighScore()
    setGameState("Game Over")
    setTimeout(() => {
        resetBoard()
        createPacman()
        createGhosts()
        setGameState()
        toggleStartButton()
        setReadyMessage("Ready!")
    }, 2500)
}

// *********** EVENT LISTENERS ************
document.getElementById("sound").addEventListener("click", toggleSound)

document.addEventListener("keydown", movePacman)

document.getElementById("start").addEventListener("click", startGame)