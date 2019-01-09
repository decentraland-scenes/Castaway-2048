

// possible swipe directions
export enum Directions {
    LEFT = 'left',
    UP = 'up',
    RIGHT = 'right',
    DOWN = 'down'
  }

// swipe detection class
export class SwipeDetection {
  buttonPressed: boolean = false
  posOnDown: Vector3
  posOnUp: Vector3
  minDistance: number = 5
  buttonDown(camera: Camera){
    this.buttonPressed = true
    this.posOnDown = camera.rotation.eulerAngles
  }
  buttonUp(camera: Camera){
    this.buttonPressed = false
    this.posOnUp = camera.rotation.eulerAngles
    let deltaX: number = this.posOnDown.x - this.posOnUp.x
    let deltaY: number = this.posOnDown.y - this.posOnUp.y
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
    return direction
  }
}