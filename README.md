# Castaway 2048

A fully fledged game, based on the popular game 2048, where the values are represented by a series of gems of increasing values. Click and drag to displace the gems on the board and merge them into greater values till you reach 2048.

![](screenshot/screenshot.png)

This scene shows you

- How to capture global mouse events and detect swipes in different directions
- How to handle the spawning and recycling of entities with an entity pool
- How to handle moving of various entities over positions on a grid
- How to use component groups to treat many entities of a same type in the same ways
- How to create custom components to store custom data
- How to use systems to carry out changes in the game


## Try it out

**Install the CLI**

Download and install the Decentraland CLI by running the following command:

```bash
npm i -g decentraland
```

**Previewing the scene**

Download this example and navigate to its directory, then run:

```
$:  dcl start
```

Any dependencies are installed and then the CLI opens the scene in a new browser tab.

**Scene Usage**

Click the treasure chest to open it or to reset the game.

Click and drag in a direction to move all the gems in that direction. If two identical gems are merged, they grow into a more valuable one, keep merging them until you reach one of 2048 value.

If all the spaces are full and you can't free them by merging gems, you loose.

Learn more about how to build your own scenes in our [documentation](https://docs.decentraland.org/) site.

If something doesn’t work, please [file an issue](https://github.com/decentraland-scenes/Awesome-Repository/issues/new).


## Copyright info

This scene is protected with a standard Apache 2 licence. See the terms and conditions in the [LICENSE](/LICENSE) file.
