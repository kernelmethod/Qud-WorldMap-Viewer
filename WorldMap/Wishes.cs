using ConsoleLib.Console;
using Genkit;
using Kobold;
using System;
using System.IO;
using UnityEngine;
using XRL;
using XRL.Wish;
using XRL.World;
using XRL.World.Capabilities;
using XRL.UI;

using Kernelmethod.WorldMap.Patches;

namespace Kernelmethod.WorldMap {
    [HasWishCommand]
    public class WishHandler {
        /// <summary>
        /// Reveal secrets, level character, etc. in preparation for exporting the world
        /// map.
        /// </summary>
        [WishCommand(Command = "exportworldsetup")]
        public static bool ExportWorldSetup() {
            Wishing.HandleWish(The.Player, "xp:1000000");
            Wishing.HandleWish(The.Player, "villagereveal");
            Wishing.HandleWish(The.Player, "sultanreveal");
            Wishing.HandleWish(The.Player, "revealmapnotes");
            Wishing.HandleWish(The.Player, "revealsecret:$beylah");
            Wishing.HandleWish(The.Player, "revealsecret:$skrefcorpse");
            Wishing.HandleWish(The.Player, "revealsecret:$hydropon");
            The.ZoneManager.GetZone("JoppaWorld").BroadcastEvent("BeyLahReveal");
            return true;
        }

        [WishCommand(Command = "exportzone")]
        public static bool ExportZoneWishHandler() {
            var zone = The.Player?.GetCurrentZone();
            if (zone == null) {
                Popup.Show("Could not find player's current zone");
                return true;
            }

            var savePath = DataManager.SavePath("zone.png");
            ExportZone(zone, savePath);

            return true;
        }

        [WishCommand(Command = "exportworld")]
        public static bool ExportWorldWishHandler() {
            var defaultPath = DataManager.SavePath("worldmap");
            var location = Popup.AskString(
                "Where would you like to save the world map to?",
                Default: defaultPath,
                MaxLength: 4096,
                ReturnNullForEscape: true
            );

            if (location == null)
                return true;

            var y = Popup.AskNumber(
                "What y-coordinate would you like to slice?"
            );
            if (y == null)
                return true;

            var z = Popup.AskNumber(
                "What z-coordinate would you like to slice?"
            );
            if (z == null)
                return true;

            Directory.CreateDirectory(location);

            var zone = The.ZoneManager.GetZone("JoppaWorld");
            ExportZone(zone, Path.Combine(location, "world.png"));

            for (var j = 0; j < 80; j++) {
                for (var k = 0; k < 3; k++) {
                    for (var l = 0; l < 3; l++) {
                        var zoneID = $"JoppaWorld.{j}.{y}.{k}.{l}.{z}";
                        zone = The.ZoneManager.GetZone(zoneID);
                        ExportZone(zone, Path.Combine(location, $"{zoneID}.png"));
                    }
                }
            }

            return true;
        }

        /// <summary>
        /// Convert a zone to a .PNG file and save it at the specified location.
        /// </summary>
        public static void ExportZone(Zone zone, string savePath) {
            var start = DateTime.Now;

            IBaseJournalEntryPatches.DisableMessages = true;
            var cells = new SnapshotRenderable[zone.Width, zone.Height];
            for (var j = 0; j < zone.Height; j++) {
                for (var i = 0; i < zone.Width; i++) {
                    var ch = new ConsoleChar();
                    var rendered = zone.GetCell(i, j).Render(ch, Visible: true, LightLevel.Light, Explored: true, Alt: false);
                    var snapshot = new SnapshotRenderable(rendered);
                    snapshot.DetailColor = ch.DetailCode;
                    cells[i, j] = snapshot;
                }
            }

            var zoneWidth = zone.Width;
            var zoneHeight = zone.Height;
            var zoneID = zone.ZoneID;

            GameManager.Instance.uiQueue.queueTask(delegate {
                var MapTexture = new Texture2D(16 * zoneWidth, 24 * zoneHeight, textureFormat: TextureFormat.ARGB32, mipChain: false);
                // MapTexture.filterMode = UnityEngine.FilterMode.Point;
                // var MapTexture = UniversalPublicTexture;

                var baseColor = ConsoleLib.Console.ColorUtility.FromWebColor("041312");
                var black = ConsoleLib.Console.ColorUtility.ColorMap['K'];

                var mapPixels = MapTexture.GetPixels();
                for (var i = 0; i < mapPixels.Length; i++) {
                    mapPixels[i] = new Color(0f, 0f, 0f, 0f);
                }

                for (var j = 0; j < zoneHeight; j++) {
                    for (var i = 0; i < zoneWidth; i++) {
                        var cellTile = cells[i, j];

                        var sprite = SpriteManager.GetUnitySprite(cellTile.GetSpriteName());
                        var fgc = ConsoleLib.Console.ColorUtility.colorFromChar(cellTile.GetForegroundColor());
                        var bgc = ConsoleLib.Console.ColorUtility.colorFromChar(cellTile.getDetailColor());

                        for (var k = 0; k < 16; k++) {
                            for (var l = 0; l < 24; l++) {
                                var x = cellTile.getHFlip() ? 16 - k : k;
                                var y = cellTile.getVFlip() ? 24 - l : l;
                                var pixel = sprite.texture.GetPixel(x, y);
                                var pixelColor = baseColor;

                                // Reference: MapScrollerController.RenderAccomplishment
                                if (pixel.a <= 0f) {
                                    pixelColor = baseColor;
                                }
                                else if (pixel.r < 0.5) {
                                    pixelColor = Color.Lerp(fgc, black, 0f);
                                }
                                else if (pixel.r >= 0.5) {
                                    pixelColor = Color.Lerp(bgc, black, 0f);
                                }

                                var idxX = i * 16 + k;
                                var idxY = (25 - j - 1) * 24 + l;
                                mapPixels[idxX + idxY * zoneWidth * 16] = pixelColor;
                            }
                        }
                    }
                }

                MapTexture.SetPixels(mapPixels);
                File.WriteAllBytes(savePath, MapTexture.EncodeToPNG());
            });

            IBaseJournalEntryPatches.DisableMessages = false;

            var time = DateTime.Now - start;
            var timeFormatted = $"{time.Seconds}.{time.Milliseconds.ToString().PadLeft(3, '0')}";
            MetricsManager.LogInfo($"Wrote map for zone {zoneID} to {savePath} in {timeFormatted}s");
        }
    }
}
