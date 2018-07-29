let inquirer = require("inquirer")
let fs = require("fs")
let clue = require("./clue")

let constraints = []
let players = [
    "Doris",
    "Michael",
    "Sarah",
    "Fabian"
]
let currentPlayer = 2
let thisPlayer = 0

async function main() {
    let players = []
    let amountPlayers = await inquirer.prompt([
        {type: "input", name:"num", message: "Wie viele Mitspieler? "}
    ])
    for (let i = 0; i < amountPlayers.num; i++) {
        let player = await inquirer.prompt([
            {type: "input", name:"name", message:"Name: "},
            {type: "input", name:"numCards", message:"Anzahl der Karten: "}
        ])
        players.push({
            name: player.name,
            cards: player.numCards
        })
    }
    let info = await inquirer.prompt([
        {type: "list"}
    ])
    while (true) {
        console.log("An der Reihe: " + players[currentPlayer])
        let constraint = {}
        constraint.by = currentPlayer

        let newConstraint = await inquirer.prompt([
            {type:"confirm", name:"skip", message: "Neue Anschuldigung? "}
        ])

        if (newConstraint.skip) {
            let answer = await inquirer.prompt([
            {type: "list", name:"room", message:"Raum:", choices: clue.room},
            {type: "list", name:"person", message:"Person:", choices: clue.suspect},
            {type: "list", name:"weapon", message:"Waffe:", choices: clue.weapon},
        ])

        constraint.suspect = clue.suspect.indexOf(answer.person)
        constraint.room = clue.room.indexOf(answer.room)
        constraint.weapon = clue.weapon.indexOf(answer.weapon)

        let refused = await inquirer.prompt([
            {type:"list", name:"refused", message: "Widerlegt von: ", choices: [...players, "Niemand"]}
        ])

        if (refused.refused === "Niemand") {
            constraint.refusedBy = false
        } else {
            constraint.refusedBy = players.indexOf(refused.refused)
        }

        if (constraint.refusedBy !== false && (currentPlayer === thisPlayer || constraint.refusedBy == thisPlayer)) {
            let refusedWith = await inquirer.prompt([
                {type:"list", name:"type", message:"Widerlegt mit: ", choices: ["Raum", "Person", "Waffe"]}
            ])

            constraint.refusedWithType = refusedWith.type

            if (refusedWith.type == "Raum") {
                constraint.refusedWith = constraint.room
            } else if (refusedWith.type == "Person") {
                constraint.refusedWith = constraint.suspect
            } else {
                constraint.refusedWith = constraint.weapon
            }
        }
        }


        constraints.push(constraint)

        currentPlayer = (currentPlayer + 1) % 4

        fs.writeFileSync("constraints.json", JSON.stringify(constraints))

    }
}



main()
