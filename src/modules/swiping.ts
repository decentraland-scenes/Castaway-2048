

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
  buttonDown(dir: Vector3){
    this.buttonPressed = true
    this.posOnDown = dir
  }
  buttonUp(dir: Vector3){
    this.buttonPressed = false
	this.posOnUp = dir
	//Vector3.
	let arcLength = Vector3.GetAngleBetweenVectors(this.posOnDown, this.posOnUp, Vector3.Up()) * RAD2DEG
	if(Math.abs(arcLength) < 12) return


	let deltaX: number = this.posOnDown.x - this.posOnUp.x
	let deltaY: number = this.posOnDown.y - this.posOnUp.y
	
	log("deltaX: ", deltaX, " deltaY: ", deltaY)

    let direction: Directions
    if (deltaY < -0.3 && Math.abs(deltaX) < 0.2 ) {
      direction = Directions.UP
    } else if ( Math.abs(deltaY) < 0.2 && deltaX < -0.3) {
      direction = Directions.RIGHT
    } else if (deltaY > 0.3 && Math.abs(deltaX) < 0.2) {
      direction = Directions.DOWN
    } else if ( Math.abs(deltaY) < 0.2 && deltaX > 0.3) {
      direction = Directions.LEFT
    }
    log('direction ' + direction)
    return direction
  }
}