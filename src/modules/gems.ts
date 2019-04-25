// gem values
export const gemValues = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048]

// data about each gem
@Component('gemData')
export class GemData {
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

// component group listing all gems
export const gems = engine.getComponentGroup(Transform, GemData)

// move gems when swiping
export class MoveGems implements ISystem {
  gemModels: GLTFShape[]
  constructor(models) {
    this.gemModels = models
  }
  update(dt: number) {
    for (let gem of gems.entities) {
      let data = gem.getComponent(GemData)
      let transform = gem.getComponent(Transform)
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
            let targetData = targetGem.getComponent(GemData)
            if (
              targetData.pos.x == data.pos.x &&
              targetData.pos.y == data.pos.y &&
              targetData.willUpgrade
            ) {
              let targetModelVal = targetData.val
              let shapeIndex = gemValues.indexOf(targetModelVal)
              targetGem.addComponentOrReplace(this.gemModels[shapeIndex])
              targetData.willUpgrade = false
            }
          }
        }
      }
    }
  }
}

// enlarge gems that just appeared on the board
export class GrowGems implements ISystem {
  update(dt: number) {
    for (let gem of gems.entities) {
      let data = gem.getComponent(GemData)
      let transform = gem.getComponent(Transform)
      if (data.sizeLerp < 1) {
        data.sizeLerp += dt
        transform.scale.setAll(Scalar.Lerp(0.05, 0.5, data.sizeLerp))
      }
    }
  }
}

// translate x,y 2D coordinates into x,y,z 3D coordinates
export function gridToScene(x: number, y: number) {
  let convertedPos = new Vector3(x + 1 - 2.5, -y + 1 + 0.5, 0)
  return convertedPos
}
