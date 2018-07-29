let fs = require("fs")

let data = JSON.parse(fs.readFileSync("./valid.json"))
console.log(data.filter(d => {
    return d.middle.indexOf("Eingangshalle") != -1
    && d.middle.indexOf("Grün") != -1
    && d.middle.indexOf("Heizungsrohr") != -1
    && d.playerCards[3].indexOf("Küche") == -1
    && d.playerCards[0].indexOf("Küche") == -1
    && d.playerCards[1].indexOf("Küche") != -1

}))