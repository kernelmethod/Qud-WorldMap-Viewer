# Caves of Qud - world map viewer

This repository contains a very loose collection of scripts to export the
surface map of a Caves of Qud run and viewing them in the browser.

For a real-world example, check out https://kernelmethod.org/notes/qud_worldmap/

> **WARNING:** the zone export process takes up a lot of memory. I was able to
> run it on a laptop with 16GB of memory, but YMMV.

> **WARNING:** do not use this for a game that you want to play. The export
> setup procedure will grant you a ton of XP and reveal every location on the
> world map, which you might not particularly want.
>
> If you really wish to export the world map for a run that you're still
> playing, you should make a copy of the save and export the world map from
> that copy.

## Step 1: generate tiles

The first (and most tedious) step is to export an image of every zone of the
world from the game.

In order to do this, Caves of Qud must build every zone in the z-level that
you're exporting, then take a snapshot of the zone. It has to do this 18,000
times for each zone in the same z-level.

An added challenge here (and the part that makes this require a lot of work) is
that there are memory leaks in parts of the zone generation process (@gnarf
points out that this is likely a memory leak in the waveform collapse
implementation used by Caves of Qud -- thanks for the tip!) So to do this
export, **you will need to manually restart the game 25 times, one for each
y-slice of parasangs that you want to export**.

### Step 1.1: install the `WorldMap/` subdirectory as an offline mod

Follow the "Manual Download" step on the
["Installing a Mod" wiki page](https://wiki.cavesofqud.com/wiki/Modding:Installing_a_mod#Manual_Download).
This just entails copying the `WorldMap/` folder into the correct directory for
your operating system.

### Step 1.2: start the game and run the `exportworldsetup` wish

Start Caves of Qud and open the game that you want to export the world map for.
Run the `exportworldsetup` wish; this will reveal village locations, historic
sites, and more. It'll also grant you a lot of XP (since you will occasionally
gain XP when revealing a zone, and you don't want to have to deal with a
hundred level-up prompts while exporting these zones).

Save and quit, then re-open the game.

### Step 1.3: export first strip of parasangs

Now run the `exportworld` wish. You will be prompted for the following:

- **The location you want to save the map screenshots to.** I've tried to
  choose a reasonable default location in your
  [configuration files](https://wiki.cavesofqud.com/wiki/File_locations)
  directory, but you may wish to use a different location.
- **The y-level you wish to slice.** This is the y-coordinate of the parasangs
  that you're going to export. For the first iteration you will want to use a
  y-coordinate of `0`.
- **The z-level you wish to slice.** This is the z-coordinate of the parasangs
  that you're going to export. Use the default of `10` for the surface map. For
  underground maps, you'll need to use the corresponding z-coordinate, e.g.
  `11` for the first layer under the surface.

The game will then run through all of the parasangs with a y-coordinate of `0`,
build them, and export images of them to the directory that you provided.

### Step 1.4: repeat for each y-strip of parasangs

You will now need to restart the game and repeat the previous step 24 more
times. :)

Because of a memory leak in zone generation, the game won't de-allocate the
memory it used to build zones even after you save and quit. So you'll need to
_fully exit and restart the Caves of Qud program_ before you can export the
next strip of parasangs.

For the next strip, you'll want to export the strip with a y-coordinate of `1`;
then you'll want to export the strip with a y-coordinate of `2`; and so on, up
until y-coordinate `24`.

## Step 2: convert to square tiles

Once you've exported all of the zones, run the `convert_tiles.py` script. You
may need to install dependencies from `requirements.txt` first, e.g. using

```
python3 -m pip install -r requirements.txt
```

This script will do three things:

- It'll convert all of the tiles to lossless `.webp` rather than `.png`, which
  will use a lot less storage and bandwidth.
- It'll convert all of your screenshots to squares, which Leaflet.js needs to
  render your map correctly.
- It'll combine the square tiles into larger tiles covering 2400px x 2400px
  regions, for when viewers are still relatively zoomed-out from the map.

Run the script with

```
python3 convert_tiles.py \
    --worldmap_dir /wherever/you/stored/all/of/your/screenshots \
    --output ./tiles/
```

E.g. if you're on Linux and you used the default screenshot location, you would
run

```
python3 convert_tiles.py \
    --worldmap_dir ~/.config/unity3d/Freehold\ Games/CavesOfQud/worldmap \
    --output ./tiles/
```

## Step 3: run the proof-of-concept web page

Once you've converted all of the tiles, you can use the web server of your
choice to serve the proof-of-concept `index.html` page. My preferred method
is just to use Python's built-in server:

```
python3 -m http.server
```

And that's it! If everything went correctly you should be able to see the
tiled world map in your browser.
