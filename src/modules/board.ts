export class BoardData {
  won: boolean
  lost: boolean
  size: number = 4
  fourProbability: number = 0.1
  deltaX: number[] = [-1, 0, 1, 0]
  deltaY: number[] = [0, -1, 0, 1]
  tutorialDone: boolean = false
}
