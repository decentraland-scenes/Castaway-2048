

// lerp data for items that come out of the chest
@Component('openLerp')
export class OpenLerp {
  closedPos: Vector3 = new Vector3(8, 0, 11)
  openPos: Vector3 = new Vector3(8, 4.5, 11)
  closedScale: number = 0.05
  openScale: number = 0.45
  fraction: number = 0
  open: boolean = false
}

// motion for items that come out of the chest
export class OpenBoard implements ISystem {
    board: IEntity
    constructor(board){
      this.board = board
    }
    update(dt: number) {
      let transform = this.board.getComponent(Transform)
      let state = this.board.getComponent(OpenLerp)
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