import { Game } from "./game.js";
import { Grid } from "./grid.js";

export class Level {
  canvas = document.querySelector('.canvas');
  levelCount = document.querySelector('.level-count');
  levelCountNum = 1;
  constructor(rowsCount, columnsCount, cellsCount) {
    this.levelCount.innerText = this.levelCountNum;
    this.game = new Game(rowsCount, columnsCount, cellsCount);
    this.grid = new Grid(this.canvas, this.game.matrix, this.game.rowsCount, this.game.columnsCount);
    this.canvas.addEventListener('newLevelStart', event => {
      console.log(event.detail, this.canvas)
    this.newLevel();
    })
  }

  newLevel() {
    //this.grid.removeAllCells();
    //this.canvas.innerHTML = '';
    this.game.matrix = null;
    this.game.init();
    console.log(this.game.matrix)
    this.levelCountNum += 1;
    this.grid.createCells();
    this.grid.createCell();
  }
}