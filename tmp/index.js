const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());

app.get(`/api/v1/:count`, (req, res) => {
  res.status(200).json([{"media":"https://nearpunks.io/img/2015.png","id":2015,"extra":"Female, Pink With Hat, Earring, Nerd Glasses","description":"NearPunks are NFTs on the Near blockchain. Each of these 10,000 NearPunks has attributes that make them unique according to a defined rarity system.","copies":1,"title":"NearPunk #2015"},{"media":"https://nearpunks.io/img/1110.png","copies":1,"id":1110,"description":"NearPunks are NFTs on the Near blockchain. Each of these 10,000 NearPunks has attributes that make them unique according to a defined rarity system.","title":"NearPunk #1110","extra":"Female, Purple Eye Shadow, Wild Hair, Purple Lipstick, Earring"}])
})
app.listen(3001)