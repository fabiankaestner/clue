const fs = require("fs")
const clue = require("./clue")
const csprng = require("csprng")
const chalk = require("chalk")

let players = [
    {
        name: "Doris",
        hasNot: [],
        has: []
    },
    {
        name: "Michael",
        hasNot: [],
        has: []
    },
    {
        name: "Sarah",
        hasNot: [],
        has: []
    },
    {
        name: "Fabian",
        hasNot: [],
        has: []
    },
]
let ownPlayer = 0
let names = {
    room: [
        "Küche",
        "Bibliothek",
        "Salon",
        "Speisezimmer",
        "Billardzimmer",
        "Eingangshalle",
        "Veranda",
        "Arbeitszimmer",
        "Musikzimmer"
    ],
    person: [
        "Bloom",
        "Porz",
        "Ming",
        "Weiß",
        "Gatow",
        "Grün"
    ],
    weapon: [
        "Heizungsrohr",
        "Leuchter",
        "Pistole",
        "Seil",
        "Dolch",
        "Rohrzange"
    ]
}

let refusedTypeMap = {
    Raum: "room",
    Waffe: "weapon",
    Person: "person"
}
let refusedTypeMap2 = {
    Raum: "room",
    Waffe: "weapon",
    Person: "suspect"
}

class HasAllOfConstraint {
    constructor(player, arr) {
        this.cards = arr
        this.player = player
    }

    isSatisfied(cardDist) {
        let valid = true
        for(let card of this.cards) {
            if (cardDist[this.player].indexOf(card) == -1) {
                valid = false
            }
        }
        return valid
    }
}

class HasOneOfConstraint {
    constructor(player, arr) {
        this.cards = arr
        this.player = player
    }

    isSatisfied(cardDist) {
        let valid = false
        for(let card of this.cards) {
            if (cardDist[this.player].indexOf(card) != -1) {
                valid = true
            }
        }
        return valid
    }
}

class HasNoneOfConstraint {
    constructor(player, arr) {
        this.cards = arr
        this.player = player
    }

    isSatisfied(cardDist) {
        let valid = true
        for(let card of this.cards) {
            if(cardDist[this.player].indexOf(card) != -1) {
                valid = false
            }
        }
        return valid
    }
}

function checkAdd(arr, card) {
    if (arr.indexOf(card) == -1) {
        arr.push(card)
    }
}

function main() {

    let accusations = JSON.parse(fs.readFileSync("constraints.json"))
    let constraints = []
    for (let accusation of accusations) {
        if (accusation.suspect != undefined) {
            for (let i =  1; i < 4; i++) {
                let player = (i + accusation.by) % 4
                if (player !== accusation.refusedBy) {
                    checkAdd(players[player].hasNot, clue.suspect[accusation.suspect])
                    checkAdd(players[player].hasNot, clue.room[accusation.room])
                    checkAdd(players[player].hasNot, clue.weapon[accusation.weapon])
                    constraints.push(new HasNoneOfConstraint(player, [
                        clue.suspect[accusation.suspect],
                        clue.room[accusation.room],
                        clue.weapon[accusation.weapon]
                    ]))
                }
                if (player === accusation.refusedBy) {
                    if (player != ownPlayer && accusation.by != ownPlayer) {
                        constraints.push(new HasOneOfConstraint(player, [
                            clue.suspect[accusation.suspect],
                            clue.room[accusation.room],
                            clue.weapon[accusation.weapon]
                        ]))
                    } else {
                        checkAdd(players[player].has, clue[refusedTypeMap2[accusation.refusedWithType]][accusation.refusedWith])
                        constraints.push(new HasOneOfConstraint(player, [
                            clue[refusedTypeMap2[accusation.refusedWithType]][accusation.refusedWith]
                        ]))
                    }
                    break;
                }
            }
        }
    }
    for(let card of myCards) {
        checkAdd(players[ownPlayer].has, clue[card.type][card.index])
    }
    /*let dists = [{
        consistent: true,
        middle: ["Grün", "Heizungsrohr", "Eingangshalle"],
        playerCards: [
            [
                "Bloom",
                "Weiß",
                "Pistole",
                "Salon",
                "Veranda"
            ],
            [
                "Küche",
                "Arbeitszimmer",
                "Gatow",
                "Billardzimmer"
            ],
            [
                "Seil",
                "Dolch",
                "Rohrzange",
                "Musikzimmer"
            ],
            [
                "Porz",
                "Ming",
                "Leuchter",
                "Bibliothek",
                "Speisezimmer"
            ]
        ]
    }]*/
    let dists = generateMiddlePossibilites(myCards)
    let valid = dists.filter((dist) => {
        for(let constraint of constraints) {
            if (!constraint.isSatisfied(dist.playerCards)) {
                return false
            }
        }
        return true
    })
        //fs.writeFileSync("dists.json", JSON.stringify(dists))
        //fs.writeFileSync("valid.json", JSON.stringify(valid))


    let res = {
        players: [],
        middle: {},
        total: {}
    }
    for(let player in players) {
        res.players.push({})
    }
    for(let card of clue.name) {
        for(let player of res.players) {
            player[card] = 0
        }
        res.middle[card] = 0
        res.total[card] = 0
    }
    for(let dist of valid) {
        for (let card of dist.middle) {
            res.middle[card]++
            res.total[card]++
        }
        for(let player in dist.playerCards) {
            for(let card of dist.playerCards[player]) {
                res.players[player][card]++
                res.total[card]++
            }
        }
    }
    display(res)
}

function padStr(str, i) {
    let s = str.substring(0, i)
    return s + " ".repeat(i - s.length)
}

function padFront(str, i) {
    let s = str.substring(0, i)
    return " ".repeat(i - s.length) + s
}

function format(num, total) {
    let str = "   " + padFront((num / total * 100).toString(), 9) + "%   "
    if (num / total == 1) {
        str = str
    }
    return str
}

function display(res) {
    let playerString = "\t\t|"
    for (let player of players) {
        playerString += padFront(player.name, 13) + "   |"
    }
    playerString += padFront("Lösung", 13) + "   |\n"
    process.stdout.write(playerString)
    for(let card in res.total) {
        process.stdout.write(padStr(card, 16) + "|")
        for(let player of res.players) {
            process.stdout.write(format(player[card], res.total[card]) + "|")
        }
        process.stdout.write(format(res.middle[card], res.total[card]) + "|")
        process.stdout.write("\n")
    }
}

let myCards = [
    {
        type: "room",
        index: 6
    },
    {
        type: "weapon",
        index: 0
    },
    {
        type: "weapon",
        index: 2
    },
    {
        type: "weapon",
        index: 3
    },
    {
        type: "weapon",
        index: 5
    }
]
let gameCards = Object.assign({}, clue)

function generateMiddlePossibilites(playerCards) {
    let alldists = []
    /*for(let card of playerCards) {
        gameCards[card.type].splice(card.index, 1)
    }*/
    for(let iRoom in gameCards.room) {
        for(let iWeapon in gameCards.weapon) {
            for(let iSuspect in gameCards.suspect) {
                let middle = [clue.room[iRoom], clue.weapon[iWeapon], clue.suspect[iSuspect]]
                let remaining = gameCards.room.concat(gameCards.suspect).concat(gameCards.weapon)
                for(let card of middle) {
                    remaining.splice(remaining.indexOf(card), 1)
                }
                let retDist = generateDistributions(1000, middle, remaining, [5,4,4,5], players)
                alldists.push(...retDist)
            }
        }
    }
    return alldists
}

function getDist(middle, cardsLeft, playerCardsLeft, players) {
    let nCardsLeft = cardsLeft.slice()
    let nPlayerCardsLeft = playerCardsLeft.slice()
    let dist = {
        consistent: true,
        playerCards: [],
        middle
    }
    for(let player in players) {
        dist.playerCards.push([])
        for(let card of players[player].has) {
            if (nCardsLeft.indexOf(card) != -1 && nPlayerCardsLeft[player] > 0) {
                nPlayerCardsLeft[player]--
                nCardsLeft.splice(nCardsLeft.indexOf(card), 1)
                dist.playerCards[player].push(card)
            } else {
                dist.consistent = false
                return dist
            }
        }
    }

    for(let player in players) {
        for(let card of players[player].hasNot) {
            if (middle.indexOf(card) != -1) {
                continue
            } else if (nCardsLeft.indexOf(card) != -1) {
                let randPlayer = parseInt(csprng(16, 10)) % (players.length - 1)
                for(let i = 1; i < players.length; i++) {
                    let randPlayerI = (randPlayer + i + parseInt(player)) % players.length
                    if (nPlayerCardsLeft[randPlayerI] > 0) {
                        nPlayerCardsLeft[randPlayerI]--
                        nCardsLeft.splice(nCardsLeft.indexOf(card), 1)
                        dist.playerCards[randPlayerI].push(card)
                        break
                    } else if (i == players.length - 1) {
                        dist.consistent = false
                        return dist
                    }
                }
            }
        }
    }

    for(let card of nCardsLeft) {
        let randPlayer = Math.floor(Math.random() * players.length)
        for(let i = 0; i < players.length; i++) {
            let randPlayerI = (randPlayer + i) % players.length
            if (nPlayerCardsLeft[randPlayerI] > 0) {
                nPlayerCardsLeft[randPlayerI]--
                dist.playerCards[randPlayerI].push(card)
                break
            } else if (i == players.length - 1) {
                dist.consistent = false
                return dist
            }
        }
    }
    return dist
}

function generateDistributions(n, middle, cardsLeft, playerCardsLeft, players) {
    let ds = []
    while(n > 0) {
        let d = getDist(middle, cardsLeft, playerCardsLeft, players)
        if (d.consistent) {
            ds.push(d)
        }
        n--
    }
    return ds
}

function generateAllDistributions(middle, cardsLeft, playerCardsLeft, playerCards) {
    if (playerCardsLeft.reduce((acc, cur) => acc + cur) == 0) {
        dists.push([middle, playerCards])
        return
    }
    let nCardsLeft = cardsLeft.slice()
    let currentCard = nCardsLeft.splice(0,1)[0]
    for(let i in playerCardsLeft) {
        if(playerCardsLeft[i] > 0) {
            let nPlayerCards = playerCards.slice()
            nPlayerCards[i].push(currentCard)
            let nPlayerCardsLeft = playerCardsLeft.slice()
            nPlayerCardsLeft[i] = nPlayerCardsLeft[i] - 1
            generateAllDistributions(middle, nCardsLeft, nPlayerCardsLeft, nPlayerCards)
        }
    }
}

main()
