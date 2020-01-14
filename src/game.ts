import { OpenBoard, OpenLerp } from 'modules/openchest'
import {
  MoveGems,
  GemData,
  gems,
  gemValues,
  GrowGems,
  gridToScene
} from './modules/gems'
import { SwipeDetection, Directions } from './modules/swiping'
import { BoardData } from './modules/board'

// object to get buttonUp and buttonDown events
const input = Input.instance

// object to get user position and rotation
const camera = Camera.instance

//////////////////////////////
// Helper functions

function openChest() {
  let state = boardWrapper.getComponent(OpenLerp)
  state.open = !state.open
  switch (state.open) {
    case true:
      chestOpen.play()
      chestLightOpen.play()
      // play sounds
      if (board.tutorialDone) {
        clearGems()
        addRandomGem()
      } else {
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

  getEntityFromPool(): IEntity | null {
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

    let shapeIndex = gemValues.indexOf(val)
    ent.addComponentOrReplace(gemModels[shapeIndex])

    let t = ent.getComponentOrCreate(Transform)
    t.scale.setAll(0.5)
    t.position = gridToScene(x, y)

    let td = ent.getComponentOrCreate(GemData)
    td.reset(val, x, y)

    engine.addEntity(ent)
  }
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

  for (let gem in gems.entities) {
    let gemData = gems.entities[gem].getComponent(GemData)
    let gemPos = gemData.nextPos.x + gemData.nextPos.y * 4
    let index = emptyCells.indexOf(gemPos)
    emptyCells.splice(index, 1)
  }

  if (emptyCells.length > 0) {
    var index = ~~(Math.random() * emptyCells.length)
    var cell = emptyCells[index]
    var newValue = Math.random() < board.fourProbability ? 4 : 2
    var cellY = Math.floor(cell / 4)
    var cellX = cell % 4
    log('new cell added, pos: ' + cell + '  ' + cellX + ' & ' + cellY)
    spawner.spawnGem(newValue, cellX, cellY)
  }
}

function shiftBlocks(direction: Directions) {
  var hasChanged = false
  for (var row = 0; row < board.size; ++row) {
    // Store what's in the row (or column)
    var currentRow: any[] = [null, null, null, null]
    for (let gem in gems.entities) {
      let gemPos = gems.entities[gem].getComponent(GemData).nextPos
      let pos: number
      switch (direction) {
        case Directions.UP:
          if (gemPos.x == row) {
            pos = gemPos.y * -1 + 3
          }
          break
        case Directions.RIGHT:
          if (gemPos.y == row) {
            pos = gemPos.x * -1 + 3
          }
          break
        case Directions.DOWN:
          if (gemPos.x == row) {
            pos = gemPos.y
          }
          break
        case Directions.LEFT:
          if (gemPos.y == row) {
            pos = gemPos.x
          }
          break
      }
      currentRow[pos] = gems.entities[gem]
    }

    // go over each tile in row (or column)
    for (var target = 0; target < board.size; ++target) {
      let alreadyMerged = false
      let blocked = false
      for (var tile = target + 1; tile < currentRow.length; ++tile) {
        if (currentRow[tile]) {
          let gemData = currentRow[tile].getComponent(GemData)
          // if target tile is empty, shift gems
          if (currentRow[target] == null || alreadyMerged == true) {
            moveGem(gemData, direction)
            hasChanged = true
          } else {
            // if target tile has a gem, check if it can be merged
            let targetData = currentRow[target].getComponent(GemData)
            if (
              gemData.val == targetData.val &&
              targetData.willUpgrade == false &&
              targetData.willDie == false &&
              blocked == false
            ) {
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

  if (hasChanged && board.tutorialDone) {
    addRandomGem()
    hasLost()
  }
}

function moveGem(gemData: GemData, direction: Directions) {
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

function mergeGems(gemData: GemData, targetData: GemData) {
  gemData.willDie = true
  targetData.willUpgrade = true
  targetData.val *= 2
  // Check if won
  if (targetData.val == 2048) {
    win()
  }
}

function hasLost() {
  // check if board is full
  if (gems.entities.length < 16) {
    return
  }

  var canMove: boolean = false
  var fullBoard: any[][] = [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
  ]
  for (let gem in gems.entities) {
    let gemData = gems.entities[gem].getComponent(GemData)
    if (!gemData.willDie) {
      fullBoard[gemData.nextPos.y][gemData.nextPos.x] = gemData.val
    }
  }

  log(fullBoard)

  for (var r = 0; r < board.size; ++r) {
    for (var c = 0; c < board.size; ++c) {
      canMove = fullBoard[r][c] == null ? true : canMove
      if (r < 3) {
        canMove = fullBoard[r][c] == fullBoard[r + 1][c] ? true : canMove
      }
      if (c < 3) {
        canMove = fullBoard[r][c] == fullBoard[r][c + 1] ? true : canMove
      }
    }
  }
  if (canMove == false) {
    loose()
  }
}

// Board
const boardWrapper = new Entity()
boardWrapper.addComponent(
  new Transform({
    position: new Vector3(8, 0, 10.5),
    scale: new Vector3(0.05, 0.05, 0.05)
  })
)
boardWrapper.addComponent(new OpenLerp())
engine.addEntity(boardWrapper)

function doTutorial() {
  let instructions = new Entity()
  instructions.setParent(boardWrapper)
  instructions.addComponent(
    new TextShape(
      'Drag gems by clicking and dragging anywhere. \nMerge gems until you reach the highest value!'
    )
  )
  instructions.getComponent(TextShape).fontSize = 1
  instructions.getComponent(TextShape).shadowColor = Color3.Gray()
  instructions.getComponent(TextShape).shadowOffsetY = 1
  instructions.getComponent(TextShape).shadowOffsetX = -1
  instructions.addComponent(
    new Transform({
      position: new Vector3(0, 3, -1),
      scale: new Vector3(4, 4, 1)
    })
  )
  engine.addEntity(instructions)

  let buttonMaterial = new Material()
  buttonMaterial.albedoColor = Color3.Blue()

  let button = new Entity()
  button.addComponent(new PlaneShape())
  button.addComponent(buttonMaterial)
  button.setParent(boardWrapper)
  button.addComponent(
    new Transform({
      position: new Vector3(0, -2.5, -0.5)
    })
  )
  button.addComponent(
    new OnPointerDown(
      e => {
        engine.removeEntity(button)
        engine.removeEntity(instructions)
        board.tutorialDone = true
        clearGems()
        addRandomGem()
      },
      { button: ActionButton.POINTER, hoverText: 'Start' }
    )
  )

  engine.addEntity(button)

  let buttonText = new Entity()
  buttonText.setParent(button)
  buttonText.addComponent(new TextShape("Let's start!"))
  buttonText.getComponent(TextShape).fontSize = 1
  buttonText.addComponent(
    new Transform({
      position: new Vector3(0, 0, -0.3)
    })
  )
  engine.addEntity(buttonText)

  spawner.spawnGem(2, 1, 2)
  spawner.spawnGem(2, 3, 2)
}

function clearGems() {
  for (const gem of gems.entities) {
    engine.removeEntity(gem)
  }
}

///////////////////////////
// INITIAL POSITIONS OF ENTITIES

// Board object
const board = new BoardData()

// Island
const island = new Entity()
island.addComponent(new GLTFShape('models/Island.gltf'))
island.addComponent(
  new Transform({
    position: new Vector3(8, 0, 10.25),
    rotation: Quaternion.Euler(0, 270, 0)
  })
)
engine.addEntity(island)

// Banner
const bannerTexture = new Texture('textures/Logo2048.png')
const bannerMaterial = new BasicMaterial()
bannerMaterial.texture = bannerTexture

const banner = new Entity()
banner.addComponent(bannerMaterial)
banner.addComponent(new PlaneShape())
banner.addComponent(
  new Transform({
    position: new Vector3(8, 8, 10.5),
    scale: new Vector3(6, 6, 6)
  })
)
engine.addEntity(banner)

// Chest
const chest = new Entity()
chest.addComponent(
  new Transform({
    position: new Vector3(8, 0.2, 10.5),
    rotation: Quaternion.Euler(0, 270, 0),
    scale: new Vector3(0.8, 0.8, 0.8)
  })
)
chest.addComponent(new GLTFShape('models/Chest.gltf'))
let chestAnimator = new Animator()
chest.addComponent(chestAnimator)
const chestOpen = new AnimationState('Open')
chestOpen.looping = false
const chestClose = new AnimationState('Close')
chestClose.looping = false
chestAnimator.addClip(chestOpen)
chestAnimator.addClip(chestClose)
chest.addComponent(
  new OnPointerDown(
    e => {
      openChest()
    },
    { button: ActionButton.POINTER, hoverText: 'Open' }
  )
)

engine.addEntity(chest)

// Chest Light
const chestLight = new Entity()
chestLight.addComponent(
  new Transform({ rotation: Quaternion.Euler(0, 180, 0) })
)
chestLight.setParent(chest)
chestLight.addComponent(new GLTFShape('models/Light.gltf'))
let chestLightAnimator = new Animator()
chestLight.addComponent(chestLightAnimator)
const chestLightOpen = new AnimationState('Light_Open')
const chestLightClose = new AnimationState('Light_Close')
chestLightOpen.looping = false
chestLightClose.looping = false
chestLightAnimator.addClip(chestLightOpen)
chestLightAnimator.addClip(chestLightClose)
engine.addEntity(chestLight)

// Map
const map = new Entity()
map.setParent(boardWrapper)
map.addComponent(
  new Transform({
    position: new Vector3(0, 1, 0),
    rotation: Quaternion.Euler(0, 180, 0),
    scale: new Vector3(2, 2, 2)
  })
)
map.addComponent(new GLTFShape('models/Map.gltf'))
engine.addEntity(map)

// 3D models for gems

let gemModels = []

let gemVal = 2
for (let i = 0; i < gemValues.length; i++) {
  let gemMod = new GLTFShape('models/' + gemVal + '.glb')
  gemModels.push(gemMod)
  gemVal *= 2
}

// Swipe detector singleton

let swipeChecker = new SwipeDetection()

// Swipe detection

input.subscribe('BUTTON_DOWN', ActionButton.POINTER, false, e => {
  swipeChecker.buttonDown(e.direction)
  //log("button down")
})

// button up event
input.subscribe('BUTTON_UP', ActionButton.POINTER, false, e => {
  let direction = swipeChecker.buttonUp(e.direction)
  shiftBlocks(direction)
  //log("button up", direction)
})

// loose

function loose() {
  log('YOU LOST')
}

// win

function win() {
  log('YOU WON!')
}

///////////////////////////
// Add systems

engine.addSystem(new OpenBoard(boardWrapper))

engine.addSystem(new MoveGems(gemModels))

engine.addSystem(new GrowGems())

// MISSING:

// Sounds
// Bug with opening chest
// Tutorial
// Sprite clouds when merging
