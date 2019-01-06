import { playSound } from '@decentraland/SoundController'

const input = Input.instance

const camera = Camera.instance

const values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048]

export enum Directions {
  LEFT = 'left',
  UP = 'up',
  RIGHT = 'right',
  DOWN = 'down'
}

// CUSTOM COMPONENTS

@Component('openLerp')
export class OpenLerp {
  closedPos: Vector3 = new Vector3(5, 0, 5)
  openPos: Vector3 = new Vector3(5, 4.5, 5)
  closedScale: number = 0.05
  openScale: number = 0.45
  fraction: number = 0
  open: boolean = false
}

@Component('swipeDetection')
export class SwipeDetection {
  buttonPressed: boolean = false
  posOnDown: Vector3
  posOnUp: Vector3
  minDistance: number = 5
}

@Component('tileData')
export class TileData {
  val: number
  pos: Vector2 //maybe not needed
  nextPos: Vector2
  oldPos: Vector2
  lerp: number
  sizeLerp: number
  willDie: boolean
  willUpgrade: boolean
  constructor(val?: number, x?: number, y?: number) {
    this.val = val
    this.pos = new Vector2(x, y)
    this.nextPos = new Vector2(x, y)
    this.oldPos = new Vector2(x, y)
    this.lerp = 1
    this.sizeLerp = 0
    this.willDie = false
    this.willUpgrade = false
  }
  reset(val: number, x: number, y: number) {
    this.val = val
    this.pos = new Vector2(x, y)
    this.nextPos = new Vector2(x, y)
    this.oldPos = new Vector2(x, y)
    this.lerp = 1
    this.sizeLerp = 0
    this.willDie = false
    this.willUpgrade = false
  }
}

@Component('boardData')
export class BoardData {
  won: boolean
  lost: boolean
  size: number = 4
  fourProbability: number = 0.1
  deltaX: number[] = [-1, 0, 1, 0]
  deltaY: number[] = [0, -1, 0, 1]
  tutorialDone: boolean = false
}

///////////////////////////
// Entity groups

const gems = engine.getComponentGroup(Transform, TileData)

///////////////////////////
// Systems

// Open Chest
export class OpenBoard implements ISystem {
  update(dt: number) {
    let transform = boardWrapper.get(Transform)
    let state = boardWrapper.get(OpenLerp)
    if (state.open == true && state.fraction < 1) {
      transform.position = Vector3.Lerp(
        state.closedPos,
        state.openPos,
        state.fraction
      )
      transform.scale.setAll(
        Scalar.Lerp(state.closedScale, state.openScale, state.fraction)
      )
      state.fraction += 1 / 30
    } else if (state.open == false && state.fraction > 0) {
      transform.position = Vector3.Lerp(
        state.closedPos,
        state.openPos,
        state.fraction
      )
      transform.scale.setAll(
        Scalar.Lerp(state.closedScale, state.openScale, state.fraction)
      )
      state.fraction -= 1 / 30
    }
  }
}

engine.addSystem(new OpenBoard())

// Move tiles

export class MoveTiles implements ISystem {
  update(dt: number) {
    for (let gem of gems.entities) {
      let data = gem.get(TileData)
      let transform = gem.get(Transform)
      if (data.lerp < 1) {
        data.lerp += dt * 2
        if (data.lerp > 1) {
          data.lerp = 1
        }
        data.pos = Vector2.Lerp(data.oldPos, data.nextPos, data.lerp)
        transform.position = gridToScene(data.pos.x, data.pos.y)
      } else {
        data.oldPos = data.pos
        if (data.willDie) {
          engine.removeEntity(gem)
          for (let targetGem of gems.entities) {
            let targetData = targetGem.get(TileData)
            if (
              targetData.pos.x == data.pos.x &&
              targetData.pos.y == data.pos.y &&
              targetData.willUpgrade
            ) {
              let targetModelVal = targetData.val
              let shapeIndex = values.indexOf(targetModelVal)
              targetGem.set(gemModels[shapeIndex])
              targetData.willUpgrade = false
            }
          }
        }
      }
    }
  }
}

engine.addSystem(new MoveTiles())

// Grow tiles

export class GrowTiles implements ISystem {
  update(dt: number) {
    for (let gem of gems.entities) {
      let data = gem.get(TileData)
      let transform = gem.get(Transform)
      if (data.sizeLerp < 1) {
        data.sizeLerp += dt
        transform.scale.setAll(Scalar.Lerp(0.05, 0.5, data.sizeLerp))
      }
    }
  }
}

engine.addSystem(new GrowTiles())

//////////////////////////////
// OTHER FUNCTIONS

function openChest() {
  let state = boardWrapper.get(OpenLerp)
  state.open = !state.open
  switch (state.open) {
    case true:
      chestOpen.play()
      chestLightOpen.play()
      // play sounds
      if (board.get(BoardData).tutorialDone){
        clearGems()
        addRandomGem()
      }
      else{
        doTutorial()
      }
      
      break
    case false:
      chestClose.play()
      chestLightClose.play()
      // end sounds
      break
  }
}

// Create gems using object pool
const spawner = {
  MAX_POOL_SIZE: 20,
  pool: [] as Entity[],

  getEntityFromPool(): Entity | null {
    for (let i = 0; i < spawner.pool.length; i++) {
      if (!spawner.pool[i].alive) {
        return spawner.pool[i]
      }
    }

    if (spawner.pool.length < spawner.MAX_POOL_SIZE) {
      const instance = new Entity()
      instance.setParent(map)
      spawner.pool.push(instance)
      return instance
    }

    return null
  },

  spawnGem(val: number, x: number, y: number) {
    const ent = spawner.getEntityFromPool()

    if (!ent) return

    let shapeIndex = values.indexOf(val)
    ent.set(gemModels[shapeIndex])

    let t = ent.getOrCreate(Transform)
    t.scale.setAll(0.5)
    t.position = gridToScene(x, y)

    let td = ent.getOrCreate(TileData)
    td.reset(val, x, y)

    engine.addEntity(ent)
  }
}

function gridToScene(x: number, y: number) {
  let convertedPos = new Vector3(x + 1 - 2.5, -y + 1 + 0.5, 0)
  return convertedPos
}

function addRandomGem() {
  var emptyCells: number[] = [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15
  ]
  var boardData = board.get(BoardData)
  for (let tile in gems.entities) {
    let tileData = gems.entities[tile].get(TileData)
    let tilePos = tileData.nextPos.x + tileData.nextPos.y * 4
    let index = emptyCells.indexOf(tilePos)
    emptyCells.splice(index, 1)
  }

  if (emptyCells.length > 0){
    var index = ~~(Math.random() * emptyCells.length)
    var cell = emptyCells[index]
    var newValue = Math.random() < boardData.fourProbability ? 4 : 2
    var cellY = Math.floor(cell / 4)
    var cellX = cell % 4
    log('new cell added, pos: ' + cell + '  ' + cellX + ' & ' + cellY)
    spawner.spawnGem(newValue, cellX, cellY)
  }
}

function shiftBlocks(direction: Directions) {
  var boardData = board.get(BoardData)
  var hasChanged = false
  for (var row = 0; row < boardData.size; ++row) {
    // Store what's in the row (or column)
    var currentRow: any[] = [null, null, null, null]
    for (let gem in gems.entities) {
      let tilePos = gems.entities[gem].get(TileData).nextPos
      let pos :number
      switch (direction){
        case Directions.UP:
          if (tilePos.x == row) {
            pos = (tilePos.y * -1 ) + 3
          }
          break
        case Directions.RIGHT:
          if (tilePos.y == row) {
            pos = (tilePos.x * -1 ) + 3
          }
          break
        case Directions.DOWN:
          if (tilePos.x == row) {
            pos = tilePos.y
          }
          break
        case Directions.LEFT:
          if (tilePos.y == row) {
           pos = tilePos.x
          }
          break
      }  
      currentRow[pos] = gems.entities[gem]
    }
    
    // go over each tile in row (or column)
    for (var target = 0; target < boardData.size; ++target) {
      let alreadyMerged = false
      let blocked = false
      for (var tile = target + 1; tile < currentRow.length; ++tile) {
        if (currentRow[tile]) {
          let gemData = currentRow[tile].get(TileData)
          // if target tile is empty, shift gems
          if (currentRow[target] == null ||  alreadyMerged == true) {
            moveGem(gemData, direction)
            hasChanged = true
          } else {
            // if target tile has a gem, check if it can be merged
            let targetData = currentRow[target].get(TileData)
            if (gemData.val == targetData.val && 
                targetData.willUpgrade == false && 
                targetData.willDie == false &&
                blocked == false) {
              moveGem(gemData, direction)
              mergeGems(gemData, targetData)
              alreadyMerged = true
              hasChanged = true
            }
          }
          blocked = true
        }
      }
    }
  }

  if (hasChanged && boardData.tutorialDone){
    addRandomGem()
    hasLost()
  }

  // check if lost
}

function moveGem(gemData: TileData, direction: Directions) {
  switch (direction) {
    case Directions.UP:
      gemData.nextPos.y++
      break
    case Directions.RIGHT:
      gemData.nextPos.x++
      break
    case Directions.DOWN:
      gemData.nextPos.y--
      break
    case Directions.LEFT:
      gemData.nextPos.x--
      break
  }
  gemData.lerp = 0
}

function mergeGems(gemData: TileData, targetData: TileData){
  gemData.willDie = true
  targetData.willUpgrade = true
  targetData.val *= 2
  // Check if won
  if (targetData.val == 2048){
    win()
  }
}


function hasLost(){
    // check if board is full
    if (gems.entities.length < 16) {return} 

    var canMove: boolean = false;
    var boardData = board.get(BoardData)
    var fullBoard: any[][] = [[null, null, null, null],[null, null, null, null],[null, null, null, null],[null, null, null, null]]
    for (let gem in gems.entities) {
        let gemData = gems.entities[gem].get(TileData)
        if (!gemData.willDie){
          fullBoard[gemData.nextPos.y][gemData.nextPos.x] = gemData.val
        }
        
    }

    log(fullBoard)

     for (var r = 0; r < boardData.size; ++r) {
       for (var c = 0; c < boardData.size; ++c) {
        canMove = fullBoard[r][c] == null? true: canMove
        if (r < 3){
          canMove = fullBoard[r][c] == fullBoard[r+1][c]? true: canMove
         }
         if (c < 3){
          canMove = fullBoard[r][c] == fullBoard[r][c+1]? true: canMove
         }
       }
     }
    if (canMove == false){
      loose()
    }

}



function doTutorial(){
  let instructions = new Entity()
  instructions.setParent(boardWrapper)
  instructions.set(new TextShape("Drag tiles by clicking and dragging anywhere. \nMerge tiles until you reach the highest value!"))
  instructions.get(TextShape).fontSize = 25
  instructions.get(TextShape).shadowColor = Color3.Gray()
  instructions.get(TextShape).shadowOffsetY = 1
  instructions.get(TextShape).shadowOffsetX = -1
  instructions.set(new Transform({
    position: new Vector3(0, 3, -1),
    scale: new Vector3(8, 8, 1)
  }))
  engine.addEntity(instructions)

  let buttonMaterial = new Material()
  buttonMaterial.albedoColor = Color3.Blue()

  let button = new Entity()
  button.set(new PlaneShape())
  button.set(buttonMaterial)
  button.setParent(boardWrapper)
  button.set(new Transform({
    position: new Vector3(0, -2.5, -0.5)
  }))
  button.set(new OnClick(e => {
    engine.removeEntity(button)
    engine.removeEntity(instructions)
    board.get(BoardData).tutorialDone = true
    clearGems()
    addRandomGem()
  }))

  engine.addEntity(button)

  let buttonText = new Entity()
  buttonText.setParent(button)
  buttonText.set(new TextShape("Let's start!"))
  engine.addEntity(buttonText)

  spawner.spawnGem(2, 1, 2)
  spawner.spawnGem(2, 3, 2)

}

function clearGems(){
  for (const gem of gems.entities){
    engine.removeEntity(gem)
  }
}

///////////////////////////
// INITIAL POSITIONS OF STUFF

// Board object
const board = new Entity()
board.set(new BoardData())

// Island
const island = new Entity()
island.set(new GLTFShape('models/Island.gltf'))
island.set(new Transform({
  position: new Vector3(5, 0, 5),
  rotation: Quaternion.Euler(0, 90, 0)
}))
engine.addEntity(island)

// Banner
const bannerImage = new BasicMaterial()
bannerImage.texture = 'textures/Logo2048.png'

const banner = new Entity()
banner.set(bannerImage)
banner.set(new PlaneShape())
banner.set(new Transform({
  position: new Vector3(5, 8, 5),
  scale: new Vector3(6, 6, 6)
}))
engine.addEntity(banner)

// Chest
const chest = new Entity()
chest.set(new Transform({
  position: new Vector3(5, 0.2, 5),
  rotation: Quaternion.Euler(0, 90, 0),
  scale: new Vector3(0.8, 0.8, 0.8)
}))
chest.set(new GLTFShape('models/Chest.gltf'))
const chestOpen = new AnimationClip('Open', { loop: false })
const chestClose = new AnimationClip('Close', { loop: false })
chest.get(GLTFShape).addClip(chestOpen)
chest.get(GLTFShape).addClip(chestClose)
chest.set(
  new OnClick(e => {
    openChest()
  })
)

engine.addEntity(chest)

// Chest Light
const chestLight = new Entity()
chestLight.set(new Transform())
chestLight.setParent(chest)
chestLight.set(new GLTFShape('models/Light.gltf'))
const chestLightOpen = new AnimationClip('Light_Open', { loop: false })
const chestLightClose = new AnimationClip('Light_Close', { loop: false })
chestLight.get(GLTFShape).addClip(chestLightOpen)
chestLight.get(GLTFShape).addClip(chestLightClose)
engine.addEntity(chestLight)

// Board
const boardWrapper = new Entity()
boardWrapper.set(new Transform({
  position: new Vector3(5, 0, 5),
  scale: new Vector3(0.05, 0.05, 0.05)
}))
boardWrapper.set(new OpenLerp())
engine.addEntity(boardWrapper)

// Map
const map = new Entity()
map.setParent(boardWrapper)
map.set(new Transform({
  position: new Vector3(0, 1, 0),
  scale: new Vector3(2, 2, 2)
}))
map.set(new GLTFShape('models/Map.gltf'))
engine.addEntity(map)

// Swipe detector singleton

let swipeChecker = new Entity()
swipeChecker.set(new SwipeDetection())

// 3D models for gems

let gemModels = []

let gemVal = 2
for (let i = 0; i < values.length; i++) {
  let gemMod = new GLTFShape('models/' + gemVal + '.glb')
  gemModels.push(gemMod)
  gemVal *= 2
}

///////////////////////////////
// Event based functions

// Swipe detection

input.subscribe('BUTTON_A_DOWN', e => {
  let swipes = swipeChecker.get(SwipeDetection)
  swipes.buttonPressed = true
  swipes.posOnDown = camera.rotation.eulerAngles
})

// button up event
input.subscribe('BUTTON_A_UP', e => {
  let swipes = swipeChecker.get(SwipeDetection)
  swipes.buttonPressed = false
  swipes.posOnUp = camera.rotation.eulerAngles
  let deltaX: number = swipes.posOnDown.x - swipes.posOnUp.x
  let deltaY: number = swipes.posOnDown.y - swipes.posOnUp.y
  let direction: Directions
  if (Math.abs(deltaY) < 3 && deltaX < -5) {
    direction = Directions.UP
  } else if (deltaY > 5 && Math.abs(deltaX) < 3) {
    direction = Directions.RIGHT
  } else if (Math.abs(deltaY) < 3 && deltaX > 5) {
    direction = Directions.DOWN
  } else if (deltaY < -5 && Math.abs(deltaX) < 3) {
    direction = Directions.LEFT
  }
  log('direction ' + direction)
  shiftBlocks(direction)
})

function loose() {
  log('YOU LOST')
}

function win() {
  log('YOU WON!')
}


// MISSING:

// Sounds
// Bug with opening chest
// Tutorial
// Sprite clouds when merging
